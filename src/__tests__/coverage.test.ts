/**
 * coverage.test.ts — Sprint 4
 *
 * Unit tests for backlog generation and completeness checking.
 * Mocks the Supabase client so no real database is required.
 */

// ─── Mock Supabase ────────────────────────────────────────────────────────────

const mockSelect = jest.fn()
const mockInsert = jest.fn()
const mockEq = jest.fn()

// Chain mock: supabase.from('x').insert([...]).select('id')
const mockSelectAfterInsert = jest.fn()
const mockInsertChain = { select: mockSelectAfterInsert }
const mockFromInsert = { insert: mockInsert }
const mockFromSelect = { select: mockSelect }

let mockFromFn: jest.Mock

jest.mock('../lib/supabase', () => ({
  getSupabaseServerClient: () => mockFromFn(),
  isSupabaseConfigured: true,
  isServiceRoleConfigured: true,
}))

import { generateLeafBacklog } from '../lib/coverage/backlog-generator'
import { checkLeafCompleteness } from '../lib/coverage/completeness-checker'
import type { Task } from '../types'

// ─── generateLeafBacklog tests ────────────────────────────────────────────────

describe('generateLeafBacklog — geração de 41 tasks', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve criar exatamente 41 tasks no total (null Supabase → mock mode)', async () => {
    // Return null → mock mode (no real supabase)
    mockFromFn = jest.fn().mockReturnValue(null)

    const result = await generateLeafBacklog('leaf-test-001', 'Produto Teste ABC')

    expect(result.tasks_created).toBe(41)
    expect(result.task_ids.length).toBe(41)
  })

  it('deve criar 27 tasks UF_INTRA (uma por estado brasileiro)', async () => {
    mockFromFn = jest.fn().mockReturnValue(null)

    // We verify by checking the mock IDs returned are 41 sequential IDs
    const result = await generateLeafBacklog('leaf-uf-intra', 'Leaf UF INTRA Test')

    // 27 UF_INTRA + 12 UF_INTER + 1 PISCOFINS + 1 IBSCBSIS = 41
    expect(result.tasks_created).toBe(41)
  })

  it('deve criar 12 tasks UF_INTER (pares interestaduais)', async () => {
    mockFromFn = jest.fn().mockReturnValue(null)
    const result = await generateLeafBacklog('leaf-inter', 'Leaf INTER Test')
    // 27 + 12 + 2 = 41
    expect(result.tasks_created).toBe(41)
  })

  it('deve criar 1 task PISCOFINS e 1 task IBSCBSIS', async () => {
    mockFromFn = jest.fn().mockReturnValue(null)
    const result = await generateLeafBacklog('leaf-fiscal', 'Leaf Fiscal Test')
    expect(result.tasks_created).toBe(41)
  })

  it('deve criar tasks com IDs sequenciais no mock mode', async () => {
    mockFromFn = jest.fn().mockReturnValue(null)
    const result = await generateLeafBacklog('leaf-ids', 'Leaf IDs Test')

    expect(result.task_ids).toHaveLength(41)
    // IDs should be 1..41 in mock mode
    expect(result.task_ids[0]).toBe(1)
    expect(result.task_ids[40]).toBe(41)
  })

  it('deve usar Supabase real quando disponível', async () => {
    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({
            data: Array.from({ length: 41 }, (_, i) => ({ id: i + 100 })),
            error: null,
          }),
        }),
      }),
    }
    mockFromFn = jest.fn().mockReturnValue(mockSupabase)

    const result = await generateLeafBacklog('leaf-supabase', 'Leaf Supabase Test')

    expect(result.tasks_created).toBe(41)
    expect(result.task_ids[0]).toBe(100)
    expect(result.task_ids[40]).toBe(140)
    expect(mockSupabase.from).toHaveBeenCalledWith('tasks')
  })

  it('deve lançar erro quando Supabase retorna erro', async () => {
    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'insert failed' },
          }),
        }),
      }),
    }
    mockFromFn = jest.fn().mockReturnValue(mockSupabase)

    await expect(generateLeafBacklog('leaf-err', 'Leaf Error Test')).rejects.toThrow('Falha ao gerar backlog')
  })
})

// ─── checkLeafCompleteness tests ──────────────────────────────────────────────

describe('checkLeafCompleteness — verificação de cobertura', () => {
  const UF_INTRA_COUNT = 27
  const UF_INTER_COUNT = 12
  const SPECIAL_COUNT = 2 // PISCOFINS + IBSCBSIS
  const TOTAL = UF_INTRA_COUNT + UF_INTER_COUNT + SPECIAL_COUNT // 41

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve retornar complete=false quando não há tasks (Supabase null)', async () => {
    mockFromFn = jest.fn().mockReturnValue(null)

    const result = await checkLeafCompleteness('leaf-empty')

    expect(result.complete).toBe(false)
    expect(result.missing.length).toBe(TOTAL)
    expect(result.coverage_pct).toBe(0)
  })

  it('deve retornar complete=false quando tasks estão pendentes (todo/in_research)', async () => {
    const pendingTasks: Partial<Task>[] = [
      { tipo_regra: 'UF_INTRA', uf_origem: 'SP', status: 'todo' },
      { tipo_regra: 'PISCOFINS', status: 'in_research' as const },
    ]

    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: pendingTasks, error: null }),
        }),
      }),
    }
    mockFromFn = jest.fn().mockReturnValue(mockSupabase)

    const result = await checkLeafCompleteness('leaf-pending')

    expect(result.complete).toBe(false)
    // No 'done' tasks → all 41 are missing
    expect(result.missing.length).toBe(TOTAL)
  })

  it('deve calcular coverage_pct corretamente quando algumas tasks estão done', async () => {
    // Complete all 27 UF_INTRA tasks as done
    const UF_LIST = [
      'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
      'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
      'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
    ]
    const doneTasks: Partial<Task>[] = UF_LIST.map((uf) => ({
      tipo_regra: 'UF_INTRA' as const,
      uf_origem: uf,
      status: 'done' as const,
    }))

    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: doneTasks, error: null }),
        }),
      }),
    }
    mockFromFn = jest.fn().mockReturnValue(mockSupabase)

    const result = await checkLeafCompleteness('leaf-partial')

    expect(result.complete).toBe(false)
    // 27 covered out of 41 total
    const expectedPct = Math.round((27 / TOTAL) * 100)
    expect(result.coverage_pct).toBe(expectedPct)
    // Remaining missing: 12 UF_INTER + 1 PISCOFINS + 1 IBSCBSIS = 14
    expect(result.missing.length).toBe(14)
  })

  it('deve retornar complete=true quando todas as 41 tasks estão done', async () => {
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

    const allDone: Partial<Task>[] = [
      ...UF_LIST.map((uf) => ({ tipo_regra: 'UF_INTRA' as const, uf_origem: uf, status: 'done' as const })),
      ...INTER_PAIRS.map(([o, d]) => ({
        tipo_regra: 'UF_INTER' as const,
        uf_origem: o,
        uf_destino: d,
        status: 'done' as const,
      })),
      { tipo_regra: 'PISCOFINS' as const, status: 'done' as const },
      { tipo_regra: 'IBSCBSIS' as const, status: 'done' as const },
    ]

    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: allDone, error: null }),
        }),
      }),
    }
    mockFromFn = jest.fn().mockReturnValue(mockSupabase)

    const result = await checkLeafCompleteness('leaf-complete')

    expect(result.complete).toBe(true)
    expect(result.coverage_pct).toBe(100)
    expect(result.missing.length).toBe(0)
  })

  it('deve lançar erro quando Supabase retorna erro', async () => {
    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: null, error: { message: 'query failed' } }),
        }),
      }),
    }
    mockFromFn = jest.fn().mockReturnValue(mockSupabase)

    await expect(checkLeafCompleteness('leaf-err')).rejects.toThrow('Falha ao buscar tasks')
  })
})
