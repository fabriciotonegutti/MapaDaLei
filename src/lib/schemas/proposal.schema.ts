import { z } from 'zod'

export const ProposalSchema = z.object({
  task_id: z.number(),
  leaf_id: z.string(),
  tipo_regra: z.enum(['UF_INTRA', 'UF_INTER', 'PISCOFINS', 'IBSCBSIS']),
  uf_origem: z.string().length(2).optional(),
  uf_destino: z.string().length(2).optional(),
  vigencia_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  owner_agent: z.string(),
  confidence: z.number().min(0).max(1),
  sources: z
    .array(
      z.object({
        url: z.string().url(),
        title: z.string(),
        hash: z.string().optional()
      })
    )
    .min(1),
  proposal: z.object({
    cclasstrib: z.string().optional(),
    cst: z.string().optional(),
    aliquotas: z.record(z.string(), z.number()).optional(),
    condicoes: z.record(z.string(), z.unknown()).optional(),
    efeitos: z.record(z.string(), z.unknown()).optional(),
    review_required: z.boolean().default(false),
    alertas: z.array(z.string()).default([])
  })
})

export type Proposal = z.infer<typeof ProposalSchema>
