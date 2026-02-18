/**
 * evidence-store.ts — Sprint 2
 * Stores legislative monitoring evidences directly in the classifica_ai
 * Postgres database using the `pg` npm driver.
 *
 * Primary target: `cai_lc_source_snapshot`
 *   - source_type must match: ricms | convenio | protocolo | decisao_normativa | solucao_consulta | manual
 *   - unique constraint: (source_url, document_hash)
 *
 * Fallback: `mapalei_legislative_evidences` (created automatically if needed)
 */
import crypto from 'crypto'

import { Pool } from 'pg'

// ─── Connection pool ──────────────────────────────────────────────────────────

const PG_DSN =
  process.env.CLASSIFICA_AI_PG_DSN ??
  'postgresql://garrymoltonsmith@localhost:5432/classifica_ai'

let _pool: Pool | null = null

function getPool(): Pool {
  if (!_pool) {
    _pool = new Pool({ connectionString: PG_DSN })
  }
  return _pool
}

// ─── Public interface ─────────────────────────────────────────────────────────

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

// ─── Main store function ──────────────────────────────────────────────────────

export async function storeEvidence(evidence: EvidenceInput): Promise<EvidenceRecord> {
  const hash_sha256 = hashContent(evidence.content)
  const now = new Date()
  const contentSnippet = normalizeContent(evidence.content).slice(0, 10_000)

  const pool = getPool()

  // Try the primary table (cai_lc_source_snapshot)
  try {
    const result = await pool.query<{ id: number }>(
      `
      INSERT INTO cai_lc_source_snapshot (
        source_type,
        uf_scope,
        source_url,
        source_ref,
        document_hash,
        raw_document_hash,
        captured_at,
        raw_payload,
        metadata
      ) VALUES ($1, $2, $3, $4, $5, $5, $6, $7, $8)
      ON CONFLICT (source_url, document_hash) DO UPDATE
        SET captured_at = EXCLUDED.captured_at,
            metadata    = cai_lc_source_snapshot.metadata || EXCLUDED.metadata
      RETURNING id
      `,
      [
        'manual',                         // source_type
        (evidence.uf ?? '').slice(0, 2).padEnd(2, ' ') || null, // uf_scope (char(2))
        evidence.url,                     // source_url
        `mapalei:${evidence.task_id ?? 'monitor'}`, // source_ref
        hash_sha256,                      // document_hash / raw_document_hash
        now,                              // captured_at
        JSON.stringify({ snippet: contentSnippet }), // raw_payload
        JSON.stringify({                  // metadata
          title: evidence.title,
          agent: evidence.agent ?? 'mapalei-monitor',
          task_id: evidence.task_id ?? null,
          source: 'mapalei-monitor'
        })
      ]
    )

    const row = result.rows[0]
    return { id: String(row.id), hash_sha256 }
  } catch (primaryErr) {
    console.warn(
      '[evidence-store] cai_lc_source_snapshot insert failed, falling back to mapalei_legislative_evidences:',
      (primaryErr as Error).message
    )
  }

  // Fallback: create and use mapalei_legislative_evidences
  await ensureFallbackTable(pool)

  const fallback = await pool.query<{ id: string }>(
    `
    INSERT INTO mapalei_legislative_evidences (
      url, title, hash_sha256, content_snapshot, task_id, agent, uf, captured_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (url, hash_sha256) DO UPDATE
      SET captured_at = EXCLUDED.captured_at
    RETURNING id
    `,
    [
      evidence.url,
      evidence.title,
      hash_sha256,
      contentSnippet,
      evidence.task_id ?? null,
      evidence.agent ?? 'mapalei-monitor',
      evidence.uf ?? null,
      now
    ]
  )

  return { id: String(fallback.rows[0].id), hash_sha256 }
}

async function ensureFallbackTable(pool: Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS mapalei_legislative_evidences (
      id           bigserial PRIMARY KEY,
      url          text NOT NULL,
      title        text,
      hash_sha256  text NOT NULL,
      content_snapshot text,
      task_id      integer,
      agent        text,
      uf           text,
      captured_at  timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT mapalei_leg_ev_uq UNIQUE (url, hash_sha256)
    )
  `)
}
