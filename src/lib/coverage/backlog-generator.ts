import { getSupabaseServerClient } from '@/lib/supabase'
import { type Task } from '@/types'

const UF_LIST = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

// Common interstate routes (origin → destination pairs)
const INTER_PAIRS = [
  ['SP', 'RJ'], ['SP', 'MG'], ['SP', 'PR'], ['SP', 'SC'],
  ['RJ', 'MG'], ['MG', 'BA'], ['BA', 'SE'], ['RS', 'SC'],
  ['SC', 'PR'], ['GO', 'DF'], ['AM', 'PA'], ['PE', 'PB']
]

export async function generateLeafBacklog(
  leafId: string,
  leafName: string
): Promise<{ tasks_created: number; task_ids: number[] }> {
  const now = new Date().toISOString()

  const taskTemplates: Omit<Task, 'id'>[] = []

  // 27 UF_INTRA tasks (one per Brazilian state)
  for (const uf of UF_LIST) {
    taskTemplates.push({
      title: `[UF_INTRA] ${leafName} — ${uf}`,
      description: `Mapeamento de regra intraestadual para ${uf} na leaf ${leafName}`,
      status: 'todo',
      priority: 'P2',
      tipo_regra: 'UF_INTRA',
      uf_origem: uf,
      uf_destino: undefined,
      leaf_id: leafId,
      owner_agent: 'worker-codex',
      attempt: 0,
      qa_result: null,
      semantic_decision: null,
      db_write_status: null,
      evidence_refs: [],
      created_at: now,
      updated_at: now
    })
  }

  // UF_INTER tasks for standard interstate routes
  for (const [origem, destino] of INTER_PAIRS) {
    taskTemplates.push({
      title: `[UF_INTER] ${leafName} — ${origem}→${destino}`,
      description: `Mapeamento de regra interestadual ${origem} → ${destino} na leaf ${leafName}`,
      status: 'todo',
      priority: 'P2',
      tipo_regra: 'UF_INTER',
      uf_origem: origem,
      uf_destino: destino,
      leaf_id: leafId,
      owner_agent: 'worker-codex',
      attempt: 0,
      qa_result: null,
      semantic_decision: null,
      db_write_status: null,
      evidence_refs: [],
      created_at: now,
      updated_at: now
    })
  }

  // 1 PISCOFINS task
  taskTemplates.push({
    title: `[PISCOFINS] ${leafName}`,
    description: `Mapeamento de regra PIS/COFINS para leaf ${leafName}`,
    status: 'todo',
    priority: 'P1',
    tipo_regra: 'PISCOFINS',
    uf_origem: undefined,
    uf_destino: undefined,
    leaf_id: leafId,
    owner_agent: 'worker-codex',
    attempt: 0,
    qa_result: null,
    semantic_decision: null,
    db_write_status: null,
    evidence_refs: [],
    created_at: now,
    updated_at: now
  })

  // 1 IBSCBSIS task
  taskTemplates.push({
    title: `[IBSCBSIS] ${leafName}`,
    description: `Mapeamento de regra IBS/CBS/IS para leaf ${leafName}`,
    status: 'todo',
    priority: 'P1',
    tipo_regra: 'IBSCBSIS',
    uf_origem: undefined,
    uf_destino: undefined,
    leaf_id: leafId,
    owner_agent: 'worker-codex',
    attempt: 0,
    qa_result: null,
    semantic_decision: null,
    db_write_status: null,
    evidence_refs: [],
    created_at: now,
    updated_at: now
  })

  const supabase = getSupabaseServerClient()

  if (!supabase) {
    // Mock mode: return simulated IDs
    const mock_ids = taskTemplates.map((_, i) => i + 1)
    return { tasks_created: taskTemplates.length, task_ids: mock_ids }
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert(taskTemplates)
    .select('id')

  if (error) {
    throw new Error(`Falha ao gerar backlog: ${error.message}`)
  }

  const task_ids = (data as Array<{ id: number }>).map((t) => t.id)
  return { tasks_created: task_ids.length, task_ids }
}
