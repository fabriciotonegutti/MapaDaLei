import { NextResponse } from 'next/server'

import { classifica_ai_pool } from '@/lib/db/postgres'
import { getSupabaseServerClient } from '@/lib/supabase'

// mc_tasks project id for MapaDaLei
const MC_PROJECT_ID = 70
const PILOT_LEAF_COUNT = 3

const UF_LIST = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]

const INTER_PAIRS = [
  ['SP', 'RJ'], ['SP', 'MG'], ['SP', 'PR'], ['SP', 'SC'],
  ['RJ', 'MG'], ['MG', 'BA'], ['BA', 'SE'], ['RS', 'SC'],
  ['SC', 'PR'], ['GO', 'DF'], ['AM', 'PA'], ['PE', 'PB'],
]

interface LeafRow {
  id: number
  code: number
  name: string
  level: number
  full_path: string
  ncm_code?: string | null
  status?: string | null
}

function buildMcTaskTemplates(leafUuid: string, leafName: string): object[] {
  const now = new Date().toISOString()
  const shortId = leafUuid.slice(0, 8)

  const base = (overrides: { title: string; description: string; priority?: string }) => ({
    project_id: MC_PROJECT_ID,
    status: 'todo',
    priority: overrides.priority ?? 'P2',
    assigned_to: 'worker-codex',
    created_by: 'api-pilot',
    estimated_hours: 2,
    complexity: 'medium',
    created_at: now,
    updated_at: now,
    ...overrides,
  })

  const tasks: object[] = []

  for (const uf of UF_LIST) {
    tasks.push(base({
      title: `[UF_INTRA][${shortId}] ${leafName} — ${uf}`,
      description: `leaf_id=${leafUuid} tipo_regra=UF_INTRA uf_origem=${uf}. Mapeamento de regra intraestadual para ${uf} na leaf "${leafName}"`,
    }))
  }

  for (const [origem, destino] of INTER_PAIRS) {
    tasks.push(base({
      title: `[UF_INTER][${shortId}] ${leafName} — ${origem}→${destino}`,
      description: `leaf_id=${leafUuid} tipo_regra=UF_INTER uf_origem=${origem} uf_destino=${destino}. Mapeamento de regra interestadual ${origem} → ${destino} na leaf "${leafName}"`,
    }))
  }

  tasks.push(base({
    title: `[PISCOFINS][${shortId}] ${leafName}`,
    description: `leaf_id=${leafUuid} tipo_regra=PISCOFINS. Mapeamento PIS/COFINS para leaf "${leafName}"`,
    priority: 'P1',
  }))

  tasks.push(base({
    title: `[IBSCBSIS][${shortId}] ${leafName}`,
    description: `leaf_id=${leafUuid} tipo_regra=IBSCBSIS. Mapeamento IBS/CBS/IS para leaf "${leafName}"`,
    priority: 'P1',
  }))

  return tasks
}

/**
 * POST /api/pilot
 *
 * 1. Busca PILOT_LEAF_COUNT leaves reais do Postgres (classifica_ai) — level 6, active
 *    que ainda NÃO estão no Supabase (por category_path)
 * 2. Para cada leaf: upsert no Supabase leaves + gera 41 tasks em mc_tasks
 * 3. Retorna relatório: { leaves_activated, tasks_created, errors }
 */
export async function POST() {
  const supabase = getSupabaseServerClient()
  const results: {
    leaf_id: number
    leaf_name: string
    supabase_uuid: string
    tasks_created: number
    already_existed: boolean
    error?: string
  }[] = []

  let leaves: LeafRow[] = []

  // ── 1. Fetch candidates from classifica_ai ─────────────────────────────────
  try {
    const res = await classifica_ai_pool.query<LeafRow>(
      `SELECT
         mc.id, mc.code, mc.name, mc.level, mc.full_path, mc.status,
         mn.ncm_code
       FROM cai_mercadological_categories mc
       LEFT JOIN LATERAL (
         SELECT ncm_code
         FROM cai_map_merc_category_ncm
         WHERE category_external_id = mc.id
         ORDER BY confidence DESC NULLS LAST, id
         LIMIT 1
       ) mn ON true
       WHERE mc.level = 6
         AND mc.status = 'active'
       ORDER BY mc.id
       LIMIT $1`,
      [PILOT_LEAF_COUNT * 3] // fetch more to allow filtering already-activated
    )
    leaves = res.rows
  } catch (err) {
    return NextResponse.json(
      { error: 'Falha ao buscar leaves do Postgres', detail: String(err) },
      { status: 500 }
    )
  }

  if (!supabase) {
    // Mock mode: return simulated result
    return NextResponse.json({
      leaves_activated: PILOT_LEAF_COUNT,
      tasks_created: PILOT_LEAF_COUNT * 41,
      errors: 0,
      mode: 'mock',
      results: leaves.slice(0, PILOT_LEAF_COUNT).map((l) => ({
        leaf_id: l.id,
        leaf_name: l.name,
        supabase_uuid: crypto.randomUUID(),
        tasks_created: 41,
        already_existed: false,
      })),
    })
  }

  // ── 2. Get already-activated leaves from Supabase ──────────────────────────
  const { data: existingLeaves } = await supabase.from('leaves').select('category_path')
  const activatedPaths = new Set<string>(
    (existingLeaves ?? []).map((l: { category_path: string }) => l.category_path)
  )

  // Filter to leaves NOT already in Supabase
  const newLeaves = leaves.filter((l) => !activatedPaths.has(l.full_path))
  const toActivate = newLeaves.slice(0, PILOT_LEAF_COUNT)

  // If no new leaves, take any leaves and re-activate
  const targetLeaves = toActivate.length > 0 ? toActivate : leaves.slice(0, PILOT_LEAF_COUNT)

  // ── 3. Activate each leaf ──────────────────────────────────────────────────
  for (const leaf of targetLeaves) {
    const alreadyExisted = activatedPaths.has(leaf.full_path)
    let supabaseUuid = crypto.randomUUID()

    try {
      if (alreadyExisted) {
        // Update existing
        const { data: existing } = await supabase
          .from('leaves')
          .select('id')
          .eq('category_path', leaf.full_path)
          .maybeSingle()

        if (existing) {
          supabaseUuid = existing.id as string
          await supabase
            .from('leaves')
            .update({ status: 'in_progress', name: leaf.name, ncm: leaf.ncm_code ?? null })
            .eq('id', supabaseUuid)
        }
      } else {
        // Insert new
        const { data: inserted, error: insertErr } = await supabase
          .from('leaves')
          .insert({
            id: supabaseUuid,
            name: leaf.name,
            category_path: leaf.full_path,
            ncm: leaf.ncm_code ?? null,
            coverage_pct: 0,
            status: 'in_progress',
            tasks_total: 41,
            tasks_done: 0,
          })
          .select('id')
          .single()

        if (insertErr) throw new Error(`Leaf insert: ${insertErr.message}`)
        if (inserted) supabaseUuid = inserted.id as string
      }

      // Generate 41 tasks in mc_tasks
      const taskTemplates = buildMcTaskTemplates(supabaseUuid, leaf.name)
      const { data: taskData, error: taskErr } = await supabase
        .from('mc_tasks')
        .insert(taskTemplates)
        .select('id')

      if (taskErr) throw new Error(`Tasks insert: ${taskErr.message}`)

      results.push({
        leaf_id: leaf.id,
        leaf_name: leaf.name,
        supabase_uuid: supabaseUuid,
        tasks_created: taskData?.length ?? 0,
        already_existed: alreadyExisted,
      })
    } catch (err) {
      results.push({
        leaf_id: leaf.id,
        leaf_name: leaf.name,
        supabase_uuid: supabaseUuid,
        tasks_created: 0,
        already_existed: alreadyExisted,
        error: String(err),
      })
    }
  }

  const leaves_activated = results.filter((r) => !r.error).length
  const tasks_created = results.reduce((acc, r) => acc + r.tasks_created, 0)
  const errors = results.filter((r) => r.error).length

  return NextResponse.json({
    leaves_activated,
    tasks_created,
    errors,
    mode: 'live',
    results,
  })
}

/**
 * GET /api/pilot — Status atual do piloto
 */
export async function GET() {
  const supabase = getSupabaseServerClient()

  if (!supabase) {
    return NextResponse.json({ mode: 'mock', leaves_total: 0, tasks_total: 0, recent_tasks: [] })
  }

  const [leavesRes, tasksCountRes, recentTasksRes] = await Promise.all([
    supabase.from('leaves').select('id', { count: 'exact', head: true }),
    supabase
      .from('mc_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', MC_PROJECT_ID),
    supabase
      .from('mc_tasks')
      .select('id, title, status, priority, created_at')
      .eq('project_id', MC_PROJECT_ID)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  return NextResponse.json({
    mode: 'live',
    leaves_total: leavesRes.count ?? 0,
    tasks_total: tasksCountRes.count ?? 0,
    recent_tasks: recentTasksRes.data ?? [],
  })
}
