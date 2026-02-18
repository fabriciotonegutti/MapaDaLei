export type TaskStatus =
  | 'todo'
  | 'in_research'
  | 'qa_review'
  | 'semantic_gate'
  | 'approved_for_write'
  | 'writing_db'
  | 'done'
  | 'rework'
  | 'blocked'

export type TipoRegra = 'UF_INTRA' | 'UF_INTER' | 'PISCOFINS' | 'IBSCBSIS'
export type Priority = 'P0' | 'P1' | 'P2' | 'P3'

export interface Leaf {
  id: string
  name: string
  category_path: string
  ncm?: string
  coverage_pct: number
  status: 'incomplete' | 'complete' | 'in_progress'
  tasks_total: number
  tasks_done: number
  created_at: string
}

export interface Task {
  id: number
  title: string
  description: string
  status: TaskStatus
  priority: Priority
  tipo_regra: TipoRegra
  uf_origem?: string
  uf_destino?: string
  leaf_id: string
  owner_agent?: string
  attempt: number
  idempotency_key?: string
  qa_result?: 'pass' | 'fail' | null
  semantic_decision?: 'approved' | 'rejected' | 'rework' | null
  db_write_status?: 'pending' | 'done' | 'error' | null
  evidence_refs?: string[]
  created_at: string
  updated_at: string
}

export interface LegislativeEvidence {
  id: string
  url: string
  title: string
  hash_sha256: string
  hash_changed: boolean
  last_checked_at: string
  content_snapshot?: string
  task_id?: number
  agent?: string
  uf?: string
}
