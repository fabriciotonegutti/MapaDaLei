'use client'

import { useEffect, useRef, useState } from 'react'

import { type FiscalAlert } from '@/lib/classifica-ai/fiscal-alerts'
import { type FiscalMetrics } from '@/lib/classifica-ai/fiscal-metrics'
import { type Leaf, type Task } from '@/types'

export interface DashboardMetrics {
  // Local task/leaf metrics
  tasksByStatus: Record<string, number>
  throughput24h: number
  gatekeeperApprovalRate: number
  leavesComplete: number
  leavesPending: number
  tasksRework: number
  tasksBlocked: number
  hashChangedCount: number

  // classifica-ai real-time fiscal metrics
  fiscalTotalDecisions24h: number
  fiscalBlockedRate24h: number
  fiscalReviewBacklog: number
  fiscalAvgLatencyMs24h: number
  fiscalAlerts: FiscalAlert[]
  fiscalCriticalAlerts: number

  isLoading: boolean
  error: string | null
  lastUpdated: Date | null
}

const DEFAULT_METRICS: DashboardMetrics = {
  tasksByStatus: {},
  throughput24h: 0,
  gatekeeperApprovalRate: 0,
  leavesComplete: 0,
  leavesPending: 0,
  tasksRework: 0,
  tasksBlocked: 0,
  hashChangedCount: 0,

  fiscalTotalDecisions24h: 0,
  fiscalBlockedRate24h: 0,
  fiscalReviewBacklog: 0,
  fiscalAvgLatencyMs24h: 0,
  fiscalAlerts: [],
  fiscalCriticalAlerts: 0,

  isLoading: true,
  error: null,
  lastUpdated: null
}

export function useDashboardMetrics(pollIntervalMs = 30_000): DashboardMetrics {
  const [metrics, setMetrics] = useState<DashboardMetrics>(DEFAULT_METRICS)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchMetrics = async () => {
    try {
      const [tasksRes, leavesRes, monitorRes, fiscalMetricsRes, fiscalAlertsRes] =
        await Promise.all([
          fetch('/api/tasks', { cache: 'no-store' }),
          fetch('/api/leaves', { cache: 'no-store' }),
          fetch('/api/monitor', { cache: 'no-store' }),
          fetch('/api/fiscal/metrics', { cache: 'no-store' }),
          fetch('/api/fiscal/alerts', { cache: 'no-store' })
        ])

      const tasks = tasksRes.ok ? ((await tasksRes.json()) as Task[]) : []
      const leaves = leavesRes.ok ? ((await leavesRes.json()) as Leaf[]) : []
      const monitorData = monitorRes.ok
        ? ((await monitorRes.json()) as Array<{ hash_changed?: boolean }>)
        : []

      const fiscalMetrics: FiscalMetrics = fiscalMetricsRes.ok
        ? ((await fiscalMetricsRes.json()) as FiscalMetrics)
        : { total_decisions_24h: 0, blocked_rate_24h: 0, review_backlog: 0, avg_latency_ms_24h: 0 }

      const fiscalAlerts: FiscalAlert[] = fiscalAlertsRes.ok
        ? ((await fiscalAlertsRes.json()) as FiscalAlert[])
        : []

      // ── Local metrics ─────────────────────────────────────────────────────
      const tasksByStatus: Record<string, number> = {}
      for (const task of tasks) {
        tasksByStatus[task.status] = (tasksByStatus[task.status] ?? 0) + 1
      }

      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const throughput24h = tasks.filter(
        (t) => t.status === 'done' && new Date(t.updated_at) >= cutoff
      ).length

      const decided = tasks.filter(
        (t) => t.semantic_decision !== null && t.semantic_decision !== undefined
      )
      const approved = decided.filter((t) => t.semantic_decision === 'approved')
      const gatekeeperApprovalRate =
        decided.length > 0 ? Math.round((approved.length / decided.length) * 100) : 0

      const leavesComplete = leaves.filter((l) => l.status === 'complete').length
      const leavesPending = leaves.filter((l) => l.status !== 'complete').length

      const tasksRework = tasksByStatus['rework'] ?? 0
      const tasksBlocked = tasksByStatus['blocked'] ?? 0
      const hashChangedCount = monitorData.filter((e) => e.hash_changed).length

      // ── Fiscal metrics ────────────────────────────────────────────────────
      const fiscalCriticalAlerts = fiscalAlerts.filter(
        (a) => a.severity === 'critical' && a.status === 'open'
      ).length

      setMetrics({
        tasksByStatus,
        throughput24h,
        gatekeeperApprovalRate,
        leavesComplete,
        leavesPending,
        tasksRework,
        tasksBlocked,
        hashChangedCount,

        fiscalTotalDecisions24h: fiscalMetrics.total_decisions_24h,
        fiscalBlockedRate24h: fiscalMetrics.blocked_rate_24h,
        fiscalReviewBacklog: fiscalMetrics.review_backlog,
        fiscalAvgLatencyMs24h: fiscalMetrics.avg_latency_ms_24h,
        fiscalAlerts,
        fiscalCriticalAlerts,

        isLoading: false,
        error: null,
        lastUpdated: new Date()
      })
    } catch (err) {
      setMetrics((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Erro ao carregar métricas'
      }))
    }
  }

  useEffect(() => {
    void fetchMetrics()

    intervalRef.current = setInterval(() => {
      void fetchMetrics()
    }, pollIntervalMs)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollIntervalMs])

  return metrics
}
