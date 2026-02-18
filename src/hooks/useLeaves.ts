'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { Leaf } from '@/types'

interface CreateLeafInput {
  name: string
  category_path: string
  ncm?: string
}

export function useLeaves() {
  const [leaves, setLeaves] = useState<Leaf[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLeaves = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/leaves', { cache: 'no-store' })
      if (!response.ok) throw new Error('Falha ao carregar leaves')
      const data = (await response.json()) as Leaf[]
      setLeaves(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createLeaf = useCallback(async (payload: CreateLeafInput) => {
    const response = await fetch('/api/leaves', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error('Não foi possível criar a leaf')
    }

    const leaf = (await response.json()) as Leaf
    setLeaves((previous) => [leaf, ...previous])
    return leaf
  }, [])

  useEffect(() => {
    void fetchLeaves()
  }, [fetchLeaves])

  const summary = useMemo(() => {
    const total = leaves.length
    const avgCoverage = total > 0 ? leaves.reduce((acc, leaf) => acc + leaf.coverage_pct, 0) / total : 0
    return {
      total,
      avgCoverage
    }
  }, [leaves])

  return {
    leaves,
    isLoading,
    error,
    summary,
    fetchLeaves,
    createLeaf
  }
}
