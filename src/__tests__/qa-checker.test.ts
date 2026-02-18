import { runQA } from '../lib/qa/checker'

const validProposal = {
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
      title: 'Lei 12345/2024 SEFAZ-SP'
    }
  ],
  proposal: {
    cclasstrib: '01.1',
    cst: '00',
    aliquotas: { icms: 12.0 },
    review_required: false,
    alertas: []
  }
}

describe('runQA — Pipeline de QA de propostas', () => {
  it('deve aprovar proposta válida com confiança alta', () => {
    const result = runQA(validProposal)
    expect(result.pass).toBe(true)
    expect(result.score).toBe(100)
    expect(result.checks.every((c) => c.pass)).toBe(true)
  })

  it('deve reprovar proposta com confiança baixa (< 0.6)', () => {
    const proposal = { ...validProposal, confidence: 0.4 }
    const result = runQA(proposal)
    expect(result.pass).toBe(false)
    const confidenceCheck = result.checks.find((c) => c.name === 'confidence_sufficient')
    expect(confidenceCheck?.pass).toBe(false)
  })

  it('deve reprovar proposta sem fontes', () => {
    const proposal = { ...validProposal, sources: [] }
    const result = runQA(proposal)
    expect(result.pass).toBe(false)
    const schemaCheck = result.checks.find((c) => c.name === 'schema_valid')
    expect(schemaCheck?.pass).toBe(false)
  })

  it('deve reprovar proposta com schema inválido (sem task_id)', () => {
    const { task_id: _omit, ...invalidProposal } = validProposal
    const result = runQA(invalidProposal)
    expect(result.pass).toBe(false)
    const schemaCheck = result.checks.find((c) => c.name === 'schema_valid')
    expect(schemaCheck?.pass).toBe(false)
    expect(result.score).toBe(0)
  })

  it('deve reprovar proposta UF_INTRA sem uf_origem', () => {
    const proposal = { ...validProposal, uf_origem: undefined }
    const result = runQA(proposal)
    expect(result.pass).toBe(false)
    const tipoRegraCheck = result.checks.find((c) => c.name === 'tipo_regra_fields')
    expect(tipoRegraCheck?.pass).toBe(false)
  })

  it('deve reprovar proposta UF_INTER sem uf_destino', () => {
    const proposal = {
      ...validProposal,
      tipo_regra: 'UF_INTER',
      uf_origem: 'SP',
      uf_destino: undefined
    }
    const result = runQA(proposal)
    expect(result.pass).toBe(false)
    const tipoRegraCheck = result.checks.find((c) => c.name === 'tipo_regra_fields')
    expect(tipoRegraCheck?.pass).toBe(false)
  })

  it('deve calcular score parcial corretamente', () => {
    // Valid schema but low confidence
    const proposal = { ...validProposal, confidence: 0.5 }
    const result = runQA(proposal)
    expect(result.pass).toBe(false)
    expect(result.score).toBeGreaterThan(0)
    expect(result.score).toBeLessThan(100)
  })

  it('deve aceitar proposta PISCOFINS sem UFs', () => {
    const proposal = {
      ...validProposal,
      tipo_regra: 'PISCOFINS',
      uf_origem: undefined,
      uf_destino: undefined
    }
    const result = runQA(proposal)
    expect(result.pass).toBe(true)
  })

  it('deve aceitar proposta IBSCBSIS sem UFs', () => {
    const proposal = {
      ...validProposal,
      tipo_regra: 'IBSCBSIS',
      uf_origem: undefined,
      uf_destino: undefined
    }
    const result = runQA(proposal)
    expect(result.pass).toBe(true)
  })

  it('deve retornar checks estruturados com name e pass', () => {
    const result = runQA(validProposal)
    expect(Array.isArray(result.checks)).toBe(true)
    for (const check of result.checks) {
      expect(check).toHaveProperty('name')
      expect(check).toHaveProperty('pass')
      expect(typeof check.name).toBe('string')
      expect(typeof check.pass).toBe('boolean')
    }
  })
})
