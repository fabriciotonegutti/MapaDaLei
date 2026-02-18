/**
 * GET /api/fiscal/alerts[?uf=XX]
 * Next.js proxy to avoid CORS — calls classifica-ai fiscal alerts endpoint.
 */
import { NextRequest, NextResponse } from 'next/server'

import { getFiscalAlerts } from '@/lib/classifica-ai/fiscal-alerts'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const uf = searchParams.get('uf') ?? undefined
    const alerts = await getFiscalAlerts(uf)
    return NextResponse.json(alerts)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao buscar alertas fiscais'
    console.error('[api/fiscal/alerts]', message)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
