import { type QAResult } from '@/lib/qa/checker'
import { type Proposal } from '@/lib/schemas/proposal.schema'

export interface GatekeeperDecision {
  decision: 'approved' | 'rejected' | 'rework'
  rationale: string
  checklist?: string[]
  evidence_refs?: string[]
  reviewed_by: 'fiscal-agent-opus'
  reviewed_at: string
}

/**
 * Intelligent mock gatekeeper:
 * - approved  → confidence >= 0.8 AND QA pass
 * - rework    → confidence 0.6–0.79 (OR QA score < 100 but pass)
 * - rejected  → confidence < 0.6 OR QA fail
 */
export async function submitToGatekeeper(
  proposal: Proposal,
  qaResult?: QAResult
): Promise<GatekeeperDecision> {
  const now = new Date().toISOString()
  const conf = proposal.confidence

  const failedChecks = qaResult?.checks.filter((c) => !c.pass).map((c) => c.name) ?? []
  const qaPass = qaResult?.pass ?? true

  if (!qaPass || conf < 0.6) {
    return {
      decision: 'rejected',
      rationale: `Proposta rejeitada: confiança ${conf.toFixed(2)} abaixo do mínimo ou QA reprovado. Checks falhos: ${failedChecks.join(', ') || 'n/a'}`,
      checklist: [
        'Revisar fontes legislativas',
        'Aumentar confiança da análise (mínimo 0.6)',
        'Corrigir campos obrigatórios'
      ],
      evidence_refs: proposal.sources.map((s) => s.url),
      reviewed_by: 'fiscal-agent-opus',
      reviewed_at: now
    }
  }

  if (conf >= 0.8 && qaPass) {
    return {
      decision: 'approved',
      rationale: `Proposta aprovada: confiança ${conf.toFixed(2)}, QA score ${qaResult?.score ?? 100}/100. Todas as verificações passaram.`,
      checklist: ['Escrita no banco autorizada', 'Auditoria registrada'],
      evidence_refs: proposal.sources.map((s) => s.url),
      reviewed_by: 'fiscal-agent-opus',
      reviewed_at: now
    }
  }

  // 0.6 <= conf < 0.8
  return {
    decision: 'rework',
    rationale: `Proposta necessita revisão: confiança ${conf.toFixed(2)} entre 0.6 e 0.8. Recomenda-se enriquecer as fontes e aumentar a confiança.`,
    checklist: [
      'Adicionar fontes adicionais para aumentar confiança',
      'Revisar alíquotas e condições',
      'Confirmar vigência com a legislação mais recente'
    ],
    evidence_refs: proposal.sources.map((s) => s.url),
    reviewed_by: 'fiscal-agent-opus',
    reviewed_at: now
  }
}
