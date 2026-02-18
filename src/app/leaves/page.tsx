'use client'

import { LeafCard } from '@/components/LeafCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useLeaves } from '@/hooks/useLeaves'

export default function LeavesPage() {
  const { leaves, isLoading, summary } = useLeaves()

  return (
    <div className="space-y-5">
      <header className="rounded-2xl border border-gray-800 bg-gray-900/60 p-5">
        <h2 className="text-2xl font-semibold">Leaves Mercadológicas</h2>
        <p className="text-sm text-gray-400">Catálogo de folhas com cobertura fiscal consolidada por categoria.</p>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="border-gray-800 bg-gray-900/60">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm text-gray-300">Total de leaves</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{summary.total}</CardContent>
        </Card>
        <Card className="border-gray-800 bg-gray-900/60">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm text-gray-300">Cobertura média</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{Math.round(summary.avgCoverage)}%</CardContent>
        </Card>
      </section>

      {isLoading ? (
        <p className="text-sm text-gray-400">Carregando...</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {leaves.map((leaf) => (
            <LeafCard key={leaf.id} leaf={leaf} />
          ))}
        </div>
      )}
    </div>
  )
}
