'use client'

import { useState, useEffect, useCallback } from 'react'
import { FlaskConical, RefreshCw, PlayCircle, CheckCircle2, XCircle, Clock } from 'lucide-react'

import { DashboardMetricsPanel } from '@/components/DashboardMetrics'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PilotStatus {
  mode: 'live' | 'mock'
  leaves_total: number
  tasks_total: number
  recent_tasks: {
    id: number
    title: string
    status: string
    priority: string
    created_at: string
  }[]
}

interface PilotResult {
  leaves_activated: number
  tasks_created: number
  errors: number
  mode: 'live' | 'mock'
  results: {
    leaf_id: number
    leaf_name: string
    supabase_uuid: string
    tasks_created: number
    already_existed: boolean
    error?: string
  }[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function StatusIcon({ status }: { status: string }) {
  if (status === 'done') return <CheckCircle2 className="h-4 w-4 text-emerald-400" />
  if (status === 'blocked' || status === 'rework') return <XCircle className="h-4 w-4 text-red-400" />
  return <Clock className="h-4 w-4 text-yellow-400" />
}

function priorityColor(priority: string) {
  if (priority === 'P0' || priority === 'P1') return 'bg-red-900/40 text-red-300 border-red-700'
  if (priority === 'P2') return 'bg-yellow-900/40 text-yellow-300 border-yellow-700'
  return 'bg-gray-800 text-gray-300 border-gray-700'
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PilotPage() {
  const metrics = useDashboardMetrics(30_000)
  const [status, setStatus] = useState<PilotStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [running, setRunning] = useState(false)
  const [lastResult, setLastResult] = useState<PilotResult | null>(null)

  const fetchStatus = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/pilot')
      if (res.ok) {
        const data = (await res.json()) as PilotStatus
        setStatus(data)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchStatus()
  }, [fetchStatus])

  const runPilot = async () => {
    setRunning(true)
    try {
      const res = await fetch('/api/pilot', { method: 'POST' })
      const data = (await res.json()) as PilotResult
      setLastResult(data)
      // Refresh status after run
      await fetchStatus()
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="rounded-2xl border border-gray-800 bg-gray-900/60 p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/80">Sprint 4</p>
        <h2 className="mt-2 flex items-center gap-2 text-3xl font-semibold text-gray-100">
          <FlaskConical className="h-8 w-8 text-purple-400" />
          Piloto com Leaves Reais
        </h2>
        <p className="mt-2 text-sm text-gray-400">
          Teste end-to-end com leaves reais do classifica_ai — ativação + geração de 41 tasks por leaf
        </p>
      </header>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 text-center">
          <p className="text-xs text-gray-400">Leaves Ativas</p>
          <p className="mt-1 text-3xl font-bold text-cyan-400">
            {status?.leaves_total ?? '—'}
          </p>
          <p className="mt-0.5 text-xs text-gray-500">no Supabase</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 text-center">
          <p className="text-xs text-gray-400">Tasks Criadas</p>
          <p className="mt-1 text-3xl font-bold text-purple-400">
            {status?.tasks_total ?? '—'}
          </p>
          <p className="mt-0.5 text-xs text-gray-500">projeto #70</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 text-center">
          <p className="text-xs text-gray-400">Tasks / Leaf</p>
          <p className="mt-1 text-3xl font-bold text-emerald-400">41</p>
          <p className="mt-0.5 text-xs text-gray-500">27 INTRA + 12 INTER + 2</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 text-center">
          <p className="text-xs text-gray-400">Modo</p>
          <p className="mt-1 text-xl font-bold text-gray-200 uppercase">
            {status?.mode ?? '—'}
          </p>
          <p className="mt-0.5 text-xs text-gray-500">
            {status?.mode === 'live' ? 'Supabase real' : 'simulado'}
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        <Button
          onClick={() => void runPilot()}
          disabled={running}
          className="bg-purple-700 hover:bg-purple-600"
        >
          <PlayCircle className="mr-2 h-4 w-4" />
          {running ? 'Rodando piloto...' : 'Rodar piloto com 3 leaves'}
        </Button>
        <Button
          variant="secondary"
          onClick={() => void fetchStatus()}
          disabled={loading}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar status
        </Button>
      </div>

      {/* Last pilot result */}
      {lastResult && (
        <div className="rounded-xl border border-purple-800/50 bg-purple-950/30 p-5">
          <h3 className="mb-3 text-lg font-semibold text-purple-300">
            ✅ Resultado do último piloto
          </h3>
          <div className="mb-4 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-400">Leaves ativadas</p>
              <p className="text-2xl font-bold text-emerald-400">{lastResult.leaves_activated}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Tasks criadas</p>
              <p className="text-2xl font-bold text-purple-400">{lastResult.tasks_created}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Erros</p>
              <p className={`text-2xl font-bold ${lastResult.errors > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {lastResult.errors}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {lastResult.results.map((r) => (
              <div
                key={r.leaf_id}
                className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900/50 px-4 py-2"
              >
                <div>
                  <p className="text-sm font-medium text-gray-200">{r.leaf_name}</p>
                  <p className="text-xs text-gray-500">ID: {r.leaf_id} · UUID: {r.supabase_uuid.slice(0, 12)}…</p>
                  {r.error && <p className="text-xs text-red-400">{r.error}</p>}
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-purple-300">{r.tasks_created} tasks</p>
                  {r.already_existed && (
                    <p className="text-xs text-yellow-500">já existia</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fiscal Metrics */}
      <section className="rounded-2xl border border-gray-800 bg-gray-900/30 p-5">
        <h3 className="mb-4 text-lg font-semibold text-gray-200">Métricas Fiscais (classifica-ai)</h3>
        <DashboardMetricsPanel metrics={metrics} />
      </section>

      {/* Recent tasks */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-200">
          Últimas 10 tasks criadas (projeto #70)
        </h3>
        {!status?.recent_tasks?.length ? (
          <p className="text-sm text-gray-400">Nenhuma task criada ainda.</p>
        ) : (
          <div className="space-y-2">
            {status.recent_tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-start gap-3 rounded-lg border border-gray-800 bg-gray-900/50 px-4 py-3"
              >
                <StatusIcon status={task.status} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-200">{task.title}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(task.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`text-xs ${priorityColor(task.priority)}`}
                  >
                    {task.priority}
                  </Badge>
                  <Badge variant="outline" className="text-xs text-gray-400">
                    {task.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
