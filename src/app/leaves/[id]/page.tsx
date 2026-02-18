'use client'

import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import { Link2 } from 'lucide-react'

import { KanbanBoard } from '@/components/KanbanBoard'
import { LeafProgressBar } from '@/components/LeafProgressBar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useLeaves } from '@/hooks/useLeaves'
import { useTasks } from '@/hooks/useTasks'

export default function LeafDetailPage() {
  const params = useParams<{ id: string }>()
  const leafId = params.id

  const { leaves, isLoading: isLeavesLoading } = useLeaves()
  const { tasks, isLoading: isTasksLoading } = useTasks({ leafId })

  const leaf = useMemo(() => leaves.find((item) => item.id === leafId), [leafId, leaves])

  if (isLeavesLoading || isTasksLoading) {
    return <p className="text-sm text-gray-400">Carregando detalhe da leaf...</p>
  }

  if (!leaf) {
    return <p className="text-sm text-red-300">Leaf não encontrada.</p>
  }

  return (
    <div className="space-y-6">
      <Card className="border-gray-800 bg-gray-900/60">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-2xl">{leaf.name}</CardTitle>
              <p className="mt-2 flex items-center gap-2 text-sm text-gray-400">
                <Link2 className="h-4 w-4" /> {leaf.category_path}
              </p>
            </div>
            <Badge variant="outline">{leaf.ncm ?? 'NCM não informado'}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <LeafProgressBar coverage={leaf.coverage_pct} tasksDone={leaf.tasks_done} tasksTotal={leaf.tasks_total} />
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h3 className="text-xl font-semibold">Kanban de tasks</h3>
        <KanbanBoard tasks={tasks} />
      </section>
    </div>
  )
}
