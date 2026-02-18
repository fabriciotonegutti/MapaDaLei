'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, FileSearch, LayoutDashboard, Layers, Network } from 'lucide-react'

import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/mercadological', label: 'Estrutura Mercadológica', icon: Network },
  { href: '/leaves', label: 'Leaves Ativas', icon: Layers },
  { href: '/monitor', label: 'Monitor Legislativo', icon: FileSearch }
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden w-72 border-r border-gray-800 bg-gray-950/90 p-5 lg:block">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.16em] text-gray-500">Mission Control</p>
        <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold text-gray-100">
          <BarChart3 className="h-6 w-6 text-cyan-400" />
          MapaDaLei
        </h1>
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                isActive ? 'bg-cyan-900/40 text-cyan-200' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
