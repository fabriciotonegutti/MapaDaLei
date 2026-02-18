'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { LegislativeEvidence } from '@/types'

export function useMonitor() {
  const [evidences, setEvidences] = useState<LegislativeEvidence[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMonitor = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/monitor', { cache: 'no-store' })
      if (!response.ok) throw new Error('Falha ao carregar monitor')
      const data = (await response.json()) as LegislativeEvidence[]
      setEvidences(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const recheckEvidence = useCallback(async (id: string) => {
    const response = await fetch('/api/monitor', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })

    if (!response.ok) {
      throw new Error('Falha ao re-verificar evidência')
    }

    const updated = (await response.json()) as LegislativeEvidence
    setEvidences((previous) => previous.map((item) => (item.id === updated.id ? updated : item)))
    return updated
  }, [])

  useEffect(() => {
    void fetchMonitor()
  }, [fetchMonitor])

  const changedCount = useMemo(() => evidences.filter((evidence) => evidence.hash_changed).length, [evidences])

  return {
    evidences,
    changedCount,
    isLoading,
    error,
    fetchMonitor,
    recheckEvidence
  }
}
