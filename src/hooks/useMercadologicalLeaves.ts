'use client'

import { useState, useEffect, useCallback } from 'react'

import type { LeafRow } from '@/lib/db/leaves-query'

interface UseMercadologicalLeavesOptions {
  search?: string
  page?: number
  pageSize?: number
}

interface UseMercadologicalLeavesResult {
  items: LeafRow[]
  total: number
  totalPages: number
  page: number
  pageSize: number
  isLoading: boolean
  error: string | null
  setPage: (page: number) => void
  setSearch: (search: string) => void
}

/**
 * Hook that fetches paginated mercadological leaves from the API.
 * Search input is debounced 300 ms to avoid hammering the server.
 */
export function useMercadologicalLeaves(
  options: UseMercadologicalLeavesOptions = {}
): UseMercadologicalLeavesResult {
  const [search, setSearchRaw] = useState(options.search ?? '')
  const [debouncedSearch, setDebouncedSearch] = useState(search)
  const [page, setPage] = useState(options.page ?? 1)
  const [pageSize] = useState(options.pageSize ?? 50)

  const [items, setItems] = useState<LeafRow[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Debounce search 300 ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1) // reset to page 1 on new search
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // Fetch whenever debouncedSearch, page, or pageSize changes
  useEffect(() => {
    let cancelled = false

    async function fetchLeaves() {
      setIsLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({
          search: debouncedSearch,
          page: String(page),
          pageSize: String(pageSize),
        })
        const res = await fetch(`/api/mercadological/leaves?${params.toString()}`)
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error ?? `HTTP ${res.status}`)
        }
        const data = await res.json()
        if (!cancelled) {
          setItems(data.items ?? [])
          setTotal(data.total ?? 0)
          setTotalPages(data.totalPages ?? 1)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err))
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void fetchLeaves()
    return () => {
      cancelled = true
    }
  }, [debouncedSearch, page, pageSize])

  const setSearch = useCallback((value: string) => {
    setSearchRaw(value)
  }, [])

  return {
    items,
    total,
    totalPages,
    page,
    pageSize,
    isLoading,
    error,
    setPage,
    setSearch,
  }
}
