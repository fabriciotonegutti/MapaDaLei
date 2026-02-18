'use client'

import { ChevronLeft, ChevronRight, Network, Search } from 'lucide-react'

import { LeafMercadologicalCard } from '@/components/LeafMercadologicalCard'
import { useMercadologicalLeaves } from '@/hooks/useMercadologicalLeaves'

/**
 * /mercadological
 *
 * Browse page for the 4,251 mercadological leaves from classifica_ai.
 * Supports real-time search (debounced 300 ms) and pagination.
 */
export default function MercadologicalPage() {
  const { items, total, totalPages, page, isLoading, error, setPage, setSearch } =
    useMercadologicalLeaves()

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value)
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Network className="h-6 w-6 text-cyan-400" />
          <h1 className="text-2xl font-semibold text-gray-100">Estrutura Mercadológica</h1>
        </div>
        <p className="text-sm text-gray-500">
          {total > 0 ? (
            <>
              <span className="font-mono text-cyan-400">{total.toLocaleString('pt-BR')}</span>{' '}
              leaves no nível 6 — browse e ative para gerar o backlog Kanban
            </>
          ) : (
            'Carregando…'
          )}
        </p>
      </div>

      {/* ── Search ── */}
      <div className="relative max-w-lg">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <input
          type="search"
          placeholder="Buscar por nome ou caminho… (ex: BOVINOS, BEBIDAS)"
          onChange={handleSearchChange}
          className="w-full rounded-lg border border-gray-700 bg-gray-900 py-2 pl-9 pr-4 text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-cyan-700 focus:ring-1 focus:ring-cyan-700"
        />
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="rounded-lg border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-400">
          Erro: {error}
        </div>
      )}

      {/* ── Loading skeleton ── */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="h-36 animate-pulse rounded-xl border border-gray-800 bg-gray-900"
            />
          ))}
        </div>
      )}

      {/* ── Cards grid ── */}
      {!isLoading && items.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((leaf) => (
            <LeafMercadologicalCard key={leaf.id} leaf={leaf} />
          ))}
        </div>
      )}

      {/* ── Empty state ── */}
      {!isLoading && items.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-800 py-16 text-gray-600">
          <Network className="h-10 w-10 opacity-30" />
          <p className="text-sm">Nenhuma leaf encontrada para este filtro.</p>
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 py-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="flex items-center gap-1 rounded-lg border border-gray-700 bg-gray-900 px-3 py-1.5 text-sm text-gray-300 transition-colors hover:border-gray-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </button>

          <span className="text-sm text-gray-500">
            Página{' '}
            <span className="font-mono text-gray-300">{page}</span>
            {' '}de{' '}
            <span className="font-mono text-gray-300">{totalPages}</span>
          </span>

          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="flex items-center gap-1 rounded-lg border border-gray-700 bg-gray-900 px-3 py-1.5 text-sm text-gray-300 transition-colors hover:border-gray-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Próximo
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
