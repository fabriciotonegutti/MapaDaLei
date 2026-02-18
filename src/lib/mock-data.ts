import { Leaf, LegislativeEvidence, Task } from '@/types'

const now = new Date()
const iso = (hoursAgo: number) => new Date(now.getTime() - hoursAgo * 3600_000).toISOString()

export const mockLeaves: Leaf[] = [
  {
    id: 'leaf-bebidas-acucaradas',
    name: 'Bebidas açucaradas',
    category_path: 'Alimentos e Bebidas > Refrigerantes',
    ncm: '2202.10.00',
    coverage_pct: 68,
    status: 'in_progress',
    tasks_total: 14,
    tasks_done: 9,
    created_at: iso(240)
  },
  {
    id: 'leaf-combustiveis-diesel',
    name: 'Combustíveis - Diesel',
    category_path: 'Energia > Combustíveis > Diesel B',
    ncm: '2710.19.21',
    coverage_pct: 82,
    status: 'in_progress',
    tasks_total: 18,
    tasks_done: 15,
    created_at: iso(480)
  },
  {
    id: 'leaf-farmacos-genericos',
    name: 'Fármacos genéricos',
    category_path: 'Saúde > Medicamentos > Genéricos',
    ncm: '3004.90.99',
    coverage_pct: 100,
    status: 'complete',
    tasks_total: 10,
    tasks_done: 10,
    created_at: iso(720)
  }
]

export const mockTasks: Task[] = [
  {
    id: 101,
    title: 'SP UF_INTRA - alíquota e benefício vigente',
    description:
      'Mapear alíquota interna de ICMS para NCM 2202.10.00 em SP, incluindo reduções de base e regimes especiais aplicáveis.',
    status: 'in_research',
    priority: 'P1',
    tipo_regra: 'UF_INTRA',
    uf_origem: 'SP',
    leaf_id: 'leaf-bebidas-acucaradas',
    owner_agent: 'agent_uf_sp',
    attempt: 2,
    idempotency_key: 'sp-22021000-v2',
    qa_result: null,
    semantic_decision: null,
    db_write_status: 'pending',
    evidence_refs: ['ev-sp-1', 'ev-sp-2'],
    created_at: iso(96),
    updated_at: iso(4)
  },
  {
    id: 102,
    title: 'Fluxo interestadual SP -> RJ',
    description: 'Consolidar regras de ICMS interestadual, DIFAL e partilha para operações B2C entre SP e RJ.',
    status: 'semantic_gate',
    priority: 'P0',
    tipo_regra: 'UF_INTER',
    uf_origem: 'SP',
    uf_destino: 'RJ',
    leaf_id: 'leaf-bebidas-acucaradas',
    owner_agent: 'agent_interstate',
    attempt: 3,
    idempotency_key: 'sp-rj-difal-v3',
    qa_result: 'pass',
    semantic_decision: null,
    db_write_status: 'pending',
    evidence_refs: ['ev-inter-1'],
    created_at: iso(84),
    updated_at: iso(2)
  },
  {
    id: 103,
    title: 'PIS/COFINS monofásico - diesel B',
    description: 'Validar incidência monofásica e créditos vinculados para cadeia de comercialização de diesel B.',
    status: 'qa_review',
    priority: 'P1',
    tipo_regra: 'PISCOFINS',
    leaf_id: 'leaf-combustiveis-diesel',
    owner_agent: 'agent_piscofins',
    attempt: 1,
    idempotency_key: 'piscofins-diesel-v1',
    qa_result: null,
    semantic_decision: null,
    db_write_status: 'pending',
    evidence_refs: ['ev-pc-1'],
    created_at: iso(120),
    updated_at: iso(10)
  },
  {
    id: 104,
    title: 'IBS/CBS/IS transição 2026-2032',
    description:
      'Extrair cronograma e parâmetros de transição para setor de bebidas açucaradas considerando exceções e fundos.',
    status: 'approved_for_write',
    priority: 'P2',
    tipo_regra: 'IBSCBSIS',
    leaf_id: 'leaf-bebidas-acucaradas',
    owner_agent: 'agent_ibs_cbs_is',
    attempt: 2,
    idempotency_key: 'ibs-cbs-bebidas-v2',
    qa_result: 'pass',
    semantic_decision: 'approved',
    db_write_status: 'pending',
    evidence_refs: ['ev-ibs-1'],
    created_at: iso(144),
    updated_at: iso(5)
  },
  {
    id: 105,
    title: 'PR UF_INTRA revisão de benefícios',
    description: 'Reavaliar benefício fiscal de ICMS no PR após alteração de decreto com risco de regressão.',
    status: 'rework',
    priority: 'P0',
    tipo_regra: 'UF_INTRA',
    uf_origem: 'PR',
    leaf_id: 'leaf-combustiveis-diesel',
    owner_agent: 'agent_uf_pr',
    attempt: 4,
    idempotency_key: 'pr-intra-benef-v4',
    qa_result: 'fail',
    semantic_decision: 'rework',
    db_write_status: 'error',
    evidence_refs: ['ev-pr-1'],
    created_at: iso(160),
    updated_at: iso(1)
  },
  {
    id: 106,
    title: 'GO UF_INTER bloqueio por ausência de evidência',
    description: 'Fluxo bloqueado até confirmação de convênio interestadual atualizado para operação com GO.',
    status: 'blocked',
    priority: 'P1',
    tipo_regra: 'UF_INTER',
    uf_origem: 'GO',
    uf_destino: 'MG',
    leaf_id: 'leaf-combustiveis-diesel',
    owner_agent: 'agent_interstate',
    attempt: 1,
    idempotency_key: 'go-mg-v1',
    qa_result: null,
    semantic_decision: null,
    db_write_status: 'pending',
    evidence_refs: ['ev-go-1'],
    created_at: iso(55),
    updated_at: iso(6)
  },
  {
    id: 107,
    title: 'Conclusão farmacos RJ',
    description: 'Regra consolidada, validada pelo gatekeeper e escrita no banco com sucesso.',
    status: 'done',
    priority: 'P3',
    tipo_regra: 'UF_INTRA',
    uf_origem: 'RJ',
    leaf_id: 'leaf-farmacos-genericos',
    owner_agent: 'agent_uf_rj',
    attempt: 1,
    idempotency_key: 'rj-farmacos-v1',
    qa_result: 'pass',
    semantic_decision: 'approved',
    db_write_status: 'done',
    evidence_refs: ['ev-rj-1'],
    created_at: iso(300),
    updated_at: iso(48)
  }
]

export const mockEvidences: LegislativeEvidence[] = [
  {
    id: 'ev-sp-1',
    url: 'https://portal.fazenda.sp.gov.br/icms/regras/2202-10',
    title: 'Portaria CAT - Bebidas Açucaradas',
    hash_sha256: '1bfa8d2fc7886f8ce5ff1fdb8f8ca44331c30ea5fdb2db96a0f0fafe42d341f0',
    hash_changed: false,
    last_checked_at: iso(2),
    task_id: 101,
    agent: 'agent_uf_sp',
    uf: 'SP'
  },
  {
    id: 'ev-inter-1',
    url: 'https://www.confaz.fazenda.gov.br/convenios/icms/2025/cv001',
    title: 'Convênio ICMS 001/2025',
    hash_sha256: '44c98f7e4570e5483f0c6ec0af9b4ad5cd193dfdb7d19fa0b9c8c42f8a4fd5f1',
    hash_changed: true,
    last_checked_at: iso(1),
    task_id: 102,
    agent: 'agent_interstate',
    uf: 'NA'
  },
  {
    id: 'ev-pc-1',
    url: 'https://normas.receita.economia.gov.br/piscofins/monofasico',
    title: 'Ato Declaratório PIS/COFINS Monofásico',
    hash_sha256: '8246a95f377e4f44bedf4fb661476f1fcdf6a83b4fbf8ba4cb89359f2518f4be',
    hash_changed: false,
    last_checked_at: iso(5),
    task_id: 103,
    agent: 'agent_piscofins',
    uf: 'BR'
  },
  {
    id: 'ev-ibs-1',
    url: 'https://www.planalto.gov.br/reforma-tributaria/ibs-cbs-is',
    title: 'Lei Complementar da Reforma Tributária',
    hash_sha256: 'f893f5b2e5efc50ebf15ce605df8fbf7d3d0e2f3a06fef31f7f4a4f105f54f31',
    hash_changed: true,
    last_checked_at: iso(3),
    task_id: 104,
    agent: 'agent_ibs_cbs_is',
    uf: 'BR'
  }
]
