import { getSupabaseServerClient } from '@/lib/supabase'
import { type Task, type TipoRegra } from '@/types'

const UF_LIST = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

const INTER_PAIRS = [
  ['SP', 'RJ'], ['SP', 'MG'], ['SP', 'PR'], ['SP', 'SC'],
  ['RJ', 'MG'], ['MG', 'BA'], ['BA', 'SE'], ['RS', 'SC'],
  ['SC', 'PR'], ['GO', 'DF'], ['AM', 'PA'], ['PE', 'PB']
]

export interface MissingRule {
  tipo_regra: TipoRegra
  uf_origem?: string
  uf_destino?: string
}

export interface CompletenessResult {
  complete: boolean
  coverage_pct: number
  missing: MissingRule[]
}

export async function checkLeafCompleteness(leafId: string): Promise<CompletenessResult> {
  const supabase = getSupabaseServerClient()

  let tasks: Pick<Task, 'tipo_regra' | 'uf_origem' | 'uf_destino' | 'status'>[] = []

  if (supabase) {
    const { data, error } = await supabase
      .from('tasks')
      .select('tipo_regra, uf_origem, uf_destino, status')
      .eq('leaf_id', leafId)

    if (error) {
      throw new Error(`Falha ao buscar tasks: ${error.message}`)
    }

    tasks = (data as Pick<Task, 'tipo_regra' | 'uf_origem' | 'uf_destino' | 'status'>[]) ?? []
  }

  const doneTasks = tasks.filter((t) => t.status === 'done')

  const missing: MissingRule[] = []

  // Check UF_INTRA (one per UF)
  for (const uf of UF_LIST) {
    const covered = doneTasks.some((t) => t.tipo_regra === 'UF_INTRA' && t.uf_origem === uf)
    if (!covered) {
      missing.push({ tipo_regra: 'UF_INTRA', uf_origem: uf })
    }
  }

  // Check UF_INTER pairs
  for (const [origem, destino] of INTER_PAIRS) {
    const covered = doneTasks.some(
      (t) => t.tipo_regra === 'UF_INTER' && t.uf_origem === origem && t.uf_destino === destino
    )
    if (!covered) {
      missing.push({ tipo_regra: 'UF_INTER', uf_origem: origem, uf_destino: destino })
    }
  }

  // Check PISCOFINS
  const hasPiscoFins = doneTasks.some((t) => t.tipo_regra === 'PISCOFINS')
  if (!hasPiscoFins) {
    missing.push({ tipo_regra: 'PISCOFINS' })
  }

  // Check IBSCBSIS
  const hasIbsCbs = doneTasks.some((t) => t.tipo_regra === 'IBSCBSIS')
  if (!hasIbsCbs) {
    missing.push({ tipo_regra: 'IBSCBSIS' })
  }

  const total = UF_LIST.length + INTER_PAIRS.length + 2 // +2 for PISCOFINS and IBSCBSIS
  const covered = total - missing.length
  const coverage_pct = total > 0 ? Math.round((covered / total) * 100) : 0
  const complete = missing.length === 0

  return { complete, coverage_pct, missing }
}
