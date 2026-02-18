import { KANBAN_AUX_STATUSES, KANBAN_PRIMARY_STATUSES } from '@/lib/constants'
import { Task } from '@/types'

import { KanbanColumn } from './KanbanColumn'

interface KanbanBoardProps {
  tasks: Task[]
}

export function KanbanBoard({ tasks }: KanbanBoardProps) {
  const byStatus = (status: Task['status']) => tasks.filter((task) => task.status === status)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
        {KANBAN_PRIMARY_STATUSES.map((status) => (
          <KanbanColumn key={status} status={status} tasks={byStatus(status)} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {KANBAN_AUX_STATUSES.map((status) => (
          <KanbanColumn key={status} status={status} tasks={byStatus(status)} wipLimit={3} />
        ))}
      </div>
    </div>
  )
}
