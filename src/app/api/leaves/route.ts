import { randomUUID } from 'crypto'

import { NextResponse } from 'next/server'

import { generateLeafBacklog } from '@/lib/coverage/backlog-generator'
import { mockLeaves } from '@/lib/mock-data'
import { getSupabaseServerClient } from '@/lib/supabase'
import { Leaf } from '@/types'

export async function GET() {
  const supabase = getSupabaseServerClient()

  if (supabase) {
    const { data, error } = await supabase.from('leaves').select('*').order('created_at', { ascending: false })
    if (!error && data) {
      return NextResponse.json(data)
    }
  }

  return NextResponse.json(mockLeaves)
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<Leaf>

  const leaf: Leaf = {
    id: randomUUID(),
    name: body.name ?? 'Nova Leaf',
    category_path: body.category_path ?? 'Categoria não informada',
    ncm: body.ncm,
    coverage_pct: 0,
    status: 'incomplete',
    tasks_total: 0,
    tasks_done: 0,
    created_at: new Date().toISOString()
  }

  const supabase = getSupabaseServerClient()
  if (supabase) {
    const { data, error } = await supabase.from('leaves').insert(leaf).select().single()
    if (!error && data) {
      const createdLeaf = data as Leaf

      // Auto-generate backlog for the new leaf
      try {
        const backlog = await generateLeafBacklog(createdLeaf.id, createdLeaf.name)
        console.info(`[leaves/POST] Backlog gerado: ${backlog.tasks_created} tasks para leaf ${createdLeaf.id}`)

        // Update tasks_total on the leaf
        await supabase
          .from('leaves')
          .update({ tasks_total: backlog.tasks_created })
          .eq('id', createdLeaf.id)

        return NextResponse.json(
          { ...createdLeaf, tasks_total: backlog.tasks_created, backlog },
          { status: 201 }
        )
      } catch (backlogError) {
        console.error('[leaves/POST] Falha ao gerar backlog:', backlogError)
        return NextResponse.json(createdLeaf, { status: 201 })
      }
    }
  }

  // Mock mode: generate backlog silently
  try {
    const backlog = await generateLeafBacklog(leaf.id, leaf.name)
    return NextResponse.json(
      { ...leaf, tasks_total: backlog.tasks_created, backlog },
      { status: 201 }
    )
  } catch {
    return NextResponse.json(leaf, { status: 201 })
  }
}
