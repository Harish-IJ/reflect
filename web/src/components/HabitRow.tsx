import { useEffect, useRef, useState } from 'react'
import type { Entry, Habit } from '#/lib/api'
import { useEntries, useLogEntry } from '#/lib/hooks'
import { daysBetween, dayOfMonth, weekdayShort } from '#/lib/dates'

const LOCK_DAYS = 10

export function HabitRow({
  habit,
  days,
  today,
  quarterId,
}: {
  habit: Habit
  days: string[]
  today: string
  quarterId: number
}) {
  const from = days[0]
  const to = days[days.length - 1]
  const { data: entries = [] } = useEntries(habit.id, from, to)
  const log = useLogEntry(habit.id, quarterId)

  const byDate = new Map<string, Entry>()
  for (const e of entries) byDate.set(e.entry_date, e)

  // On narrow screens the strip scrolls; keep today (rightmost) in view.
  const stripRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = stripRef.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [])

  return (
    <div className="flex flex-col gap-1.5 py-2.5 sm:flex-row sm:items-center sm:gap-3">
      <div className="min-w-0 sm:flex-1">
        <p className="truncate text-sm font-medium text-ink">{habit.title}</p>
        <p className="mt-0.5 text-xs text-ink-soft">{cadenceLabel(habit)}</p>
      </div>
      <div
        ref={stripRef}
        className="-mx-1 flex gap-1 overflow-x-auto px-1 [scrollbar-width:none] sm:mx-0 sm:px-0"
      >
        {days.map((date) => (
          <div key={date} className="shrink-0">
            <DayCell
              date={date}
              today={today}
              habit={habit}
              entry={byDate.get(date)}
              onLog={(args) => log.mutate(args)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function DayCell({
  date,
  today,
  habit,
  entry,
  onLog,
}: {
  date: string
  today: string
  habit: Habit
  entry: Entry | undefined
  onLog: (args: { date: string; state?: string; value?: number } | { date: string; remove: true }) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(habit.target_value ?? ''))

  const offset = daysBetween(date, today) // >0 past, 0 today, <0 future
  const isToday = offset === 0
  const isFuture = offset < 0
  const isLocked = offset > LOCK_DAYS
  const editable = !isFuture && !isLocked

  const state = entry?.state
  const base =
    'relative grid h-9 w-9 place-items-center rounded-lg text-xs tnum select-none transition'
  const ring = isToday ? 'ring-2 ring-achieved/45' : ''

  function tone(): string {
    if (state === 'done') return 'bg-achieved text-surface'
    if (state === 'partial') return 'bg-achieved-soft text-achieved'
    if (state === 'skipped') return 'bg-line text-ink-soft'
    if (isFuture) return 'bg-transparent text-ink-soft/30'
    if (isLocked) return 'bg-canvas text-ink-soft/40'
    return 'bg-surface border border-line text-ink-soft/50 hover:border-achieved/50'
  }

  function label() {
    if (state === 'done') return habit.type === 'numeric' ? '✓' : '✓'
    if (state === 'partial') return fmtValue(entry?.numeric_value)
    if (state === 'skipped') return '–'
    return dayOfMonth(date)
  }

  function onClick() {
    if (!editable) return
    if (habit.type === 'numeric') {
      setDraft(String(entry?.numeric_value ?? habit.target_value ?? ''))
      setEditing(true)
      return
    }
    // boolean: cycle empty → done → skipped → empty
    if (!state) onLog({ date, state: 'done' })
    else if (state === 'done') onLog({ date, state: 'skipped' })
    else onLog({ date, remove: true })
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClick}
        disabled={!editable}
        title={`${weekdayShort(date)} ${date}${isLocked ? ' · locked' : ''}`}
        className={`${base} ${tone()} ${ring} ${editable ? 'cursor-pointer' : 'cursor-default'}`}
      >
        {label()}
      </button>

      {editing && (
        <NumericEditor
          initial={draft}
          unit={habit.unit}
          onCancel={() => setEditing(false)}
          onClear={() => {
            onLog({ date, remove: true })
            setEditing(false)
          }}
          onSkip={() => {
            onLog({ date, state: 'skipped' })
            setEditing(false)
          }}
          onSave={(v) => {
            onLog({ date, value: v })
            setEditing(false)
          }}
        />
      )}
    </div>
  )
}

function NumericEditor({
  initial,
  unit,
  onSave,
  onSkip,
  onClear,
  onCancel,
}: {
  initial: string
  unit: string | null
  onSave: (v: number) => void
  onSkip: () => void
  onClear: () => void
  onCancel: () => void
}) {
  const [v, setV] = useState(initial)
  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onCancel} />
      <div className="absolute top-11 left-1/2 z-20 w-44 -translate-x-1/2 rounded-xl border border-line-strong bg-surface p-3 shadow-lg">
        <div className="flex items-center gap-2">
          <input
            type="number"
            autoFocus
            value={v}
            onChange={(e) => setV(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && v !== '') onSave(Number(v))
            }}
            className="w-full rounded-lg border border-line-strong bg-canvas px-2 py-1.5 text-sm text-ink outline-none focus:border-achieved"
          />
          {unit && <span className="text-xs text-ink-soft">{unit}</span>}
        </div>
        <div className="mt-2 flex items-center justify-between text-xs">
          <button onClick={onSkip} className="text-ink-soft hover:text-ink">
            Skip
          </button>
          <button onClick={onClear} className="text-ink-soft hover:text-ink">
            Clear
          </button>
          <button
            onClick={() => v !== '' && onSave(Number(v))}
            className="rounded-md bg-achieved px-2.5 py-1 font-medium text-surface"
          >
            Save
          </button>
        </div>
      </div>
    </>
  )
}

function fmtValue(v: number | null | undefined): string {
  if (v == null) return ''
  if (v >= 1000) return `${Math.round(v / 100) / 10}k`
  return String(v)
}

function cadenceLabel(h: Habit): string {
  const parts: string[] = [h.type === 'numeric' ? `${h.target_value ?? ''}${h.unit ?? ''}` : 'done / not']
  if (!h.recoverable) parts.push('non-recoverable')
  return parts.filter(Boolean).join(' · ')
}
