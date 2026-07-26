import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '#/lib/api'
import { keys } from '#/lib/hooks'

export const Route = createFileRoute('/login')({ component: LoginPage })

function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const qc = useQueryClient()

  const login = useMutation({
    mutationFn: () => api.login(password),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: keys.me })
      void navigate({ to: '/' })
    },
    onError: () => setError('That password didn’t match. Try again.'),
  })

  return (
    <main className="flex min-h-dvh items-center justify-center px-6">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          setError('')
          login.mutate()
        }}
        className="w-full max-w-sm"
      >
        <p className="font-display text-[2.75rem] leading-none font-semibold tracking-tight text-ink">
          Reflect
        </p>
        <p className="mt-2 mb-8 text-sm text-ink-soft">
          Your quarter, kept honestly. Sign in to continue.
        </p>

        <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-ink-soft">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-line-strong bg-surface px-4 py-3 text-ink outline-none transition focus:border-achieved focus:ring-2 focus:ring-achieved/25"
        />

        {error && <p className="mt-3 text-sm text-hardened">{error}</p>}

        <button
          type="submit"
          disabled={login.isPending || password === ''}
          className="mt-6 w-full rounded-xl bg-achieved px-4 py-3 font-medium text-surface transition hover:brightness-105 disabled:opacity-50"
        >
          {login.isPending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  )
}
