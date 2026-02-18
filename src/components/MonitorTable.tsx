'use client'

import { RefreshCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import { LegislativeEvidence } from '@/types'

interface MonitorTableProps {
  evidences: LegislativeEvidence[]
  onRecheck: (id: string) => Promise<void>
}

export function MonitorTable({ evidences, onRecheck }: MonitorTableProps) {
  return (
    <Card className="border-gray-800 bg-gray-900/70">
      <CardHeader>
        <CardTitle className="text-lg">Monitor legislativo por hash</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm text-gray-300">
          <thead className="border-b border-gray-800 text-xs uppercase tracking-wide text-gray-400">
            <tr>
              <th className="px-2 py-3">URL</th>
              <th className="px-2 py-3">UF</th>
              <th className="px-2 py-3">Título</th>
              <th className="px-2 py-3">Hash atual</th>
              <th className="px-2 py-3">Status</th>
              <th className="px-2 py-3">Última verificação</th>
              <th className="px-2 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {evidences.map((evidence) => (
              <tr key={evidence.id} className="border-b border-gray-900 hover:bg-gray-800/30">
                <td className="px-2 py-3">
                  <a href={evidence.url} target="_blank" rel="noreferrer" className="text-blue-300 hover:underline">
                    {new URL(evidence.url).hostname}
                  </a>
                </td>
                <td className="px-2 py-3">{evidence.uf ?? 'N/A'}</td>
                <td className="px-2 py-3">{evidence.title}</td>
                <td className="px-2 py-3 font-mono text-xs text-gray-400">{evidence.hash_sha256.slice(0, 18)}...</td>
                <td className="px-2 py-3">
                  {evidence.hash_changed ? (
                    <span className="inline-flex animate-pulse-red rounded-md bg-red-500/20 px-2 py-1 text-xs font-semibold text-red-300">
                      ⚠ changed
                    </span>
                  ) : (
                    <span className="inline-flex rounded-md bg-emerald-500/20 px-2 py-1 text-xs font-semibold text-emerald-300">
                      ✅ unchanged
                    </span>
                  )}
                </td>
                <td className="px-2 py-3 text-xs">{formatDate(evidence.last_checked_at)}</td>
                <td className="px-2 py-3">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      void onRecheck(evidence.id)
                    }}
                  >
                    <RefreshCcw className="mr-1.5 h-3.5 w-3.5" />
                    Re-verificar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}
