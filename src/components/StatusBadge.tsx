import { STATUS_CLASSES, STATUS_LABELS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { TaskStatus } from '@/types'

interface StatusBadgeProps {
  status: TaskStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={cn('inline-flex rounded-md px-2 py-1 text-xs font-semibold', STATUS_CLASSES[status])}>
      {STATUS_LABELS[status]}
    </span>
  )
}
