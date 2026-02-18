import { Priority, TaskStatus, TipoRegra } from '@/types'

export const KANBAN_PRIMARY_STATUSES: TaskStatus[] = [
  'todo',
  'in_research',
  'qa_review',
  'semantic_gate',
  'approved_for_write',
  'writing_db',
  'done'
]

export const KANBAN_AUX_STATUSES: TaskStatus[] = ['rework', 'blocked']

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'TODO',
  in_research: 'IN_RESEARCH',
  qa_review: 'QA_REVIEW',
  semantic_gate: 'SEMANTIC_GATE',
  approved_for_write: 'APPROVED_FOR_WRITE',
  writing_db: 'WRITING_DB',
  done: 'DONE',
  rework: 'REWORK',
  blocked: 'BLOCKED'
}

export const STATUS_CLASSES: Record<TaskStatus, string> = {
  todo: 'bg-slate-700 text-slate-200',
  in_research: 'bg-blue-900 text-blue-200',
  qa_review: 'bg-purple-900 text-purple-200',
  semantic_gate: 'bg-amber-900 text-amber-200',
  approved_for_write: 'bg-emerald-900 text-emerald-200',
  writing_db: 'bg-cyan-900 text-cyan-200',
  done: 'bg-green-900 text-green-200',
  rework: 'bg-red-900 text-red-200',
  blocked: 'bg-gray-800 text-gray-400'
}

export const PRIORITY_CLASSES: Record<Priority, string> = {
  P0: 'bg-red-500/20 text-red-400 border-red-500/40',
  P1: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
  P2: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
  P3: 'bg-green-500/20 text-green-300 border-green-500/40'
}

export const TIPO_REGRA_CLASSES: Record<TipoRegra, string> = {
  UF_INTRA: 'bg-indigo-500/20 text-indigo-200 border-indigo-500/30',
  UF_INTER: 'bg-sky-500/20 text-sky-200 border-sky-500/30',
  PISCOFINS: 'bg-pink-500/20 text-pink-200 border-pink-500/30',
  IBSCBSIS: 'bg-teal-500/20 text-teal-200 border-teal-500/30'
}
