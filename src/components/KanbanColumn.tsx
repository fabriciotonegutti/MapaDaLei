import { AlertTriangle } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { STATUS_CLASSES, STATUS_LABELS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { Task, TaskStatus } from '@/types'

import { TaskCard } from './TaskCard'

interface KanbanColumnProps {
  status: TaskStatus
  tasks: Task[]
  wipLimit?: number
}

export function KanbanColumn({ status, tasks, wipLimit = 6 }: KanbanColumnProps) {
  const wipExceeded = tasks.length > wipLimit

  return (
    <Card className="h-full border-gray-800 bg-gray-950/80">
      <CardHeader className="border-b border-gray-800 pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <span className={cn('rounded-md px-2 py-1 text-xs font-semibold', STATUS_CLASSES[status])}>
            {STATUS_LABELS[status]}
          </span>
          <span className="text-gray-400">{tasks.length}</span>
        </CardTitle>
        <div className="text-xs text-gray-400">
          WIP {tasks.length}/{wipLimit}{' '}
          {wipExceeded ? (
            <span className="inline-flex items-center gap-1 text-red-400">
              <AlertTriangle className="h-3.5 w-3.5" />
              acima do limite
            </span>
          ) : (
            <span className="text-emerald-300">ok</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 p-3">
        {tasks.length === 0 ? <p className="text-xs text-gray-500">Sem tasks neste estado.</p> : null}
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </CardContent>
    </Card>
  )
}
