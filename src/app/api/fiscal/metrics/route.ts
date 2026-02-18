/**
 * GET /api/fiscal/metrics
 * Next.js proxy to avoid CORS — calls classifica-ai fiscal metrics endpoint.
 */
import { NextResponse } from 'next/server'

import { getFiscalMetrics } from '@/lib/classifica-ai/fiscal-metrics'

export async function GET() {
  try {
    const metrics = await getFiscalMetrics()
    return NextResponse.json(metrics)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao buscar métricas fiscais'
    console.error('[api/fiscal/metrics]', message)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
