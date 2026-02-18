import { classificaAI } from './client'

export interface FiscalAlert {
  id: number
  alert_code: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'acked' | 'resolved'
  title: string
  message: string
  fingerprint: string
  context: string | Record<string, unknown>
  recommended_action: string | null
  created_at: string
  updated_at: string
  ack_by: string | null
  ack_at: string | null
  resolved_by: string | null
  resolved_at: string | null
}

/**
 * Fetches fiscal alerts from classifica-ai.
 * @param uf Optional UF filter (not directly supported by API, filtered client-side if needed)
 */
export async function getFiscalAlerts(uf?: string): Promise<FiscalAlert[]> {
  const raw = (await classificaAI.get('/api/v1/fiscal/alerts')) as FiscalAlert[]

  if (!Array.isArray(raw)) {
    return []
  }

  // Client-side UF filter if the API doesn't support it natively
  if (uf) {
    return raw.filter((alert) => {
      const ctx =
        typeof alert.context === 'string'
          ? (JSON.parse(alert.context) as Record<string, unknown>)
          : alert.context
      return (ctx as Record<string, unknown>).uf === uf || !ctx
    })
  }

  return raw
}
