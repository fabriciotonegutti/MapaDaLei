import { NextResponse } from 'next/server'

import { detectAndTriggerReanalysis } from '@/lib/monitor/change-detector'
import { checkForChanges } from '@/lib/monitor/hash-checker'
import { getSupabaseServerClient } from '@/lib/supabase'

export async function POST(request: Request) {
  let body: { evidenceId?: string; all?: boolean }

  try {
    body = (await request.json()) as { evidenceId?: string; all?: boolean }
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const { evidenceId, all } = body

  if (all) {
    const supabase = getSupabaseServerClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase não configurado' }, { status: 503 })
    }

    const { data: evidences, error } = await supabase
      .from('legislative_evidence')
      .select('id')
      .order('last_checked_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const results = []
    for (const ev of evidences as Array<{ id: string }>) {
      try {
        const result = await detectAndTriggerReanalysis(ev.id)
        results.push({ evidenceId: ev.id, ...result })
      } catch (err) {
        results.push({
          evidenceId: ev.id,
          error: err instanceof Error ? err.message : String(err)
        })
      }
    }

    return NextResponse.json({ results, total: results.length })
  }

  if (!evidenceId) {
    return NextResponse.json({ error: 'evidenceId ou all:true obrigatório' }, { status: 400 })
  }

  try {
    const hashResult = await checkForChanges(evidenceId)
    const detectionResult = await detectAndTriggerReanalysis(evidenceId)

    return NextResponse.json({
      evidenceId,
      hash: hashResult,
      detection: detectionResult
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}
