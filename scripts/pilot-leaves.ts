/**
 * pilot-leaves.ts — Sprint 4
 *
 * Script de piloto: busca 3 leaves reais do classifica_ai (level 6),
 * ativa cada uma no Supabase e gera backlog de 41 tasks.
 *
 * Executar:
 *   npx ts-node --project tsconfig.scripts.json scripts/pilot-leaves.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

import { Pool } from 'pg'
import { createClient } from '@supabase/supabase-js'

// ─── Config ──────────────────────────────────────────────────────────────────

const PG_DSN =
  process.env.CLASSIFICA_AI_PG_DSN ?? 'postgresql://garrymoltonsmith@localhost:5432/classifica_ai'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

const PILOT_LEAF_COUNT = 3

// ─── Types ───────────────────────────────────────────────────────────────────

interface LeafRow {
  id: number
  code: number
  name: string
  level: number
  full_path: string
  ncm_code?: string | null
  status?: string | null
}

interface PilotLeafResult {
  leaf_id: number
  leaf_name: string
  ncm_code?: string
  supabase_inserted: boolean
  tasks_created: number
  task_ids: number[]
  error?: string
}

interface PilotReport {
  run_at: string
  leaves_processed: number
  leaves_activated: number
  tasks_total: number
  errors: number
  results: PilotLeafResult[]
}

// ─── Backlog constants ────────────────────────────────────────────────────────

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

// mc_tasks schema: id, epic_id, project_id, title, description, status, priority,
// assigned_to, created_by, estimated_hours, actual_hours, due_date,
// created_at, updated_at, completed_at, complexity, objective_id
// MapaDaLei-specific fields stored in title prefix and description
const MC_PROJECT_ID = 70 // MapaDaLei project in Supabase mc_tasks

function buildTaskTemplates(leafId: string, leafName: string): object[] {
  const now = new Date().toISOString()
  const tasks: object[] = []

  const base = (overrides: { title: string; description: string; priority?: string }) => ({
    project_id: MC_PROJECT_ID,
    status: 'todo',
    priority: overrides.priority ?? 'P2',
    assigned_to: 'worker-codex',
    created_by: 'pilot-leaves',
    estimated_hours: 2,
    complexity: 'medium',
    created_at: now,
    updated_at: now,
    ...overrides,
  })

  for (const uf of UF_LIST) {
    tasks.push(base({
      title: `[UF_INTRA][${leafId.slice(0, 8)}] ${leafName} — ${uf}`,
      description: `leaf_id=${leafId} tipo_regra=UF_INTRA uf_origem=${uf}. Mapeamento de regra intraestadual para ${uf} na leaf "${leafName}"`,
    }))
  }

  for (const [origem, destino] of INTER_PAIRS) {
    tasks.push(base({
      title: `[UF_INTER][${leafId.slice(0, 8)}] ${leafName} — ${origem}→${destino}`,
      description: `leaf_id=${leafId} tipo_regra=UF_INTER uf_origem=${origem} uf_destino=${destino}. Mapeamento de regra interestadual ${origem} → ${destino} na leaf "${leafName}"`,
    }))
  }

  tasks.push(base({
    title: `[PISCOFINS][${leafId.slice(0, 8)}] ${leafName}`,
    description: `leaf_id=${leafId} tipo_regra=PISCOFINS. Mapeamento de regra PIS/COFINS para leaf "${leafName}"`,
    priority: 'P1',
  }))

  tasks.push(base({
    title: `[IBSCBSIS][${leafId.slice(0, 8)}] ${leafName}`,
    description: `leaf_id=${leafId} tipo_regra=IBSCBSIS. Mapeamento de regra IBS/CBS/IS para leaf "${leafName}"`,
    priority: 'P1',
  }))

  return tasks
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 Piloto MapaDaLei — Sprint 4')
  console.log('='.repeat(60))

  const pool = new Pool({ connectionString: PG_DSN, max: 3 })
  const supabase =
    SUPABASE_URL && SUPABASE_SERVICE_KEY
      ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
          auth: { persistSession: false, autoRefreshToken: false },
        })
      : null

  if (!supabase) {
    console.warn('⚠️  Supabase não configurado — rodando em modo simulado')
  }

  // ── 1. Buscar 3 leaves reais do classifica_ai ─────────────────────────────
  console.log(`\n📋 Buscando ${PILOT_LEAF_COUNT} leaves reais (level 6)...`)

  let pgLeaves: LeafRow[] = []
  try {
    const res = await pool.query<LeafRow>(
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
      [PILOT_LEAF_COUNT]
    )
    pgLeaves = res.rows
    console.log(`✅ Encontradas ${pgLeaves.length} leaves`)
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err)
    console.error('❌ Erro ao buscar leaves do Postgres:', errMsg)
    console.log('\n📦 Usando leaves simuladas para o piloto...')
    pgLeaves = [
      { id: 1001, code: 10010101, name: 'Carne bovina fresca refrigerada', level: 6, full_path: 'Alimentos > Carnes > Bovina > Fresca > Refrigerada', ncm_code: '02013000', status: 'active' },
      { id: 1002, code: 20020202, name: 'Leite integral pasteurizado', level: 6, full_path: 'Alimentos > Laticínios > Leite > Integral > Pasteurizado', ncm_code: '04011000', status: 'active' },
      { id: 1003, code: 30030303, name: 'Arroz branco polido tipo 1', level: 6, full_path: 'Alimentos > Grãos > Arroz > Branco > Polido', ncm_code: '10063010', status: 'active' },
    ]
  }

  // ── 2. Para cada leaf: criar no Supabase + gerar backlog ──────────────────
  const results: PilotLeafResult[] = []

  for (const leaf of pgLeaves) {
    const leafIdStr = String(leaf.id)
    console.log(`\n🔧 Processando leaf #${leaf.id}: ${leaf.name}`)

    const result: PilotLeafResult = {
      leaf_id: leaf.id,
      leaf_name: leaf.name,
      ncm_code: leaf.ncm_code ?? undefined,
      supabase_inserted: false,
      tasks_created: 0,
      task_ids: [],
    }

    try {
      // 2a. Criar leaf no Supabase
      // Matches schema from activate route: id(uuid), name, category_path, ncm,
      // coverage_pct, status, tasks_total, tasks_done
      const leafUuid = require('crypto').randomUUID() as string
      let supabaseLeafId = leafUuid

      if (supabase) {
        // Check if already exists by category_path
        const { data: existing } = await supabase
          .from('leaves')
          .select('id')
          .eq('category_path', leaf.full_path)
          .maybeSingle()

        if (existing) {
          supabaseLeafId = existing.id as string
          await supabase
            .from('leaves')
            .update({ name: leaf.name, ncm: leaf.ncm_code ?? null, status: 'in_progress' })
            .eq('id', supabaseLeafId)
          result.supabase_inserted = true
          console.log(`  ✅ Leaf já existia no Supabase — atualizada (id: ${supabaseLeafId})`)
        } else {
          const { data: inserted, error: insertErr } = await supabase
            .from('leaves')
            .insert({
              id: leafUuid,
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

          if (insertErr) {
            console.warn(`  ⚠️  Supabase leaf insert: ${insertErr.message}`)
          } else if (inserted) {
            supabaseLeafId = inserted.id as string
            result.supabase_inserted = true
            console.log(`  ✅ Leaf inserida no Supabase (id: ${supabaseLeafId})`)
          }
        }
      } else {
        result.supabase_inserted = false
        console.log(`  ℹ️  Modo simulado — leaf não inserida no Supabase`)
      }

      // 2b. Gerar backlog de tasks
      // Uses `tasks` table (matches backlog-generator.ts and types/index.ts)
      const taskTemplates = buildTaskTemplates(supabaseLeafId, leaf.name)
      console.log(`  📝 Gerando ${taskTemplates.length} tasks...`)

      if (supabase) {
        const { data, error: taskErr } = await supabase
          .from('mc_tasks')
          .insert(taskTemplates)
          .select('id')

        if (taskErr) {
          throw new Error(`Erro ao criar tasks: ${taskErr.message}`)
        }

        const ids = (data as Array<{ id: number }>).map((t) => t.id)
        result.tasks_created = ids.length
        result.task_ids = ids
        console.log(`  ✅ ${ids.length} tasks criadas no Supabase`)
      } else {
        // Mock mode
        result.tasks_created = taskTemplates.length
        result.task_ids = taskTemplates.map((_, i) => leaf.id * 100 + i)
        console.log(`  ✅ ${taskTemplates.length} tasks simuladas (mock mode)`)
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err)
      result.error = errMsg
      console.error(`  ❌ Erro: ${errMsg}`)
    }

    results.push(result)
  }

  // ── 3. Relatório final ────────────────────────────────────────────────────
  const report: PilotReport = {
    run_at: new Date().toISOString(),
    leaves_processed: results.length,
    leaves_activated: results.filter((r) => r.supabase_inserted).length,
    tasks_total: results.reduce((acc, r) => acc + r.tasks_created, 0),
    errors: results.filter((r) => r.error).length,
    results,
  }

  const reportPath = path.join(__dirname, 'pilot-report.json')
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

  console.log('\n' + '='.repeat(60))
  console.log('📊 RELATÓRIO FINAL')
  console.log('='.repeat(60))
  console.log(`  Leaves processadas:  ${report.leaves_processed}`)
  console.log(`  Leaves ativadas:     ${report.leaves_activated}`)
  console.log(`  Tasks totais:        ${report.tasks_total}`)
  console.log(`  Erros:               ${report.errors}`)
  console.log(`\n  Relatório salvo em: ${reportPath}`)

  await pool.end()

  if (report.errors > 0) {
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('Erro fatal:', err)
  process.exit(1)
})
