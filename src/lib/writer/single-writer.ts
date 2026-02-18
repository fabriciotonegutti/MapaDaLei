import crypto from 'crypto'

import { type GatekeeperDecision } from '@/lib/semantic-gate/gatekeeper'
import { type Proposal } from '@/lib/schemas/proposal.schema'
import { getSupabaseServerClient } from '@/lib/supabase'
import { logAuditEvent } from './audit-log'

export interface WriteResult {
  success: boolean
  rule_ids: string[]
  idempotency_key: string
  error?: string
}

function generateIdempotencyKey(proposal: Proposal): string {
  const proposalHash = crypto
    .createHash('sha256')
    .update(JSON.stringify(proposal.proposal))
    .digest('hex')
    .slice(0, 16)

  const raw = [
    proposal.leaf_id,
    proposal.tipo_regra,
    proposal.uf_origem ?? '',
    proposal.uf_destino ?? '',
    proposal.vigencia_inicio,
    proposalHash
  ].join('|')

  return crypto.createHash('sha256').update(raw).digest('hex')
}

export async function writeRule(
  proposal: Proposal,
  decision: GatekeeperDecision
): Promise<WriteResult> {
  const idempotency_key = generateIdempotencyKey(proposal)
  const now = new Date().toISOString()
  const proposal_hash = crypto.createHash('sha256').update(JSON.stringify(proposal)).digest('hex')

  const rulePayload = {
    idempotency_key,
    leaf_id: proposal.leaf_id,
    task_id: proposal.task_id,
    tipo_regra: proposal.tipo_regra,
    uf_origem: proposal.uf_origem ?? null,
    uf_destino: proposal.uf_destino ?? null,
    valid_from: proposal.vigencia_inicio,
    owner_agent: proposal.owner_agent,
    confidence: proposal.confidence,
    gatekeeper_decision: decision.decision,
    gatekeeper_reviewed_by: decision.reviewed_by,
    gatekeeper_reviewed_at: decision.reviewed_at,
    proposal_hash,
    status: 'active',
    cclasstrib: proposal.proposal.cclasstrib ?? null,
    cst: proposal.proposal.cst ?? null,
    aliquotas: proposal.proposal.aliquotas ?? null,
    condicoes: proposal.proposal.condicoes ?? null,
    efeitos: proposal.proposal.efeitos ?? null,
    review_required: proposal.proposal.review_required,
    alertas: proposal.proposal.alertas,
    sources: proposal.sources,
    version: 1,
    created_at: now,
    updated_at: now
  }

  const supabase = getSupabaseServerClient()

  if (!supabase) {
    // Mock mode: simulate success
    const mock_rule_id = `mock-${idempotency_key.slice(0, 8)}`
    await logAuditEvent({
      rule_id: mock_rule_id,
      action: 'created',
      proposal_hash,
      agent: proposal.owner_agent,
      gatekeeper_decision: decision.decision,
      timestamp: now
    })
    return { success: true, rule_ids: [mock_rule_id], idempotency_key }
  }

  // Check for existing rule with same idempotency_key (idempotency)
  const { data: existing } = await supabase
    .from('cai_lc_rules')
    .select('id, version')
    .eq('idempotency_key', idempotency_key)
    .maybeSingle()

  let rule_id: string
  let action: 'created' | 'updated'

  if (existing) {
    // Update existing
    const { data, error } = await supabase
      .from('cai_lc_rules')
      .update({
        ...rulePayload,
        version: existing.version + 1,
        updated_at: now
      })
      .eq('idempotency_key', idempotency_key)
      .select('id')
      .single()

    if (error) {
      return { success: false, rule_ids: [], idempotency_key, error: error.message }
    }

    rule_id = (data as { id: string }).id
    action = 'updated'
  } else {
    const { data, error } = await supabase
      .from('cai_lc_rules')
      .insert(rulePayload)
      .select('id')
      .single()

    if (error) {
      return { success: false, rule_ids: [], idempotency_key, error: error.message }
    }

    rule_id = (data as { id: string }).id
    action = 'created'
  }

  await logAuditEvent({
    rule_id,
    action,
    proposal_hash,
    agent: proposal.owner_agent,
    gatekeeper_decision: decision.decision,
    timestamp: now
  })

  return { success: true, rule_ids: [rule_id], idempotency_key }
}
