import type { QuarterScores } from '#/lib/api'
import { TideBar } from './TideBar'

export function InsightsPanel({ scores }: { scores: QuarterScores }) {
  const o = scores.overall
  const behind = o.red_pct >= 0.5
  return (
    <header className="sticky top-0 z-30 mb-6 border-b border-line bg-canvas/85 px-4 pt-6 pb-5 backdrop-blur-md">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-baseline justify-between">
          <p className="text-xs font-medium tracking-wide text-ink-soft uppercase">
            {scores.quarter.label}
          </p>
          <p className="text-xs text-ink-soft">as of {scores.as_of}</p>
        </div>

        <div className="mt-1 flex items-end gap-3">
          <span className="tnum font-display text-6xl leading-none font-semibold text-ink">
            {Math.round(o.achieved_pct)}
            <span className="text-3xl text-ink-soft">%</span>
          </span>
          <span className="mb-1 text-sm text-ink-soft">achieved this quarter</span>
        </div>

        <div className="mt-4">
          <TideBar score={o} height="h-3" />
        </div>

        <p className="mt-2 text-sm text-ink-soft">
          {behind ? (
            <>
              <span className="font-medium text-hardened">{Math.round(o.red_pct)}% behind</span> —
              still recoverable. {Math.round(o.remaining_pct)}% of the quarter is open.
            </>
          ) : (
            <>On pace. {Math.round(o.remaining_pct)}% of the quarter is still open.</>
          )}
        </p>
      </div>
    </header>
  )
}
