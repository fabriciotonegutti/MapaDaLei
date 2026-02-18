/**
 * leaves-query.ts — Sprint 3
 *
 * Database queries for mercadological leaves (level 6 categories)
 * from the classifica_ai Postgres database.
 *
 * Schema facts (verified 2026-02-18):
 *  - cai_mercadological_categories: id, code, name, level, full_path, status
 *  - cai_map_merc_category_ncm:     category_external_id (→ mc.id), ncm_code (string)
 *    (ncm_code is stored directly as a string, not a FK to cai_ncm_codes)
 */
import { classifica_ai_pool } from './postgres'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LeafRow {
  id: number
  code: number
  name: string
  level: number
  full_path: string
  ncm_code?: string
  status?: string
}

interface QueryLeavesOptions {
  search?: string    // ILIKE filter on name or full_path
  page?: number      // 1-indexed, default 1
  pageSize?: number  // default 50
}

interface QueryLeavesResult {
  items: LeafRow[]
  total: number
  page: number
  pageSize: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns the first ncm_code for a given leaf id (highest confidence).
 * The mapping table may have multiple NCMs per leaf; we take the one with
 * the highest confidence.
 */
async function fetchNcmForLeaf(leafId: number): Promise<string | undefined> {
  const res = await classifica_ai_pool.query<{ ncm_code: string }>(
    `SELECT ncm_code
     FROM cai_map_merc_category_ncm
     WHERE category_external_id = $1
     ORDER BY confidence DESC NULLS LAST, id
     LIMIT 1`,
    [leafId]
  )
  return res.rows[0]?.ncm_code
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Paginated list of level-6 (leaf) mercadological categories.
 *
 * The LEFT JOIN on cai_map_merc_category_ncm returns the FIRST ncm_code
 * (ordered by confidence DESC) using DISTINCT ON to avoid row duplication.
 */
export async function queryLeaves(options: QueryLeavesOptions = {}): Promise<QueryLeavesResult> {
  const page = Math.max(1, options.page ?? 1)
  const pageSize = Math.min(200, Math.max(1, options.pageSize ?? 50))
  const offset = (page - 1) * pageSize
  const searchParam = options.search?.trim() ?? ''
  const searchLike = searchParam ? `%${searchParam}%` : ''

  // COUNT query
  const countRes = await classifica_ai_pool.query<{ cnt: string }>(
    `SELECT COUNT(DISTINCT mc.id) AS cnt
     FROM cai_mercadological_categories mc
     WHERE mc.level = 6
       AND ($1 = '' OR mc.name ILIKE $1 OR mc.full_path ILIKE $1)`,
    [searchLike]
  )
  const total = parseInt(countRes.rows[0].cnt, 10)

  // Data query — DISTINCT ON prevents duplicate leaves when a leaf has multiple NCMs
  const dataRes = await classifica_ai_pool.query<{
    id: number
    code: number
    name: string
    level: number
    full_path: string
    status: string
    ncm_code: string | null
  }>(
    `SELECT
       mc.id,
       mc.code,
       mc.name,
       mc.level,
       mc.full_path,
       mc.status,
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
       AND ($1 = '' OR mc.name ILIKE $1 OR mc.full_path ILIKE $1)
     ORDER BY mc.full_path
     LIMIT $2 OFFSET $3`,
    [searchLike, pageSize, offset]
  )

  const items: LeafRow[] = dataRes.rows.map((r) => ({
    id: r.id,
    code: r.code,
    name: r.name,
    level: r.level,
    full_path: r.full_path,
    status: r.status ?? undefined,
    ncm_code: r.ncm_code ?? undefined,
  }))

  return { items, total, page, pageSize }
}

/**
 * Fetch a single leaf by its primary key.
 */
export async function queryLeafById(id: number): Promise<LeafRow | null> {
  const res = await classifica_ai_pool.query<{
    id: number
    code: number
    name: string
    level: number
    full_path: string
    status: string
  }>(
    `SELECT id, code, name, level, full_path, status
     FROM cai_mercadological_categories
     WHERE id = $1`,
    [id]
  )

  if (res.rows.length === 0) return null

  const row = res.rows[0]
  const ncm_code = await fetchNcmForLeaf(id)

  return {
    id: row.id,
    code: row.code,
    name: row.name,
    level: row.level,
    full_path: row.full_path,
    status: row.status ?? undefined,
    ncm_code,
  }
}
