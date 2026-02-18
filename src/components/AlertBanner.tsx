'use client'

import { AlertCircle, AlertTriangle, Clock, TrendingDown } from 'lucide-react'

import { cn } from '@/lib/utils'
import { type DashboardMetrics } from '@/hooks/useDashboardMetrics'

interface AlertBannerProps {
  metrics: DashboardMetrics
  blockedThresholdHours?: number
  rejectionRateThreshold?: number
}

interface AlertItem {
  id: string
  icon: React.ReactNode
  message: string
  variant: 'red' | 'yellow' | 'orange'
}

const VARIANT_CLASSES: Record<AlertItem['variant'], string> = {
  red: 'bg-red-950/60 border-red-700/60 text-red-300',
  yellow: 'bg-yellow-950/60 border-yellow-700/60 text-yellow-300',
  orange: 'bg-orange-950/60 border-orange-700/60 text-orange-300'
}

const PULSE_CLASSES: Record<AlertItem['variant'], string> = {
  red: 'bg-red-500',
  yellow: 'bg-yellow-400',
  orange: 'bg-orange-400'
}

export function AlertBanner({
  metrics,
  blockedThresholdHours = 4,
  rejectionRateThreshold = 30
}: AlertBannerProps) {
  const alerts: AlertItem[] = []

  // Alert 1: Legislation changed (hash changed)
  if (metrics.hashChangedCount > 0) {
    alerts.push({
      id: 'hash-changed',
      icon: <AlertCircle className="h-4 w-4 shrink-0" />,
      message: `${metrics.hashChangedCount} fonte${metrics.hashChangedCount > 1 ? 's' : ''} legislativa${metrics.hashChangedCount > 1 ? 's' : ''} alterada${metrics.hashChangedCount > 1 ? 's' : ''}. Revise as tasks impactadas.`,
      variant: 'red'
    })
  }

  // Alert 2: Blocked tasks
  if (metrics.tasksBlocked > 0) {
    alerts.push({
      id: 'blocked-tasks',
      icon: <Clock className="h-4 w-4 shrink-0" />,
      message: `${metrics.tasksBlocked} task${metrics.tasksBlocked > 1 ? 's' : ''} bloqueada${metrics.tasksBlocked > 1 ? 's' : ''} há mais de ${blockedThresholdHours}h. Intervenção necessária.`,
      variant: 'yellow'
    })
  }

  // Alert 3: High rejection rate
  const rejectionRate = 100 - metrics.gatekeeperApprovalRate
  if (rejectionRate > rejectionRateThreshold && metrics.gatekeeperApprovalRate > 0) {
    alerts.push({
      id: 'high-rejection',
      icon: <TrendingDown className="h-4 w-4 shrink-0" />,
      message: `Taxa de rejeição do gatekeeper em ${rejectionRate.toFixed(0)}% (acima do limite de ${rejectionRateThreshold}%). Revise a qualidade das propostas.`,
      variant: 'orange'
    })
  }

  // Alert 4: Rework tasks
  if (metrics.tasksRework > 0) {
    alerts.push({
      id: 'rework-tasks',
      icon: <AlertTriangle className="h-4 w-4 shrink-0" />,
      message: `${metrics.tasksRework} task${metrics.tasksRework > 1 ? 's' : ''} em REWORK aguardando revisão.`,
      variant: 'orange'
    })
  }

  if (alerts.length === 0 || metrics.isLoading) return null

  return (
    <div className="space-y-2" role="alert" aria-live="polite">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={cn(
            'flex items-start gap-3 rounded-xl border px-4 py-3 text-sm font-medium',
            VARIANT_CLASSES[alert.variant]
          )}
        >
          {/* Pulsing dot indicator */}
          <span className="relative mt-0.5 flex h-3 w-3 shrink-0">
            <span
              className={cn(
                'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
                PULSE_CLASSES[alert.variant]
              )}
            />
            <span
              className={cn('relative inline-flex h-3 w-3 rounded-full', PULSE_CLASSES[alert.variant])}
            />
          </span>
          {alert.icon}
          <span>{alert.message}</span>
        </div>
      ))}
    </div>
  )
}
