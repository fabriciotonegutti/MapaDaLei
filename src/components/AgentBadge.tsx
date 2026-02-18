import { Bot } from 'lucide-react'

import { cn } from '@/lib/utils'

interface AgentBadgeProps {
  agent?: string
  className?: string
}

export function AgentBadge({ agent, className }: AgentBadgeProps) {
  const label = agent ?? 'unassigned'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-gray-700 bg-gray-800/60 px-2.5 py-1 text-xs text-gray-200',
        className
      )}
    >
      <Bot className="h-3.5 w-3.5" />
      {label}
    </span>
  )
}
