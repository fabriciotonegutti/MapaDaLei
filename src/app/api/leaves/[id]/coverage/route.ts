import { NextResponse } from 'next/server'

import { checkLeafCompleteness } from '@/lib/coverage/completeness-checker'

interface RouteParams {
  params: { id: string }
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = params

  if (!id) {
    return NextResponse.json({ error: 'id da leaf obrigatório' }, { status: 400 })
  }

  try {
    const result = await checkLeafCompleteness(id)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}
