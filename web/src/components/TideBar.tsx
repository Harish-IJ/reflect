import type { Score } from '#/lib/api'

/**
 * The signature element: achieved rises from the left (teal tide), shortfall
 * comes in from the right (clay tide), and the open canvas between them is what
 * remains. Red reads as a tide-line, never an alarm.
 */
export function TideBar({ score, height = 'h-2.5' }: { score: Score; height?: string }) {
  const achieved = clampPct(score.achieved_pct)
  const red = clampPct(score.red_pct)
  return (
    <div
      className={`relative w-full overflow-hidden rounded-full bg-line ${height}`}
      role="img"
      aria-label={`${Math.round(achieved)}% achieved, ${Math.round(red)}% behind`}
    >
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-achieved transition-[width] duration-500 ease-out"
        style={{ width: `${achieved}%` }}
      />
      <div
        className="absolute inset-y-0 right-0 rounded-full bg-hardened/85 transition-[width] duration-500 ease-out"
        style={{ width: `${red}%` }}
      />
    </div>
  )
}

function clampPct(n: number): number {
  if (Number.isNaN(n)) return 0
  return Math.max(0, Math.min(100, n))
}
