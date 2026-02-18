'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, Loader2, Zap } from 'lucide-react'

import type { LeafRow } from '@/lib/db/leaves-query'
import { cn } from '@/lib/utils'

interface LeafMercadologicalCardProps {
  leaf: LeafRow
  onActivated?: (leafId: string) => void
}

/**
 * Card that displays a single mercadological leaf.
 * The "Ativar Leaf" button calls POST /activate and redirects.
 */
export function LeafMercadologicalCard({ leaf, onActivated }: LeafMercadologicalCardProps) {
  const router = useRouter()
  const [activating, setActivating] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  // Parse breadcrumb from full_path (split by " > ")
  const pathSegments = leaf.full_path.split(' > ')

  async function handleActivate() {
    if (activating) return
    setActivating(true)
    setToastMsg(null)
    try {
      const res = await fetch(`/api/mercadological/leaves/${leaf.id}/activate`, {
        method: 'POST',
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }
      const data = await res.json()
      const supabaseId: string = data.leaf?.supabase_id ?? String(leaf.id)
      setToastMsg(`✓ Leaf ativada! ${data.tasks_created} tasks criadas.`)
      onActivated?.(supabaseId)
      // Redirect to the leaf detail page after a short delay
      setTimeout(() => {
        router.push(`/leaves/${supabaseId}`)
      }, 1200)
    } catch (err) {
      setToastMsg(`✗ ${err instanceof Error ? err.message : 'Erro ao ativar leaf'}`)
      setActivating(false)
    }
  }

  const isActive = leaf.status === 'active' || leaf.status === 'ativo'

  return (
    <div className="relative flex flex-col gap-3 rounded-xl border border-gray-800 bg-gray-900 p-4 shadow-sm transition-colors hover:border-cyan-800/60">
      {/* Toast feedback */}
      {toastMsg && (
        <div
          className={cn(
            'absolute inset-x-0 top-0 z-10 rounded-t-xl px-4 py-2 text-xs font-medium',
            toastMsg.startsWith('✓')
              ? 'bg-emerald-900/90 text-emerald-300'
              : 'bg-red-900/90 text-red-300'
          )}
        >
          {toastMsg}
        </div>
      )}

      {/* Header — name + badges */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold leading-snug text-gray-100">{leaf.name}</h3>
        <div className="flex shrink-0 flex-wrap gap-1">
          {leaf.ncm_code && (
            <span className="rounded bg-cyan-950 px-1.5 py-0.5 text-[10px] font-mono text-cyan-400 ring-1 ring-cyan-800">
              NCM {leaf.ncm_code}
            </span>
          )}
          <span
            className={cn(
              'rounded px-1.5 py-0.5 text-[10px] font-medium ring-1',
              isActive
                ? 'bg-emerald-950 text-emerald-400 ring-emerald-800'
                : 'bg-gray-800 text-gray-500 ring-gray-700'
            )}
          >
            {isActive ? 'ativo' : 'inativo'}
          </span>
        </div>
      </div>

      {/* Breadcrumb */}
      <ol className="flex min-w-0 flex-wrap items-center gap-0.5 text-[11px] text-gray-500">
        {pathSegments.map((seg, i) => (
          <li key={i} className="flex items-center gap-0.5">
            {i > 0 && <ChevronRight className="h-3 w-3 shrink-0 text-gray-700" />}
            <span
              className={cn(
                'max-w-[120px] truncate',
                i === pathSegments.length - 1 ? 'font-medium text-gray-400' : ''
              )}
              title={seg}
            >
              {seg}
            </span>
          </li>
        ))}
      </ol>

      {/* Activate button */}
      <button
        onClick={handleActivate}
        disabled={activating}
        className={cn(
          'mt-auto flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors',
          activating
            ? 'cursor-not-allowed bg-cyan-900/30 text-cyan-600'
            : 'bg-cyan-700 text-white hover:bg-cyan-600 active:bg-cyan-800'
        )}
      >
        {activating ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Ativando…
          </>
        ) : (
          <>
            <Zap className="h-3.5 w-3.5" />
            Ativar Leaf
          </>
        )}
      </button>
    </div>
  )
}
