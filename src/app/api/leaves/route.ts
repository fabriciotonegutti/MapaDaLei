import { randomUUID } from 'crypto'

import { NextResponse } from 'next/server'

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
      return NextResponse.json(data, { status: 201 })
    }
  }

  return NextResponse.json(leaf, { status: 201 })
}
