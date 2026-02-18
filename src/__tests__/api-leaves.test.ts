/**
 * api-leaves.test.ts — Sprint 4
 *
 * Unit tests for the leaves query layer.
 * Uses a manual mock of the pg Pool so no real database is required.
 */

// ─── Mock pg Pool ────────────────────────────────────────────────────────────

const mockQueryFn = jest.fn()

jest.mock('pg', () => {
  return {
    Pool: jest.fn().mockImplementation(() => ({
      query: mockQueryFn,
    })),
  }
})

// Re-import AFTER mock is in place
import { queryLeaves, queryLeafById } from '../lib/db/leaves-query'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const mockLeafRow = {
  id: 42,
  code: 10010101,
  name: 'Carne bovina fresca refrigerada',
  level: 6,
  full_path: 'Alimentos > Carnes > Bovina > Fresca > Refrigerada',
  status: 'active',
  ncm_code: '02013000',
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('queryLeaves — paginated list of level-6 leaves', () => {
  beforeEach(() => {
    mockQueryFn.mockReset()
  })

  it('deve retornar um array de leaves com total > 0', async () => {
    // First call: COUNT query
    mockQueryFn.mockResolvedValueOnce({ rows: [{ cnt: '4251' }] })
    // Second call: DATA query
    mockQueryFn.mockResolvedValueOnce({ rows: [mockLeafRow] })

    const result = await queryLeaves()

    expect(Array.isArray(result.items)).toBe(true)
    expect(result.total).toBeGreaterThan(0)
    expect(result.total).toBe(4251)
    expect(result.items.length).toBe(1)
  })

  it('deve retornar items com os campos obrigatórios', async () => {
    mockQueryFn.mockResolvedValueOnce({ rows: [{ cnt: '4251' }] })
    mockQueryFn.mockResolvedValueOnce({ rows: [mockLeafRow] })

    const result = await queryLeaves()
    const leaf = result.items[0]

    expect(leaf).toHaveProperty('id')
    expect(leaf).toHaveProperty('code')
    expect(leaf).toHaveProperty('name')
    expect(leaf).toHaveProperty('level')
    expect(leaf).toHaveProperty('full_path')
    expect(typeof leaf.id).toBe('number')
    expect(typeof leaf.name).toBe('string')
    expect(leaf.level).toBe(6)
  })

  it('deve respeitar paginação com page e pageSize', async () => {
    mockQueryFn.mockResolvedValueOnce({ rows: [{ cnt: '4251' }] })
    mockQueryFn.mockResolvedValueOnce({ rows: [] })

    const result = await queryLeaves({ page: 2, pageSize: 10 })

    expect(result.page).toBe(2)
    expect(result.pageSize).toBe(10)

    // Verify OFFSET was passed correctly (page=2, pageSize=10 → offset=10)
    const dataCallArgs = mockQueryFn.mock.calls[1][1]
    expect(dataCallArgs[2]).toBe(10) // offset
    expect(dataCallArgs[1]).toBe(10) // limit
  })

  it('deve filtrar por search quando fornecido', async () => {
    mockQueryFn.mockResolvedValueOnce({ rows: [{ cnt: '2' }] })
    mockQueryFn.mockResolvedValueOnce({
      rows: [
        { ...mockLeafRow, id: 100, name: 'Carne bovina moída' },
        { ...mockLeafRow, id: 101, name: 'Carne bovina em cubos' },
      ],
    })

    const result = await queryLeaves({ search: 'bovina' })

    expect(result.items.length).toBe(2)
    expect(result.total).toBe(2)

    // Verify search param was passed
    const countCallArgs = mockQueryFn.mock.calls[0][1]
    expect(countCallArgs[0]).toBe('%bovina%')
  })

  it('deve retornar lista vazia quando não há resultados', async () => {
    mockQueryFn.mockResolvedValueOnce({ rows: [{ cnt: '0' }] })
    mockQueryFn.mockResolvedValueOnce({ rows: [] })

    const result = await queryLeaves({ search: 'naoexiste' })

    expect(result.items).toEqual([])
    expect(result.total).toBe(0)
  })

  it('deve mapear ncm_code null para undefined', async () => {
    mockQueryFn.mockResolvedValueOnce({ rows: [{ cnt: '1' }] })
    mockQueryFn.mockResolvedValueOnce({ rows: [{ ...mockLeafRow, ncm_code: null }] })

    const result = await queryLeaves()
    expect(result.items[0].ncm_code).toBeUndefined()
  })
})

describe('queryLeafById — busca leaf por ID', () => {
  beforeEach(() => {
    mockQueryFn.mockReset()
  })

  it('deve retornar a leaf quando encontrada', async () => {
    // First call: main query
    mockQueryFn.mockResolvedValueOnce({
      rows: [
        {
          id: 42,
          code: 10010101,
          name: 'Carne bovina fresca',
          level: 6,
          full_path: 'Alimentos > Carnes > Bovina',
          status: 'active',
        },
      ],
    })
    // Second call: NCM lookup
    mockQueryFn.mockResolvedValueOnce({ rows: [{ ncm_code: '02013000' }] })

    const leaf = await queryLeafById(42)

    expect(leaf).not.toBeNull()
    expect(leaf!.id).toBe(42)
    expect(leaf!.name).toBe('Carne bovina fresca')
    expect(leaf!.ncm_code).toBe('02013000')
  })

  it('deve retornar null para ID inexistente', async () => {
    mockQueryFn.mockResolvedValueOnce({ rows: [] })

    const leaf = await queryLeafById(999999)

    expect(leaf).toBeNull()
  })

  it('deve retornar leaf sem ncm_code quando não há mapeamento NCM', async () => {
    mockQueryFn.mockResolvedValueOnce({
      rows: [
        {
          id: 55,
          code: 20020202,
          name: 'Produto sem NCM',
          level: 6,
          full_path: 'Categoria > Subcategoria',
          status: 'active',
        },
      ],
    })
    // No NCM found
    mockQueryFn.mockResolvedValueOnce({ rows: [] })

    const leaf = await queryLeafById(55)

    expect(leaf).not.toBeNull()
    expect(leaf!.ncm_code).toBeUndefined()
  })
})
