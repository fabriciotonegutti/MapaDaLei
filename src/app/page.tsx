'use client'

import { useMemo, useState } from 'react'
import { Gauge, ListChecks, Plus, ShieldCheck } from 'lucide-react'

import { LeafCard } from '@/components/LeafCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { STATUS_LABELS } from '@/lib/constants'
import { cn, formatPercent } from '@/lib/utils'
import { useLeaves } from '@/hooks/useLeaves'
import { useTasks } from '@/hooks/useTasks'
import { TaskStatus } from '@/types'

export default function DashboardPage() {
  const { leaves, summary, isLoading: leavesLoading, createLeaf } = useLeaves()
  const { tasks, doneToday, gatekeeperApprovalRate, isLoading: tasksLoading } = useTasks()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form, setForm] = useState({ name: '', category_path: '', ncm: '' })

  const tasksByStatus = useMemo(() => {
    const entries = Object.keys(STATUS_LABELS).map((status) => {
      const typedStatus = status as TaskStatus
      return {
        status: typedStatus,
        total: tasks.filter((task) => task.status === typedStatus).length
      }
    })

    return entries
  }, [tasks])

  const handleCreateLeaf = async () => {
    if (!form.name.trim() || !form.category_path.trim()) return

    await createLeaf({
      name: form.name,
      category_path: form.category_path,
      ncm: form.ncm || undefined
    })

    setForm({ name: '', category_path: '', ncm: '' })
    setIsModalOpen(false)
  }

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-gray-800 bg-gray-900/60 p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/80">MapaDaLei</p>
        <h2 className="mt-2 text-3xl font-semibold text-gray-100">Dashboard Fiscal Multi-Agente</h2>
        <p className="mt-2 text-sm text-gray-400">
          {summary.total} leaves monitoradas · cobertura média {formatPercent(summary.avgCoverage)}
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="border-gray-800 bg-gray-900/70">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-gray-300">
              <ListChecks className="h-4 w-4 text-blue-300" /> Tasks finalizadas hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{tasksLoading ? '...' : doneToday}</p>
          </CardContent>
        </Card>

        <Card className="border-gray-800 bg-gray-900/70">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-gray-300">
              <ShieldCheck className="h-4 w-4 text-emerald-300" /> Aprovação gatekeeper
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{tasksLoading ? '...' : formatPercent(gatekeeperApprovalRate)}</p>
          </CardContent>
        </Card>

        <Card className="border-gray-800 bg-gray-900/70">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-gray-300">
              <Gauge className="h-4 w-4 text-cyan-300" /> Cobertura média
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{leavesLoading ? '...' : formatPercent(summary.avgCoverage)}</p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-100">Tasks por estado</h3>
        </div>

        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5">
          {tasksByStatus.map((entry) => (
            <div key={entry.status} className="rounded-lg border border-gray-800 bg-gray-900/50 p-3">
              <p className="text-xs text-gray-400">{STATUS_LABELS[entry.status]}</p>
              <p className={cn('text-lg font-semibold', entry.total > 0 ? 'text-gray-100' : 'text-gray-500')}>{entry.total}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-xl font-semibold text-gray-100">Leaves em execução</h3>

          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Nova Leaf
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar nova leaf</DialogTitle>
                <DialogDescription>
                  Cadastre uma categoria folha para iniciar a esteira fiscal multi-agente.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 py-2">
                <Input
                  placeholder="Nome da leaf"
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                />
                <Input
                  placeholder="Category path"
                  value={form.category_path}
                  onChange={(event) => setForm((prev) => ({ ...prev, category_path: event.target.value }))}
                />
                <Input
                  placeholder="NCM (opcional)"
                  value={form.ncm}
                  onChange={(event) => setForm((prev) => ({ ...prev, ncm: event.target.value }))}
                />
              </div>
              <DialogFooter>
                <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => void handleCreateLeaf()}>Criar leaf</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {leavesLoading ? (
          <p className="text-sm text-gray-400">Carregando leaves...</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {leaves.map((leaf) => (
              <LeafCard key={leaf.id} leaf={leaf} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
