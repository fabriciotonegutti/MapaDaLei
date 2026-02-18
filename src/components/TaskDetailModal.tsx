'use client'

import { ClipboardCheck, Database, FileText, Hash, Workflow } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { formatDate } from '@/lib/utils'
import { Task } from '@/types'

import { AgentBadge } from './AgentBadge'
import { PriorityBadge } from './PriorityBadge'
import { StatusBadge } from './StatusBadge'

interface TaskDetailModalProps {
  task: Task
  trigger: React.ReactNode
}

export function TaskDetailModal({ task, trigger }: TaskDetailModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-start justify-between gap-3 pr-6">{task.title}</DialogTitle>
          <DialogDescription>{task.description}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
            <Badge variant="outline">{task.tipo_regra}</Badge>
            <AgentBadge agent={task.owner_agent} />
          </div>

          <div className="grid gap-2 rounded-lg border border-gray-700 bg-gray-950/70 p-3 text-gray-300 md:grid-cols-2">
            <p className="flex items-center gap-2">
              <Workflow className="h-4 w-4 text-blue-300" />
              Tentativa: {task.attempt}
            </p>
            <p className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-purple-300" />
              QA: {task.qa_result ?? 'pendente'}
            </p>
            <p className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-amber-300" />
              Semantic gate: {task.semantic_decision ?? 'pendente'}
            </p>
            <p className="flex items-center gap-2">
              <Database className="h-4 w-4 text-cyan-300" />
              DB write: {task.db_write_status ?? 'pending'}
            </p>
          </div>

          <div className="rounded-lg border border-gray-700 p-3">
            <p className="mb-2 text-xs uppercase tracking-wide text-gray-400">Escopo fiscal</p>
            <div className="grid grid-cols-2 gap-2 text-gray-200">
              <p>UF origem: {task.uf_origem ?? 'N/A'}</p>
              <p>UF destino: {task.uf_destino ?? 'N/A'}</p>
              <p>Leaf: {task.leaf_id}</p>
              <p>Idempotency key: {task.idempotency_key ?? 'N/A'}</p>
            </div>
          </div>

          <div className="rounded-lg border border-gray-700 p-3">
            <p className="mb-2 text-xs uppercase tracking-wide text-gray-400">Evidências vinculadas</p>
            <div className="flex flex-wrap gap-2">
              {task.evidence_refs?.length ? (
                task.evidence_refs.map((ref) => (
                  <Badge key={ref} variant="secondary" className="bg-gray-800 text-gray-200">
                    <FileText className="mr-1 h-3.5 w-3.5" />
                    {ref}
                  </Badge>
                ))
              ) : (
                <p className="text-gray-500">Sem evidências vinculadas.</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Criada em: {formatDate(task.created_at)}</span>
            <span>Atualizada em: {formatDate(task.updated_at)}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
