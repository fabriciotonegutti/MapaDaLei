'use client'

import { Expand } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { TIPO_REGRA_CLASSES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { Task } from '@/types'

import { AgentBadge } from './AgentBadge'
import { PriorityBadge } from './PriorityBadge'
import { TaskDetailModal } from './TaskDetailModal'

interface TaskCardProps {
  task: Task
}

export function TaskCard({ task }: TaskCardProps) {
  return (
    <Card className="border-gray-800 bg-gray-900/90">
      <CardContent className="space-y-3 p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="line-clamp-2 text-sm font-semibold text-gray-100">{task.title}</p>
          <PriorityBadge priority={task.priority} />
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge className={cn('border', TIPO_REGRA_CLASSES[task.tipo_regra])}>{task.tipo_regra}</Badge>
          {task.uf_origem ? <Badge variant="outline">{task.uf_origem}</Badge> : null}
          {task.uf_destino ? <Badge variant="outline">{task.uf_destino}</Badge> : null}
        </div>

        <div className="flex items-center justify-between gap-2">
          <AgentBadge agent={task.owner_agent} />
          <TaskDetailModal
            task={task}
            trigger={
              <Button size="sm" variant="ghost" className="h-8 px-2 text-xs text-gray-300">
                <Expand className="mr-1.5 h-4 w-4" />
                Detalhes
              </Button>
            }
          />
        </div>
      </CardContent>
    </Card>
  )
}
