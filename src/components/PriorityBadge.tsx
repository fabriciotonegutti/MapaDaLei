import { PRIORITY_CLASSES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { Priority } from '@/types'

interface PriorityBadgeProps {
  priority: Priority
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  return (
    <span className={cn('inline-flex rounded-md border px-2 py-1 text-xs font-semibold', PRIORITY_CLASSES[priority])}>
      {priority}
    </span>
  )
}
