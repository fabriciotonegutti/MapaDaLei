/**
 * proposal-flow.test.ts — Sprint 4
 *
 * Unit tests for the complete proposal flow:
 *   runQA → submitToGatekeeper
 */

import { runQA } from '../lib/qa/checker'
import { submitToGatekeeper } from '../lib/semantic-gate/gatekeeper'
import type { Proposal } from '../lib/schemas/proposal.schema'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const baseProposal: Proposal = {
  task_id: 1,
  leaf_id: 'leaf-001',
  tipo_regra: 'UF_INTRA',
  uf_origem: 'SP',
  vigencia_inicio: '2025-01-01',
  owner_agent: 'worker-codex',
  confidence: 0.9,
  sources: [
    {
      url: 'https://www.fazenda.sp.gov.br/lei-12345',
      title: 'Lei 12345/2024 SEFAZ-SP',
    },
  ],
  proposal: {
    cclasstrib: '01.1',
    cst: '00',
    aliquotas: { icms: 12.0 },
    review_required: false,
    alertas: [],
  },
}

// ─── runQA tests ──────────────────────────────────────────────────────────────

describe('runQA — Pipeline de QA', () => {
  it('deve retornar pass=true e score=100 para proposta válida', () => {
    const result = runQA(baseProposal)
    expect(result.pass).toBe(true)
    expect(result.score).toBe(100)
  })

  it('deve retornar pass=false para confidence=0.4', () => {
    const proposal = { ...baseProposal, confidence: 0.4 }
    const result = runQA(proposal)
    expect(result.pass).toBe(false)
    const check = result.checks.find((c) => c.name === 'confidence_sufficient')
    expect(check?.pass).toBe(false)
  })

  it('deve retornar pass=false para proposta sem fontes', () => {
    const proposal = { ...baseProposal, sources: [] as unknown as Proposal['sources'] }
    const result = runQA(proposal)
    expect(result.pass).toBe(false)
    // Schema validation should fail (min 1 source)
    const schemaCheck = result.checks.find((c) => c.name === 'schema_valid')
    expect(schemaCheck?.pass).toBe(false)
  })

  it('deve retornar pass=false para UF_INTRA sem uf_origem', () => {
    const proposal = { ...baseProposal, uf_origem: undefined }
    const result = runQA(proposal)
    expect(result.pass).toBe(false)
    const tipoRegraCheck = result.checks.find((c) => c.name === 'tipo_regra_fields')
    expect(tipoRegraCheck?.pass).toBe(false)
  })

  it('deve retornar pass=false para UF_INTER sem uf_destino', () => {
    const proposal = { ...baseProposal, tipo_regra: 'UF_INTER', uf_origem: 'SP', uf_destino: undefined }
    const result = runQA(proposal)
    expect(result.pass).toBe(false)
    const tipoRegraCheck = result.checks.find((c) => c.name === 'tipo_regra_fields')
    expect(tipoRegraCheck?.pass).toBe(false)
  })
})

// ─── submitToGatekeeper tests ─────────────────────────────────────────────────

describe('submitToGatekeeper — Gatekeeper mock', () => {
  it('deve retornar approved quando confidence >= 0.8', async () => {
    const proposal: Proposal = { ...baseProposal, confidence: 0.85 }
    const qaResult = runQA(proposal)
    const decision = await submitToGatekeeper(proposal, qaResult)
    expect(decision.decision).toBe('approved')
    expect(decision.reviewed_by).toBe('fiscal-agent-opus')
  })

  it('deve retornar approved para confidence exatamente 0.8', async () => {
    const proposal: Proposal = { ...baseProposal, confidence: 0.8 }
    const qaResult = runQA(proposal)
    const decision = await submitToGatekeeper(proposal, qaResult)
    expect(decision.decision).toBe('approved')
  })

  it('deve retornar rework quando 0.6 <= confidence < 0.8', async () => {
    const proposal: Proposal = { ...baseProposal, confidence: 0.7 }
    const qaResult = runQA(proposal)
    const decision = await submitToGatekeeper(proposal, qaResult)
    expect(decision.decision).toBe('rework')
  })

  it('deve retornar rework para confidence exatamente 0.6', async () => {
    const proposal: Proposal = { ...baseProposal, confidence: 0.6 }
    const qaResult = runQA(proposal)
    const decision = await submitToGatekeeper(proposal, qaResult)
    expect(decision.decision).toBe('rework')
  })

  it('deve retornar rejected quando confidence < 0.6', async () => {
    const proposal: Proposal = { ...baseProposal, confidence: 0.4 }
    // QA will also fail, but we test gatekeeper independently
    const decision = await submitToGatekeeper(proposal)
    expect(decision.decision).toBe('rejected')
  })

  it('deve retornar rejected quando confidence = 0.59', async () => {
    const proposal: Proposal = { ...baseProposal, confidence: 0.59 }
    const decision = await submitToGatekeeper(proposal)
    expect(decision.decision).toBe('rejected')
  })

  it('deve incluir reviewed_at com timestamp ISO', async () => {
    const decision = await submitToGatekeeper(baseProposal)
    expect(decision.reviewed_at).toBeTruthy()
    expect(new Date(decision.reviewed_at).getTime()).not.toBeNaN()
  })

  it('deve retornar rejected quando QA falha independente da confidence', async () => {
    const proposal: Proposal = { ...baseProposal, confidence: 0.9 }
    const failedQA = { pass: false, score: 50, checks: [{ name: 'schema_valid', pass: false }] }
    const decision = await submitToGatekeeper(proposal, failedQA)
    expect(decision.decision).toBe('rejected')
  })
})

// ─── Fluxo completo QA → Gatekeeper ──────────────────────────────────────────

describe('Fluxo completo: runQA → submitToGatekeeper', () => {
  it('proposta válida com alta confidence: QA pass → gatekeeper approved', async () => {
    const qaResult = runQA(baseProposal)
    expect(qaResult.pass).toBe(true)

    const decision = await submitToGatekeeper(baseProposal, qaResult)
    expect(decision.decision).toBe('approved')
  })

  it('proposta com confidence=0.7: QA pass → gatekeeper rework', async () => {
    const proposal = { ...baseProposal, confidence: 0.7 }
    const qaResult = runQA(proposal)
    expect(qaResult.pass).toBe(true)

    const decision = await submitToGatekeeper(proposal, qaResult)
    expect(decision.decision).toBe('rework')
  })

  it('proposta com confidence=0.4: QA fail → gatekeeper rejected', async () => {
    const proposal = { ...baseProposal, confidence: 0.4 }
    const qaResult = runQA(proposal)
    expect(qaResult.pass).toBe(false)

    const decision = await submitToGatekeeper(proposal, qaResult)
    expect(decision.decision).toBe('rejected')
  })
})
