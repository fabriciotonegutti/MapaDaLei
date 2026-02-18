import { NextResponse } from 'next/server'

import { mockTasks } from '@/lib/mock-data'
import { getSupabaseServerClient } from '@/lib/supabase'
import { Task } from '@/types'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const leafId = searchParams.get('leafId')
  const supabase = getSupabaseServerClient()

  if (supabase) {
    let query = supabase.from('tasks').select('*').order('updated_at', { ascending: false })
    if (leafId) {
      query = query.eq('leaf_id', leafId)
    }

    const { data, error } = await query
    if (!error && data) {
      return NextResponse.json(data)
    }
  }

  const filtered = leafId ? mockTasks.filter((task) => task.leaf_id === leafId) : mockTasks
  return NextResponse.json(filtered)
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as Partial<Task> & { id: number }

  if (!body.id) {
    return NextResponse.json({ message: 'id é obrigatório' }, { status: 400 })
  }

  const supabase = getSupabaseServerClient()
  if (supabase) {
    const { data, error } = await supabase
      .from('tasks')
      .update({
        status: body.status,
        qa_result: body.qa_result,
        semantic_decision: body.semantic_decision,
        updated_at: new Date().toISOString()
      })
      .eq('id', body.id)
      .select()
      .single()

    if (!error && data) {
      return NextResponse.json(data)
    }
  }

  const existing = mockTasks.find((task) => task.id === body.id)
  if (!existing) {
    return NextResponse.json({ message: 'task não encontrada' }, { status: 404 })
  }

  const updated: Task = {
    ...existing,
    status: body.status ?? existing.status,
    qa_result: body.qa_result ?? existing.qa_result,
    semantic_decision: body.semantic_decision ?? existing.semantic_decision,
    updated_at: new Date().toISOString()
  }

  return NextResponse.json(updated)
}
