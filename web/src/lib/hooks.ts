import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './api'
import type { Entry } from './api'

export const keys = {
  me: ['me'] as const,
  quarters: ['quarters'] as const,
  scores: (q: number) => ['scores', q] as const,
  goals: (q: number) => ['goals', q] as const,
  habits: (g: number) => ['habits', g] as const,
  entries: (h: number) => ['entries', h] as const,
}

export function useMe() {
  return useQuery({ queryKey: keys.me, queryFn: api.me, retry: false })
}

export function useQuarters() {
  return useQuery({ queryKey: keys.quarters, queryFn: api.listQuarters })
}

export function useScores(quarterId: number) {
  return useQuery({ queryKey: keys.scores(quarterId), queryFn: () => api.scores(quarterId) })
}

export function useGoals(quarterId: number) {
  return useQuery({ queryKey: keys.goals(quarterId), queryFn: () => api.listGoals(quarterId) })
}

export function useHabits(goalId: number) {
  return useQuery({ queryKey: keys.habits(goalId), queryFn: () => api.listHabits(goalId) })
}

/** A habit's entries for the visible window, keyed only by habit so optimistic
 *  writes and score invalidation have one stable target. */
export function useEntries(habitId: number, from: string, to: string) {
  return useQuery({
    queryKey: keys.entries(habitId),
    queryFn: () => api.listEntries(habitId, from, to),
  })
}

type LogArgs = { date: string; state?: string; value?: number } | { date: string; remove: true }

/** Logs (or clears) a habit's day with an optimistic cell flip, then refetches
 *  scores so the panel catches up from the server — the source of truth. */
export function useLogEntry(habitId: number, quarterId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: LogArgs) => {
      if ('remove' in args) return api.deleteEntry(habitId, args.date)
      return api.putEntry(habitId, args.date, { state: args.state, value: args.value })
    },
    onMutate: async (args) => {
      await qc.cancelQueries({ queryKey: keys.entries(habitId) })
      const prev = qc.getQueryData<Entry[]>(keys.entries(habitId)) ?? []
      const next = prev.filter((e) => e.entry_date !== args.date)
      if (!('remove' in args)) {
        const value = args.value ?? null
        const state = (args.state as Entry['state']) ?? 'done'
        next.push({ id: -1, habit_id: habitId, entry_date: args.date, state, numeric_value: value })
      }
      qc.setQueryData(keys.entries(habitId), next)
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(keys.entries(habitId), ctx.prev)
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: keys.entries(habitId) })
      void qc.invalidateQueries({ queryKey: keys.scores(quarterId) })
    },
  })
}
