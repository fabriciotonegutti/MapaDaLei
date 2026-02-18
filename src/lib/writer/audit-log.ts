import { getSupabaseServerClient } from '@/lib/supabase'

export interface AuditEvent {
  rule_id: string
  action: 'created' | 'updated' | 'superseded' | 'revoked'
  proposal_hash: string
  agent: string
  gatekeeper_decision: string
  timestamp: string
}

export async function logAuditEvent(event: AuditEvent): Promise<void> {
  const supabase = getSupabaseServerClient()

  if (supabase) {
    const { error } = await supabase.from('audit_log').insert({
      rule_id: event.rule_id,
      action: event.action,
      proposal_hash: event.proposal_hash,
      agent: event.agent,
      gatekeeper_decision: event.gatekeeper_decision,
      timestamp: event.timestamp,
      created_at: new Date().toISOString()
    })

    if (error) {
      console.error('[audit-log] Falha ao registrar evento de auditoria:', error.message)
    }
  } else {
    // Fallback: log to console when Supabase is not configured
    console.info('[audit-log]', JSON.stringify(event))
  }
}
