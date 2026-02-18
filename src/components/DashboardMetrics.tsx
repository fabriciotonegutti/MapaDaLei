'use client'

import { Activity, CheckCircle2, Clock, Gauge, RefreshCw, Shield, XCircle } from 'lucide-react'

import { STATUS_LABELS } from '@/lib/constants'
import { cn, formatPercent } from '@/lib/utils'
import { type TaskStatus } from '@/types'
import { type DashboardMetrics } from '@/hooks/useDashboardMetrics'

interface MetricCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  accent?: 'blue' | 'green' | 'red' | 'yellow' | 'cyan' | 'purple' | 'orange'
  loading?: boolean
}

const ACCENT_CLASSES: Record<NonNullable<MetricCardProps['accent']>, string> = {
  blue: 'text-blue-300 border-blue-800/50',
  green: 'text-emerald-300 border-emerald-800/50',
  red: 'text-red-400 border-red-800/50',
  yellow: 'text-yellow-300 border-yellow-800/50',
  cyan: 'text-cyan-300 border-cyan-800/50',
  purple: 'text-purple-300 border-purple-800/50',
  orange: 'text-orange-300 border-orange-800/50'
}

function MetricCard({ icon, label, value, accent = 'cyan', loading }: MetricCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-gray-900/70 p-4 flex flex-col gap-2',
        ACCENT_CLASSES[accent]
      )}
    >
      <div className={cn('flex items-center gap-2 text-xs font-medium uppercase tracking-wide', ACCENT_CLASSES[accent])}>
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-100">
        {loading ? <span className="text-gray-500 text-base animate-pulse">carregando…</span> : value}
      </p>
    </div>
  )
}

interface DashboardMetricsProps {
  metrics: DashboardMetrics
}

export function DashboardMetricsPanel({ metrics }: DashboardMetricsProps) {
  const {
    throughput24h,
    gatekeeperApprovalRate,
    leavesComplete,
    leavesPending,
    tasksRework,
    tasksBlocked,
    hashChangedCount,
    tasksByStatus,
    isLoading,
    lastUpdated
  } = metrics

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-100">Métricas em Tempo Real</h3>
        {lastUpdated && (
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <RefreshCw className="h-3 w-3" />
            Atualizado {lastUpdated.toLocaleTimeString('pt-BR')}
          </span>
        )}
      </div>

      {/* Primary metrics */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard
          icon={<Activity className="h-4 w-4" />}
          label="Throughput 24h"
          value={throughput24h}
          accent="blue"
          loading={isLoading}
        />
        <MetricCard
          icon={<Shield className="h-4 w-4" />}
          label="Aprovação Gatekeeper"
          value={formatPercent(gatekeeperApprovalRate)}
          accent="green"
          loading={isLoading}
        />
        <MetricCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Leaves Completas"
          value={leavesComplete}
          accent="cyan"
          loading={isLoading}
        />
        <MetricCard
          icon={<Clock className="h-4 w-4" />}
          label="Leaves Pendentes"
          value={leavesPending}
          accent="purple"
          loading={isLoading}
        />
      </div>

      {/* Alert metrics */}
      <div className="grid grid-cols-3 gap-3">
        <MetricCard
          icon={<XCircle className="h-4 w-4" />}
          label="Tasks em Rework"
          value={tasksRework}
          accent={tasksRework > 0 ? 'red' : 'cyan'}
          loading={isLoading}
        />
        <MetricCard
          icon={<Clock className="h-4 w-4" />}
          label="Tasks Bloqueadas"
          value={tasksBlocked}
          accent={tasksBlocked > 0 ? 'yellow' : 'cyan'}
          loading={isLoading}
        />
        <MetricCard
          icon={<Gauge className="h-4 w-4" />}
          label="Legislação Alterada"
          value={hashChangedCount}
          accent={hashChangedCount > 0 ? 'orange' : 'green'}
          loading={isLoading}
        />
      </div>

      {/* Tasks by status mini-grid */}
      <div>
        <p className="mb-2 text-xs uppercase tracking-widest text-gray-500">Tasks por status</p>
        <div className="grid grid-cols-3 gap-2 md:grid-cols-5 lg:grid-cols-9">
          {Object.keys(STATUS_LABELS).map((s) => {
            const status = s as TaskStatus
            const count = tasksByStatus[status] ?? 0
            return (
              <div
                key={status}
                className="rounded-lg border border-gray-800 bg-gray-900/50 p-2 text-center"
              >
                <p className="text-[10px] text-gray-500 truncate">{STATUS_LABELS[status]}</p>
                <p className={cn('text-base font-semibold', count > 0 ? 'text-gray-100' : 'text-gray-600')}>
                  {isLoading ? '—' : count}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
