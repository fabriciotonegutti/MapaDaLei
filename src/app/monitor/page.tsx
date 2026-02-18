'use client'

import { AlertTriangle, ShieldAlert } from 'lucide-react'

import { MonitorTable } from '@/components/MonitorTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useMonitor } from '@/hooks/useMonitor'

export default function MonitorPage() {
  const { evidences, changedCount, isLoading, recheckEvidence } = useMonitor()

  const handleRecheck = async (id: string) => {
    await recheckEvidence(id)
  }

  return (
    <div className="space-y-5">
      <header className="rounded-2xl border border-gray-800 bg-gray-900/60 p-5">
        <h2 className="text-2xl font-semibold">Monitor Legislativo</h2>
        <p className="text-sm text-gray-400">Rastreamento de evidências normativas por hash SHA-256.</p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="border-gray-800 bg-gray-900/60">
          <CardHeader className="pb-1">
            <CardTitle className="flex items-center gap-2 text-sm text-gray-300">
              <AlertTriangle className="h-4 w-4 text-amber-300" /> Alterações detectadas
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-2xl font-semibold">
            {changedCount}
            {changedCount > 0 ? (
              <span className="inline-flex animate-pulse-red items-center rounded-md bg-red-500/20 px-2 py-1 text-xs font-semibold text-red-300">
                atenção
              </span>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-gray-800 bg-gray-900/60">
          <CardHeader className="pb-1">
            <CardTitle className="flex items-center gap-2 text-sm text-gray-300">
              <ShieldAlert className="h-4 w-4 text-cyan-300" /> Evidências monitoradas
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{evidences.length}</CardContent>
        </Card>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-400">Carregando monitor...</p>
      ) : (
        <MonitorTable evidences={evidences} onRecheck={handleRecheck} />
      )}
    </div>
  )
}
