'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'

import { AlertBanner } from '@/components/AlertBanner'
import { DashboardMetricsPanel } from '@/components/DashboardMetrics'
import { LeafCard } from '@/components/LeafCard'
import { Button } from '@/components/ui/button'
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
import { formatPercent } from '@/lib/utils'
import { useLeaves } from '@/hooks/useLeaves'
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics'

export default function DashboardPage() {
  const { leaves, summary, isLoading: leavesLoading, createLeaf } = useLeaves()
  const metrics = useDashboardMetrics(30_000)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form, setForm] = useState({ name: '', category_path: '', ncm: '' })

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

      {/* Alert Banner — Sprint 1 E7 */}
      <AlertBanner metrics={metrics} />

      {/* Dashboard Metrics — Sprint 1 E7 */}
      <section className="rounded-2xl border border-gray-800 bg-gray-900/30 p-5">
        <DashboardMetricsPanel metrics={metrics} />
      </section>

      {/* Leaves Section */}
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
                  Cadastre uma categoria folha para iniciar a esteira fiscal multi-agente. O backlog completo será gerado automaticamente.
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
                <Button onClick={() => void handleCreateLeaf()}>Criar leaf + gerar backlog</Button>
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
