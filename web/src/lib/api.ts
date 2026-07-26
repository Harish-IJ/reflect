// Typed client for the Reflect Go API. Cookies (the session) ride along on
// every request; the Go core stays the single source of truth for scoring.

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8080'

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(opts.headers ?? {}) },
    ...opts,
  })
  if (!res.ok) {
    let message = res.statusText
    try {
      const body = (await res.json()) as { error?: string }
      if (body.error) message = body.error
    } catch {
      // non-JSON error body; keep statusText
    }
    throw new ApiError(res.status, message)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

// --- Types (snake_case, matching the API's JSON) ---

export type Me = { id: number; email: string; timezone: string }

export type Quarter = {
  id: number
  label: string
  start_date: string
  end_date: string
}

export type Goal = {
  id: number
  quarter_id: number
  title: string
  description: string | null
  color: string | null
  sort_order: number
}

export type HabitType = 'boolean' | 'numeric'
export type RuleType = 'daily' | 'weekdays' | 'times_per_week' | 'every_n_days'

export type Habit = {
  id: number
  goal_id: number
  title: string
  type: HabitType
  target_value: number | null
  unit: string | null
  weight_mode: 'auto' | 'manual'
  weight_raw: number | null
  recoverable: boolean
  sort_order: number
}

export type EntryState = 'done' | 'partial' | 'missed' | 'skipped' | 'pending'

export type Entry = {
  id: number
  habit_id: number
  entry_date: string
  state: EntryState
  numeric_value: number | null
}

export type Score = {
  achieved_pct: number
  red_pct: number
  remaining_pct: number
}

export type QuarterScores = {
  quarter: Quarter
  as_of: string
  overall: Score
  goals: Array<{ id: number; title: string; quarter_to_date: Score; this_week: Score }>
}

export type NewHabit = {
  title: string
  type: HabitType
  target_value?: number
  unit?: string
  recoverable: boolean
  weight_mode?: 'auto' | 'manual'
  weight_raw?: number
  schedule: {
    rule_type: RuleType
    weekly_target: number
    byweekday?: number[]
    interval_n?: number
    effective_from?: string
  }
}

export const api = {
  me: () => request<Me>('/me'),
  login: (password: string) =>
    request<{ ok: boolean }>('/login', { method: 'POST', body: JSON.stringify({ password }) }),
  logout: () => request<{ ok: boolean }>('/logout', { method: 'POST' }),

  listQuarters: () => request<Quarter[]>('/quarters'),
  createQuarter: (b: { label: string; start_date: string; end_date: string }) =>
    request<Quarter>('/quarters', { method: 'POST', body: JSON.stringify(b) }),
  scores: (quarterId: number) => request<QuarterScores>(`/quarters/${quarterId}/scores`),

  listGoals: (quarterId: number) => request<Goal[]>(`/quarters/${quarterId}/goals`),
  createGoal: (quarterId: number, b: { title: string; description?: string }) =>
    request<Goal>(`/quarters/${quarterId}/goals`, { method: 'POST', body: JSON.stringify(b) }),
  deleteGoal: (goalId: number) => request<void>(`/goals/${goalId}`, { method: 'DELETE' }),

  listHabits: (goalId: number) => request<Habit[]>(`/goals/${goalId}/habits`),
  createHabit: (goalId: number, b: NewHabit) =>
    request<{ habit: Habit }>(`/goals/${goalId}/habits`, { method: 'POST', body: JSON.stringify(b) }),
  deleteHabit: (habitId: number) => request<void>(`/habits/${habitId}`, { method: 'DELETE' }),

  listEntries: (habitId: number, from: string, to: string) =>
    request<Entry[]>(`/habits/${habitId}/entries?from=${from}&to=${to}`),
  putEntry: (habitId: number, date: string, b: { state?: string; value?: number }) =>
    request<Entry>(`/habits/${habitId}/entries/${date}`, { method: 'PUT', body: JSON.stringify(b) }),
  deleteEntry: (habitId: number, date: string) =>
    request<void>(`/habits/${habitId}/entries/${date}`, { method: 'DELETE' }),
}
