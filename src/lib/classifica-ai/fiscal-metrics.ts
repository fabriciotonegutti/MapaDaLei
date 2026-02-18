import { classificaAI } from './client'

export interface FiscalMetrics {
  total_decisions_24h: number
  blocked_rate_24h: number
  review_backlog: number
  avg_latency_ms_24h: number
}

/**
 * Fetches real-time operational metrics from classifica-ai.
 * Maps the API response to the FiscalMetrics interface used by the dashboard.
 */
export async function getFiscalMetrics(): Promise<FiscalMetrics> {
  const raw = (await classificaAI.get('/api/v1/fiscal/metrics')) as Record<string, unknown>

  return {
    total_decisions_24h: Number(raw.total_decisions_24h ?? 0),
    blocked_rate_24h: Number(raw.blocked_rate_24h ?? 0),
    review_backlog: Number(raw.review_backlog ?? 0),
    avg_latency_ms_24h: Number(raw.avg_latency_ms_24h ?? 0)
  }
}
