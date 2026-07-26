import { createFileRoute, Navigate, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '#/lib/api'
import { keys, useGoals, useMe, useQuarters, useScores } from '#/lib/hooks'
import { lastNDays } from '#/lib/dates'
import { InsightsPanel } from '#/components/InsightsPanel'
import { GoalSection } from '#/components/GoalSection'
import { AddGoalModal } from '#/components/AddGoalModal'
import { CreateQuarterCard } from '#/components/CreateQuarterCard'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const me = useMe()
  if (me.isLoading) return <Splash />
  if (me.isError) return <Navigate to="/login" />
  return <Dashboard />
}

function Dashboard() {
  const quarters = useQuarters()
  if (quarters.isLoading) return <Splash />
  const list = quarters.data ?? []
  if (list.length === 0) return <CreateQuarterCard />
  return <Quarter quarterId={list[0].id} />
}

function Quarter({ quarterId }: { quarterId: number }) {
  const scores = useScores(quarterId)
  const goals = useGoals(quarterId)
  const [addingGoal, setAddingGoal] = useState(false)

  if (scores.isLoading || goals.isLoading || !scores.data) return <Splash />

  const today = scores.data.as_of
  const days = lastNDays(today, 10)
  const scoreByGoal = new Map(scores.data.goals.map((g) => [g.id, g.quarter_to_date]))
  const goalList = goals.data ?? []

  return (
    <div className="min-h-dvh pb-20">
      <InsightsPanel scores={scores.data} />

      <main className="mx-auto max-w-2xl space-y-4 px-4">
        {goalList.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-soft">
            No goals yet. Add your first below.
          </p>
        ) : (
          goalList.map((g) => (
            <GoalSection
              key={g.id}
              goal={g}
              score={scoreByGoal.get(g.id)}
              days={days}
              today={today}
              quarterId={quarterId}
            />
          ))
        )}

        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setAddingGoal(true)}
            disabled={goalList.length >= 10}
            className="text-sm font-medium text-achieved transition hover:brightness-110 disabled:opacity-40"
          >
            + Add goal
          </button>
          <LogoutButton />
        </div>
      </main>

      {addingGoal && <AddGoalModal quarterId={quarterId} onClose={() => setAddingGoal(false)} />}
    </div>
  )
}

function LogoutButton() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const logout = useMutation({
    mutationFn: api.logout,
    onSuccess: async () => {
      qc.clear()
      await navigate({ to: '/login' })
    },
  })
  return (
    <button
      onClick={() => logout.mutate()}
      className="text-sm text-ink-soft transition hover:text-ink"
    >
      Sign out
    </button>
  )
}

function Splash() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <p className="font-display text-2xl text-ink-soft">Reflect</p>
    </div>
  )
}
