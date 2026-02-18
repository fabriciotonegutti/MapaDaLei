import { getSupabaseServerClient } from '@/lib/supabase'
import { checkForChanges } from './hash-checker'

export interface DetectionResult {
  changed: boolean
  task_created?: number
}

export async function detectAndTriggerReanalysis(evidenceId: string): Promise<DetectionResult> {
  const hashResult = await checkForChanges(evidenceId)

  if (!hashResult.changed) {
    return { changed: false }
  }

  const supabase = getSupabaseServerClient()

  if (!supabase) {
    console.info(`[change-detector] Hash mudou para evidência ${evidenceId} (modo mock)`)
    return { changed: true }
  }

  // Fetch evidence metadata for the new task
  const { data: evidence } = await supabase
    .from('legislative_evidence')
    .select('id, url, title, task_id, uf')
    .eq('id', evidenceId)
    .single()

  const evidenceData = evidence as {
    id: string
    url: string
    title: string
    task_id: number | null
    uf: string | null
  } | null

  const now = new Date().toISOString()

  // Create a new REWORK task triggered by the legislation change
  const newTask = {
    title: `REWORK: Legislação alterada — ${evidenceData?.title ?? evidenceId}`,
    description: `Hash da evidência ${evidenceId} mudou.\nURL: ${evidenceData?.url ?? 'N/A'}\nDiff: ${hashResult.diff_summary ?? 'N/A'}\nHash anterior: ${hashResult.old_hash}\nHash novo: ${hashResult.new_hash}`,
    status: 'todo',
    priority: 'P1',
    tipo_regra: 'UF_INTRA',
    uf_origem: evidenceData?.uf ?? null,
    leaf_id: evidenceData?.task_id ? String(evidenceData.task_id) : 'rework',
    owner_agent: 'worker-codex',
    attempt: 0,
    evidence_refs: [evidenceId, evidenceData?.url ?? ''].filter(Boolean),
    created_at: now,
    updated_at: now
  }

  const { data: createdTask, error } = await supabase.from('tasks').insert(newTask).select('id').single()

  if (error) {
    console.error('[change-detector] Falha ao criar task de rework:', error.message)
    return { changed: true }
  }

  const taskId = (createdTask as { id: number }).id
  console.info(`[change-detector] Task de rework criada: ${taskId}`)

  return { changed: true, task_created: taskId }
}
