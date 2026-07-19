import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-2">
      <h1 className="text-3xl font-semibold tracking-tight">Reflect</h1>
      <p className="text-sm text-neutral-500">
        Quarterly habit planner — scaffold ready.
      </p>
    </main>
  )
}
