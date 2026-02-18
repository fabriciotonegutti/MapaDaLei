import { createHash } from 'crypto'

import { NextResponse } from 'next/server'

import { mockEvidences } from '@/lib/mock-data'
import { getSupabaseServerClient } from '@/lib/supabase'
import { LegislativeEvidence } from '@/types'

export async function GET() {
  const supabase = getSupabaseServerClient()

  if (supabase) {
    const { data, error } = await supabase
      .from('legislative_evidences')
      .select('*')
      .order('last_checked_at', { ascending: false })

    if (!error && data) {
      return NextResponse.json(data)
    }
  }

  return NextResponse.json(mockEvidences)
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as { id?: string }

  if (!body.id) {
    return NextResponse.json({ message: 'id é obrigatório' }, { status: 400 })
  }

  const supabase = getSupabaseServerClient()
  if (supabase) {
    const { data: current } = await supabase
      .from('legislative_evidences')
      .select('*')
      .eq('id', body.id)
      .single()

    if (current) {
      const refreshedHash = createHash('sha256')
        .update(`${current.url}-${Date.now().toString()}`)
        .digest('hex')

      const hashChanged = current.hash_sha256 !== refreshedHash

      const { data, error } = await supabase
        .from('legislative_evidences')
        .update({
          hash_sha256: refreshedHash,
          hash_changed: hashChanged,
          last_checked_at: new Date().toISOString()
        })
        .eq('id', body.id)
        .select()
        .single()

      if (!error && data) {
        return NextResponse.json(data)
      }
    }
  }

  const existing = mockEvidences.find((evidence) => evidence.id === body.id)
  if (!existing) {
    return NextResponse.json({ message: 'evidência não encontrada' }, { status: 404 })
  }

  const refreshedHash = createHash('sha256')
    .update(`${existing.url}-${Date.now().toString()}`)
    .digest('hex')

  const updated: LegislativeEvidence = {
    ...existing,
    hash_sha256: refreshedHash,
    hash_changed: refreshedHash !== existing.hash_sha256,
    last_checked_at: new Date().toISOString()
  }

  return NextResponse.json(updated)
}
