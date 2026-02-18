import type { Metadata } from 'next'
import { Space_Grotesk } from 'next/font/google'

import { Sidebar } from '@/components/Sidebar'

import './globals.css'

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MapaDaLei',
  description: 'Workflow Kanban multi-agente para mapeamento legislativo fiscal'
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${spaceGrotesk.className} min-h-screen bg-gray-950 text-gray-100 antialiased`}>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="w-full flex-1 p-4 md:p-6 lg:p-8">{children}</main>
        </div>
      </body>
    </html>
  )
}
