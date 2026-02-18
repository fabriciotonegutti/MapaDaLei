import { ProposalSchema } from '@/lib/schemas/proposal.schema'

export interface QACheck {
  name: string
  pass: boolean
  message?: string
}

export interface QAResult {
  pass: boolean
  score: number // 0-100
  checks: QACheck[]
}

export function runQA(proposal: unknown): QAResult {
  const checks: QACheck[] = []

  // 1. Schema Zod validation
  const parsed = ProposalSchema.safeParse(proposal)
  checks.push({
    name: 'schema_valid',
    pass: parsed.success,
    message: parsed.success ? undefined : parsed.error.issues.map((i) => i.message).join('; ')
  })

  if (!parsed.success) {
    return {
      pass: false,
      score: 0,
      checks
    }
  }

  const p = parsed.data

  // 2. Confidence >= 0.6
  checks.push({
    name: 'confidence_sufficient',
    pass: p.confidence >= 0.6,
    message: p.confidence < 0.6 ? `Confiança ${p.confidence} abaixo do mínimo (0.6)` : undefined
  })

  // 3. At least 1 source with URL
  const hasValidSource = p.sources.length >= 1 && p.sources.every((s) => s.url.startsWith('http'))
  checks.push({
    name: 'has_valid_source',
    pass: hasValidSource,
    message: hasValidSource ? undefined : 'Necessário ao menos uma fonte com URL válida'
  })

  // 4. Mandatory fields by tipo_regra
  let tipoRegraCheck = true
  let tipoRegraMsg: string | undefined

  if (p.tipo_regra === 'UF_INTRA') {
    if (!p.uf_origem) {
      tipoRegraCheck = false
      tipoRegraMsg = 'UF_INTRA requer uf_origem'
    }
  } else if (p.tipo_regra === 'UF_INTER') {
    if (!p.uf_origem || !p.uf_destino) {
      tipoRegraCheck = false
      tipoRegraMsg = 'UF_INTER requer uf_origem e uf_destino'
    }
  }

  checks.push({
    name: 'tipo_regra_fields',
    pass: tipoRegraCheck,
    message: tipoRegraMsg
  })

  // 5. Vigência: date must be parseable and not in the distant past (> 2 years ago)
  const vigencia = new Date(p.vigencia_inicio)
  const twoYearsAgo = new Date()
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)
  const vigenciaOk = !isNaN(vigencia.getTime()) && vigencia >= twoYearsAgo
  checks.push({
    name: 'vigencia_valid',
    pass: vigenciaOk,
    message: vigenciaOk ? undefined : `Vigência ${p.vigencia_inicio} inválida ou muito antiga`
  })

  // 6. Owner agent not empty
  checks.push({
    name: 'owner_agent_set',
    pass: p.owner_agent.trim().length > 0,
    message: p.owner_agent.trim().length === 0 ? 'owner_agent não pode ser vazio' : undefined
  })

  const totalChecks = checks.length
  const passedChecks = checks.filter((c) => c.pass).length
  const score = Math.round((passedChecks / totalChecks) * 100)
  const pass = checks.every((c) => c.pass)

  return { pass, score, checks }
}
