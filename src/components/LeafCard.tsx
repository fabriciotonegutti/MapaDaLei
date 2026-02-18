import Link from 'next/link'
import { ArrowRight, Layers3 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Leaf } from '@/types'

import { LeafProgressBar } from './LeafProgressBar'

interface LeafCardProps {
  leaf: Leaf
}

export function LeafCard({ leaf }: LeafCardProps) {
  return (
    <Card className="border-gray-800 bg-gray-900/80">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">{leaf.name}</CardTitle>
            <p className="mt-1 text-xs text-gray-400">{leaf.category_path}</p>
          </div>
          <Badge variant="outline" className="text-gray-300">
            {leaf.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm text-gray-300">
          <span className="inline-flex items-center gap-1">
            <Layers3 className="h-4 w-4" /> NCM: {leaf.ncm ?? 'N/A'}
          </span>
          <span>{leaf.tasks_total} tasks</span>
        </div>

        <LeafProgressBar coverage={leaf.coverage_pct} tasksDone={leaf.tasks_done} tasksTotal={leaf.tasks_total} />

        <Link
          href={`/leaves/${leaf.id}`}
          className="inline-flex items-center text-sm font-medium text-blue-300 hover:text-blue-200"
        >
          Ver detalhe da leaf <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </CardContent>
    </Card>
  )
}
