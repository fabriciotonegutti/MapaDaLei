import { getSupabaseServerClient } from '@/lib/supabase'
import { hashContent, normalizeContent } from './evidence-store'

export interface HashCheckResult {
  changed: boolean
  old_hash: string
  new_hash: string
  diff_summary?: string
}

export async function checkForChanges(evidenceId: string): Promise<HashCheckResult> {
  const supabase = getSupabaseServerClient()

  if (!supabase) {
    return {
      changed: false,
      old_hash: 'mock-hash',
      new_hash: 'mock-hash',
      diff_summary: 'Supabase não configurado — modo mock'
    }
  }

  // Fetch evidence record
  const { data, error } = await supabase
    .from('legislative_evidence')
    .select('id, url, hash_sha256, title')
    .eq('id', evidenceId)
    .single()

  if (error || !data) {
    throw new Error(`Evidência não encontrada: ${evidenceId}`)
  }

  const evidence = data as { id: string; url: string; hash_sha256: string; title: string }
  const old_hash = evidence.hash_sha256

  // Fetch current content from URL
  let fetchedContent: string
  try {
    const response = await fetch(evidence.url, {
      headers: { 'User-Agent': 'MapaDaLei-Monitor/1.0' },
      signal: AbortSignal.timeout(15000)
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    fetchedContent = await response.text()
  } catch (fetchError) {
    throw new Error(
      `Falha ao buscar URL ${evidence.url}: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`
    )
  }

  const new_hash = hashContent(fetchedContent)
  const changed = new_hash !== old_hash

  const now = new Date().toISOString()

  if (changed) {
    // Update hash and last_checked_at in DB
    await supabase
      .from('legislative_evidence')
      .update({
        hash_sha256: new_hash,
        hash_changed: true,
        last_checked_at: now,
        content_snapshot: normalizeContent(fetchedContent).slice(0, 10000)
      })
      .eq('id', evidenceId)
  } else {
    await supabase
      .from('legislative_evidence')
      .update({ last_checked_at: now, hash_changed: false })
      .eq('id', evidenceId)
  }

  return {
    changed,
    old_hash,
    new_hash,
    diff_summary: changed
      ? `Hash alterado para evidência "${evidence.title}". Conteúdo da URL foi modificado desde a última verificação.`
      : undefined
  }
}
