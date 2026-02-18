/**
 * single-writer.ts — Sprint 2
 * Writes fiscal rules to classifica-ai via POST /api/v1/fiscal/rules.
 * Replaces the Supabase-mock implementation with real API calls.
 */
import crypto from 'crypto'

import { classificaAI } from '@/lib/classifica-ai/client'
import { type GatekeeperDecision } from '@/lib/semantic-gate/gatekeeper'
import { type Proposal } from '@/lib/schemas/proposal.schema'
import { logAuditEvent } from './audit-log'

export interface WriteResult {
  success: boolean
  rule_ids: string[]
  idempotency_key: string
  error?: string
}

// ─── Key generation ─────────────────────────────────────────────────────────

function leafIdHash(leafId: string): string {
  return crypto.createHash('sha256').update(leafId).digest('hex').slice(0, 8)
}

function generateRuleCode(proposal: Proposal): string {
  const ufOrig = proposal.uf_origem ?? 'XX'
  const ufDest = proposal.uf_destino ?? 'XX'
  const hash = leafIdHash(proposal.leaf_id)
  return `MAPALEI-${proposal.tipo_regra}-${ufOrig}-${ufDest}-${hash}`.toUpperCase()
}

function generateRuleKey(proposal: Proposal): string {
  const ufOrig = proposal.uf_origem ?? 'XX'
  const ufDest = proposal.uf_destino ?? 'XX'
  return `${proposal.leaf_id}:${proposal.tipo_regra}:${ufOrig}:${ufDest}:${proposal.vigencia_inicio}`
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

// ─── Mapping helpers ─────────────────────────────────────────────────────────

/**
 * Maps internal tipo_regra to classifica-ai operation_type.
 * The API only accepts: sale | purchase | transfer
 */
function mapOperationType(tipoRegra: Proposal['tipo_regra']): 'sale' | 'purchase' | 'transfer' {
  switch (tipoRegra) {
    case 'UF_INTER':
      return 'sale'
    case 'UF_INTRA':
      return 'transfer'
    case 'PISCOFINS':
      return 'purchase'
    case 'IBSCBSIS':
      return 'sale'
    default:
      return 'sale'
  }
}

/**
 * Maps internal source list to RuleSourceInput (first source wins).
 * source_type must be: ricms | convenio | protocolo | decisao_normativa | solucao_consulta | manual
 */
function buildSourcePayload(proposal: Proposal): Record<string, unknown> {
  const first = proposal.sources[0]
  return {
    source_type: 'manual',
    source_ref: `mapalei:${proposal.leaf_id}`,
    source_url: first.url,
    source_hash: first.hash ?? null,
    legal_basis: proposal.sources.map((s) => s.title).join('; '),
    payload: {
      all_sources: proposal.sources,
      owner_agent: proposal.owner_agent
    }
  }
}

function buildConditionPayload(proposal: Proposal): Record<string, unknown> {
  return {
    cfop_code: null,
    operation_context: `${proposal.uf_origem ?? ''}->${proposal.uf_destino ?? ''}`,
    metadata: {
      tipo_regra: proposal.tipo_regra,
      leaf_id: proposal.leaf_id,
      task_id: proposal.task_id,
      condicoes: proposal.proposal.condicoes ?? {}
    }
  }
}

function buildEffectPayload(proposal: Proposal): Record<string, unknown> {
  const aliquotas = proposal.proposal.aliquotas ?? {}
  return {
    cst_saida: proposal.proposal.cst ?? null,
    carga_saida: aliquotas['saida'] ?? null,
    carga_entrada: aliquotas['entrada'] ?? null,
    notes: proposal.proposal.alertas.join('\n') || null,
    vigencia_inicio: proposal.vigencia_inicio,
    tax_result: {
      cclasstrib: proposal.proposal.cclasstrib ?? null,
      aliquotas,
      efeitos: proposal.proposal.efeitos ?? {}
    }
  }
}

// ─── Main export ─────────────────────────────────────────────────────────────

export async function writeRule(
  proposal: Proposal,
  decision: GatekeeperDecision
): Promise<WriteResult> {
  const idempotency_key = generateIdempotencyKey(proposal)
  const proposal_hash = crypto.createHash('sha256').update(JSON.stringify(proposal)).digest('hex')
  const now = new Date().toISOString()

  // Only write approved decisions to the real backend
  if (decision.decision !== 'approved') {
    console.info(
      `[single-writer] Skipping write — gatekeeper decision: ${decision.decision} for idempotency_key ${idempotency_key}`
    )
    return {
      success: true,
      rule_ids: [],
      idempotency_key,
      error: `Skipped: gatekeeper decision was ${decision.decision}`
    }
  }

  const rulePayload = {
    rule_code: generateRuleCode(proposal),
    rule_key: generateRuleKey(proposal),
    name: `MapaDaLei: ${proposal.tipo_regra} ${proposal.uf_origem ?? ''}→${proposal.uf_destino ?? ''} (leaf ${proposal.leaf_id.slice(0, 8)})`,
    scope_uf: proposal.uf_origem ?? proposal.uf_destino ?? 'SP',
    operation_type: mapOperationType(proposal.tipo_regra),
    priority: 100,
    specificity_score: Math.round(proposal.confidence * 10),
    confidence_score: proposal.confidence,
    impact_level: proposal.proposal.review_required ? 'high' : 'low',
    status: 'draft',
    valid_from: proposal.vigencia_inicio,
    condition: buildConditionPayload(proposal),
    effect: buildEffectPayload(proposal),
    source: buildSourcePayload(proposal),
    created_by: proposal.owner_agent
  }

  try {
    const response = (await classificaAI.post('/api/v1/fiscal/rules', rulePayload)) as {
      rule_id: number
      rule_code: string
      rule_key: string | null
      version: number
      status: string
    }

    const rule_id = String(response.rule_id)

    await logAuditEvent({
      rule_id,
      action: 'created',
      proposal_hash,
      agent: proposal.owner_agent,
      gatekeeper_decision: decision.decision,
      timestamp: now
    })

    return { success: true, rule_ids: [rule_id], idempotency_key }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err)
    console.error('[single-writer] Failed to write rule to classifica-ai:', errMsg)

    return { success: false, rule_ids: [], idempotency_key, error: errMsg }
  }
}
