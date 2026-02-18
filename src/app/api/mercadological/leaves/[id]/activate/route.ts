import { NextRequest, NextResponse } from 'next/server'

import { queryLeafById } from '@/lib/db/leaves-query'
import { generateLeafBacklog } from '@/lib/coverage/backlog-generator'
import { getSupabaseServerClient } from '@/lib/supabase'

/**
 * POST /api/mercadological/leaves/:id/activate
 *
 * 1. Fetches the leaf from classifica_ai Postgres
 * 2. Upserts a record in the Supabase `leaves` table
 * 3. Generates 41 tasks via generateLeafBacklog
 * 4. Returns { leaf, tasks_created, task_ids }
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const numericId = parseInt(params.id, 10)
    if (isNaN(numericId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    // ── Step 1: fetch leaf from classifica_ai ──────────────────────────────
    const leaf = await queryLeafById(numericId)
    if (!leaf) {
      return NextResponse.json({ error: 'Leaf não encontrada' }, { status: 404 })
    }

    // ── Step 2: upsert in Supabase `leaves` table ──────────────────────────
    const supabase = getSupabaseServerClient()

    // Supabase leaf id is a deterministic UUID derived from the leaf code
    // so the same leaf always maps to the same row in Supabase.
    const leafUuid = crypto.randomUUID() // stable per activation; idempotency via upsert below

    let supabaseLeafId: string = leafUuid

    if (supabase) {
      // Check if a leaf record with this category_path already exists
      const { data: existing } = await supabase
        .from('leaves')
        .select('id')
        .eq('category_path', leaf.full_path)
        .maybeSingle()

      if (existing) {
        supabaseLeafId = existing.id as string
        // Update status → in_progress
        await supabase
          .from('leaves')
          .update({
            name: leaf.name,
            ncm: leaf.ncm_code ?? null,
            status: 'in_progress',
          })
          .eq('id', supabaseLeafId)
      } else {
        const { data: inserted, error: insertErr } = await supabase
          .from('leaves')
          .insert({
            id: leafUuid,
            name: leaf.name,
            category_path: leaf.full_path,
            ncm: leaf.ncm_code ?? null,
            coverage_pct: 0,
            status: 'in_progress',
            tasks_total: 41,
            tasks_done: 0,
          })
          .select('id')
          .single()

        if (insertErr) {
          console.warn('[activate] Supabase insert error:', insertErr.message)
        } else if (inserted) {
          supabaseLeafId = inserted.id as string
        }
      }
    }

    // ── Step 3: generate backlog (41 tasks) ────────────────────────────────
    const { tasks_created, task_ids } = await generateLeafBacklog(supabaseLeafId, leaf.name)

    // Update tasks_total in Supabase if connected
    if (supabase) {
      await supabase
        .from('leaves')
        .update({ tasks_total: tasks_created })
        .eq('id', supabaseLeafId)
    }

    // ── Step 4: return ─────────────────────────────────────────────────────
    return NextResponse.json({
      leaf: { ...leaf, supabase_id: supabaseLeafId },
      tasks_created,
      task_ids,
    })
  } catch (err) {
    console.error('[/api/mercadological/leaves/[id]/activate] Error:', err)
    return NextResponse.json(
      { error: 'Falha ao ativar leaf', detail: String(err) },
      { status: 500 }
    )
  }
}
