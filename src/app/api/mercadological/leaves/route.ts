import { NextRequest, NextResponse } from 'next/server'

import { queryLeaves } from '@/lib/db/leaves-query'

/**
 * GET /api/mercadological/leaves
 *
 * Query params:
 *   search   — ILIKE filter on name / full_path
 *   page     — 1-indexed page number (default 1)
 *   pageSize — records per page (default 50, max 200)
 *
 * Response: { items, total, page, pageSize, totalPages }
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const search = searchParams.get('search') ?? ''
    const page = parseInt(searchParams.get('page') ?? '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') ?? '50', 10)

    const result = await queryLeaves({ search, page, pageSize })
    const totalPages = Math.ceil(result.total / result.pageSize)

    return NextResponse.json({ ...result, totalPages })
  } catch (err) {
    console.error('[/api/mercadological/leaves] Error:', err)
    return NextResponse.json(
      { error: 'Falha ao buscar leaves mercadológicas', detail: String(err) },
      { status: 500 }
    )
  }
}
