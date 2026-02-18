import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, pattern = "dd/MM/yyyy HH:mm") {
  const input = typeof date === 'string' ? new Date(date) : date
  return format(input, pattern, { locale: ptBR })
}

export function formatPercent(value: number) {
  return `${Math.round(value)}%`
}
