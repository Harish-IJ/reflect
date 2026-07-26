import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '#/lib/api'
import { keys } from '#/lib/hooks'
import { fieldClass, labelClass, primaryBtn } from './Modal'

function currentQuarterDefaults() {
  const now = new Date()
  const y = now.getFullYear()
  const q = Math.floor(now.getMonth() / 3) + 1
  const startMonth = (q - 1) * 3
  const start = new Date(Date.UTC(y, startMonth, 1)).toISOString().slice(0, 10)
  const end = new Date(Date.UTC(y, startMonth + 3, 0)).toISOString().slice(0, 10)
  return { label: `${y}-Q${q}`, start_date: start, end_date: end }
}

export function CreateQuarterCard() {
  const [form, setForm] = useState(currentQuarterDefaults)
  const qc = useQueryClient()
  const create = useMutation({
    mutationFn: () => api.createQuarter(form),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: keys.quarters })
    },
  })

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6">
      <p className="font-display text-4xl font-semibold tracking-tight text-ink">
        Start a quarter
      </p>
      <p className="mt-2 mb-7 text-sm text-ink-soft">
        Reflect plans in quarters — about thirteen weeks. Set yours to begin.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          create.mutate()
        }}
        className="space-y-4"
      >
        <div>
          <label htmlFor="label" className={labelClass}>
            Name
          </label>
          <input
            id="label"
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            className={fieldClass}
          />
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label htmlFor="start" className={labelClass}>
              Starts
            </label>
            <input
              id="start"
              type="date"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              className={fieldClass}
            />
          </div>
          <div className="flex-1">
            <label htmlFor="end" className={labelClass}>
              Ends
            </label>
            <input
              id="end"
              type="date"
              value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              className={fieldClass}
            />
          </div>
        </div>
        {create.isError && (
          <p className="text-sm text-hardened">Couldn’t create the quarter. Check the dates.</p>
        )}
        <button type="submit" disabled={create.isPending} className={`${primaryBtn} w-full`}>
          {create.isPending ? 'Creating…' : 'Begin quarter'}
        </button>
      </form>
    </main>
  )
}
