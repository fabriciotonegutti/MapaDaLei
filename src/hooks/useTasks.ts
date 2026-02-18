'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { Task, TaskStatus } from '@/types'

interface UseTasksOptions {
  leafId?: string
}

interface UpdateTaskInput {
  id: number
  status?: TaskStatus
  qa_result?: Task['qa_result']
  semantic_decision?: Task['semantic_decision']
}

export function useTasks(options?: UseTasksOptions) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true)
      const query = options?.leafId ? `?leafId=${options.leafId}` : ''
      const response = await fetch(`/api/tasks${query}`, { cache: 'no-store' })
      if (!response.ok) throw new Error('Falha ao carregar tasks')
      const data = (await response.json()) as Task[]
      setTasks(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setIsLoading(false)
    }
  }, [options?.leafId])

  const updateTask = useCallback(async (payload: UpdateTaskInput) => {
    const response = await fetch('/api/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error('Falha ao atualizar task')
    }

    const updated = (await response.json()) as Task
    setTasks((previous) => previous.map((task) => (task.id === updated.id ? updated : task)))
    return updated
  }, [])

  useEffect(() => {
    void fetchTasks()
  }, [fetchTasks])

  const doneToday = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return tasks.filter((task) => task.status === 'done' && new Date(task.updated_at) >= today).length
  }, [tasks])

  const gatekeeperApprovalRate = useMemo(() => {
    const decisions = tasks.filter((task) => task.semantic_decision !== null)
    if (decisions.length === 0) return 0
    const approved = decisions.filter((task) => task.semantic_decision === 'approved').length
    return (approved / decisions.length) * 100
  }, [tasks])

  return {
    tasks,
    isLoading,
    error,
    fetchTasks,
    updateTask,
    doneToday,
    gatekeeperApprovalRate
  }
}
