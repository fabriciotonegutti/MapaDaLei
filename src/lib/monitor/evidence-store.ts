import crypto from 'crypto'

import { getSupabaseServerClient } from '@/lib/supabase'

export interface EvidenceInput {
  url: string
  title: string
  content: string
  task_id?: number
  agent?: string
  uf?: string
}

export interface EvidenceRecord {
  id: string
  hash_sha256: string
}

export function normalizeContent(content: string): string {
  return content.toLowerCase().trim().replace(/\s+/g, ' ')
}

export function hashContent(content: string): string {
  const normalized = normalizeContent(content)
  return crypto.createHash('sha256').update(normalized, 'utf8').digest('hex')
}

export async function storeEvidence(evidence: EvidenceInput): Promise<EvidenceRecord> {
  const hash_sha256 = hashContent(evidence.content)
  const now = new Date().toISOString()

  const record = {
    url: evidence.url,
    title: evidence.title,
    hash_sha256,
    hash_changed: false,
    last_checked_at: now,
    content_snapshot: normalizeContent(evidence.content).slice(0, 10000),
    task_id: evidence.task_id ?? null,
    agent: evidence.agent ?? null,
    uf: evidence.uf ?? null,
    created_at: now
  }

  const supabase = getSupabaseServerClient()

  if (supabase) {
    // Upsert by URL
    const { data, error } = await supabase
      .from('legislative_evidence')
      .upsert(record, { onConflict: 'url' })
      .select('id, hash_sha256')
      .single()

    if (error) {
      throw new Error(`Falha ao armazenar evidência: ${error.message}`)
    }

    return { id: (data as { id: string; hash_sha256: string }).id, hash_sha256: (data as { id: string; hash_sha256: string }).hash_sha256 }
  }

  // Mock fallback
  const mock_id = crypto.randomUUID()
  return { id: mock_id, hash_sha256 }
}
