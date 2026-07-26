import type { ReactNode } from 'react'
import { useEffect } from 'react'

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/25 p-0 sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl bg-surface p-6 shadow-xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full px-2 text-2xl leading-none text-ink-soft transition hover:text-ink"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

/** Shared input/label styles for the setup forms. */
export const fieldClass =
  'w-full rounded-xl border border-line-strong bg-canvas px-3.5 py-2.5 text-ink outline-none transition focus:border-achieved focus:ring-2 focus:ring-achieved/25'
export const labelClass = 'mb-1.5 block text-xs font-medium text-ink-soft'
export const primaryBtn =
  'rounded-xl bg-achieved px-4 py-2.5 font-medium text-surface transition hover:brightness-105 disabled:opacity-50'
