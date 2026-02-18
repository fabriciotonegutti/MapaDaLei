import { PieChart } from 'lucide-react'

import { cn, formatPercent } from '@/lib/utils'

interface LeafProgressBarProps {
  coverage: number
  tasksDone: number
  tasksTotal: number
}

export function LeafProgressBar({ coverage, tasksDone, tasksTotal }: LeafProgressBarProps) {
  const safeCoverage = Math.max(0, Math.min(100, coverage))

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span className="inline-flex items-center gap-1">
          <PieChart className="h-3.5 w-3.5" /> Cobertura
        </span>
        <span>
          {tasksDone}/{tasksTotal} tasks
        </span>
      </div>
      <div className="h-2 rounded-full bg-gray-800">
        <div
          className={cn('h-2 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400')}
          style={{ width: `${safeCoverage}%` }}
        />
      </div>
      <p className="text-xs font-medium text-gray-300">{formatPercent(safeCoverage)}</p>
    </div>
  )
}
