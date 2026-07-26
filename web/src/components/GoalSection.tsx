import { useState } from 'react'
import type { Goal, Score } from '#/lib/api'
import { useHabits } from '#/lib/hooks'
import { TideBar } from './TideBar'
import { HabitRow } from './HabitRow'
import { AddHabitModal } from './AddHabitModal'

const emptyScore: Score = { achieved_pct: 0, red_pct: 0, remaining_pct: 100 }

export function GoalSection({
  goal,
  score,
  days,
  today,
  quarterId,
}: {
  goal: Goal
  score: Score | undefined
  days: string[]
  today: string
  quarterId: number
}) {
  const { data: habits = [] } = useHabits(goal.id)
  const [adding, setAdding] = useState(false)
  const s = score ?? emptyScore

  return (
    <section className="rounded-2xl border border-line bg-surface/60 p-5">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-ink">{goal.title}</h2>
        <span className="tnum text-sm text-ink-soft">
          <span className="font-semibold text-achieved">{Math.round(s.achieved_pct)}%</span>
          {s.red_pct >= 0.5 && (
            <span className="ml-2 text-hardened">{Math.round(s.red_pct)}% behind</span>
          )}
        </span>
      </div>
      <TideBar score={s} />

      <div className="mt-3 divide-y divide-line">
        {habits.length === 0 ? (
          <p className="py-3 text-sm text-ink-soft">No habits yet.</p>
        ) : (
          habits.map((h) => (
            <HabitRow key={h.id} habit={h} days={days} today={today} quarterId={quarterId} />
          ))
        )}
      </div>

      <button
        onClick={() => setAdding(true)}
        disabled={habits.length >= 10}
        className="mt-3 text-sm font-medium text-achieved transition hover:brightness-110 disabled:opacity-40"
      >
        + Add habit
      </button>

      {adding && (
        <AddHabitModal goalId={goal.id} quarterId={quarterId} onClose={() => setAdding(false)} />
      )}
    </section>
  )
}
