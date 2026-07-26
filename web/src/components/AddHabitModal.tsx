import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '#/lib/api'
import type { HabitType, NewHabit, RuleType } from '#/lib/api'
import { keys } from '#/lib/hooks'
import { Modal, fieldClass, labelClass, primaryBtn } from './Modal'

const RULES: Array<{ value: RuleType; label: string }> = [
  { value: 'daily', label: 'Every day' },
  { value: 'times_per_week', label: 'X times a week' },
  { value: 'weekdays', label: 'Specific weekdays' },
  { value: 'every_n_days', label: 'Every N days' },
]

const WEEKDAYS = [
  { iso: 1, label: 'M' },
  { iso: 2, label: 'T' },
  { iso: 3, label: 'W' },
  { iso: 4, label: 'T' },
  { iso: 5, label: 'F' },
  { iso: 6, label: 'S' },
  { iso: 7, label: 'S' },
]

export function AddHabitModal({
  goalId,
  quarterId,
  onClose,
}: {
  goalId: number
  quarterId: number
  onClose: () => void
}) {
  const [title, setTitle] = useState('')
  const [type, setType] = useState<HabitType>('boolean')
  const [target, setTarget] = useState('')
  const [unit, setUnit] = useState('')
  const [recoverable, setRecoverable] = useState(true)
  const [rule, setRule] = useState<RuleType>('daily')
  const [weeklyTarget, setWeeklyTarget] = useState(7)
  const [byweekday, setByweekday] = useState<number[]>([])
  const [intervalN, setIntervalN] = useState(2)

  const qc = useQueryClient()
  const create = useMutation({
    mutationFn: () => {
      const schedule: NewHabit['schedule'] = { rule_type: rule, weekly_target: weeklyTarget }
      if (rule === 'weekdays') {
        schedule.byweekday = byweekday
        schedule.weekly_target = Math.max(1, byweekday.length)
      }
      if (rule === 'daily') schedule.weekly_target = 7
      if (rule === 'every_n_days') schedule.interval_n = intervalN
      const body: NewHabit = {
        title,
        type,
        recoverable,
        schedule,
        ...(type === 'numeric' ? { target_value: Number(target), unit: unit || undefined } : {}),
      }
      return api.createHabit(goalId, body)
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: keys.habits(goalId) })
      await qc.invalidateQueries({ queryKey: keys.scores(quarterId) })
      onClose()
    },
  })

  const numericMissing = type === 'numeric' && target === ''
  const weekdaysMissing = rule === 'weekdays' && byweekday.length === 0

  function toggleDay(iso: number) {
    setByweekday((d) => (d.includes(iso) ? d.filter((x) => x !== iso) : [...d, iso]))
  }

  return (
    <Modal title="New habit" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (title.trim() && !numericMissing && !weekdaysMissing) create.mutate()
        }}
        className="space-y-4"
      >
        <div>
          <label htmlFor="habit-title" className={labelClass}>
            Habit
          </label>
          <input
            id="habit-title"
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Track steps"
            className={fieldClass}
          />
        </div>

        <div>
          <span className={labelClass}>Type</span>
          <Segmented
            options={[
              { value: 'boolean', label: 'Done / not' },
              { value: 'numeric', label: 'A number' },
            ]}
            value={type}
            onChange={(v) => setType(v as HabitType)}
          />
        </div>

        {type === 'numeric' && (
          <div className="flex gap-2">
            <div className="flex-1">
              <label htmlFor="target" className={labelClass}>
                Daily target
              </label>
              <input
                id="target"
                type="number"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="8000"
                className={fieldClass}
              />
            </div>
            <div className="w-24">
              <label htmlFor="unit" className={labelClass}>
                Unit
              </label>
              <input
                id="unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="steps"
                className={fieldClass}
              />
            </div>
          </div>
        )}

        <div>
          <label htmlFor="rule" className={labelClass}>
            How often
          </label>
          <select
            id="rule"
            value={rule}
            onChange={(e) => setRule(e.target.value as RuleType)}
            className={fieldClass}
          >
            {RULES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {rule === 'times_per_week' && (
          <div>
            <label htmlFor="wt" className={labelClass}>
              Times per week
            </label>
            <input
              id="wt"
              type="number"
              min={1}
              max={7}
              value={weeklyTarget}
              onChange={(e) => setWeeklyTarget(Number(e.target.value))}
              className={fieldClass}
            />
          </div>
        )}

        {rule === 'weekdays' && (
          <div>
            <span className={labelClass}>Which days</span>
            <div className="flex gap-1.5">
              {WEEKDAYS.map((d) => (
                <button
                  key={d.iso}
                  type="button"
                  onClick={() => toggleDay(d.iso)}
                  className={`h-9 w-9 rounded-lg text-sm transition ${
                    byweekday.includes(d.iso)
                      ? 'bg-achieved text-surface'
                      : 'border border-line-strong text-ink-soft'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {rule === 'every_n_days' && (
          <div>
            <label htmlFor="interval" className={labelClass}>
              Every how many days
            </label>
            <input
              id="interval"
              type="number"
              min={2}
              value={intervalN}
              onChange={(e) => setIntervalN(Number(e.target.value))}
              className={fieldClass}
            />
          </div>
        )}

        <label className="flex items-center justify-between rounded-xl border border-line px-3.5 py-3">
          <span>
            <span className="block text-sm font-medium text-ink">Recoverable</span>
            <span className="block text-xs text-ink-soft">
              {recoverable
                ? 'A missed day can be made up within the week.'
                : 'A missed day is final once it passes.'}
            </span>
          </span>
          <input
            type="checkbox"
            checked={recoverable}
            onChange={(e) => setRecoverable(e.target.checked)}
            className="h-5 w-5 accent-achieved"
          />
        </label>

        {create.isError && (
          <p className="text-sm text-hardened">Couldn’t save that. Check the fields and retry.</p>
        )}

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={!title.trim() || numericMissing || weekdaysMissing || create.isPending}
            className={primaryBtn}
          >
            {create.isPending ? 'Saving…' : 'Add habit'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function Segmented({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: string; label: string }>
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex gap-1 rounded-xl border border-line p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-lg px-3 py-1.5 text-sm transition ${
            value === o.value ? 'bg-achieved text-surface' : 'text-ink-soft hover:text-ink'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
