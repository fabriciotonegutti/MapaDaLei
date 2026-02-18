import { NextRequest, NextResponse } from 'next/server'

import { queryLeafById } from '@/lib/db/leaves-query'

/**
 * GET /api/mercadological/leaves/:id
 *
 * Returns full LeafRow details for a single mercadological leaf.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const leaf = await queryLeafById(id)
    if (!leaf) {
      return NextResponse.json({ error: 'Leaf não encontrada' }, { status: 404 })
    }

    return NextResponse.json(leaf)
  } catch (err) {
    console.error('[/api/mercadological/leaves/[id]] Error:', err)
    return NextResponse.json(
      { error: 'Falha ao buscar leaf', detail: String(err) },
      { status: 500 }
    )
  }
}
