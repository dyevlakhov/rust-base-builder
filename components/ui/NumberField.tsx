'use client'

import { useEffect, useState } from 'react'

interface NumberFieldProps {
  label: string
  value: number
  step?: number
  onCommit: (value: number) => void
}

/** Round for display without padding, so 0.15 stays 0.15 rather than becoming 0.1. */
function format(value: number): string {
  return String(Number(value.toFixed(2)))
}

/**
 * Number input that keeps the in-progress text local.
 *
 * Feeding the store value straight back into `value` would rewrite what the user
 * is typing on every keystroke — and rounding it for display would silently write
 * the rounded number back into the model.
 */
export function NumberField({ label, value, step = 0.5, onCommit }: NumberFieldProps) {
  const [draft, setDraft] = useState(() => format(value))
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    if (!editing) setDraft(format(value))
  }, [value, editing])

  const commit = () => {
    setEditing(false)
    const parsed = Number.parseFloat(draft)
    if (Number.isFinite(parsed)) {
      onCommit(parsed)
    } else {
      setDraft(format(value))
    }
  }

  return (
    <div className="flex items-center gap-2">
      <label className="w-6 text-xs text-white/70" htmlFor={`field-${label}`}>
        {label}
      </label>
      <input
        id={`field-${label}`}
        type="number"
        inputMode="decimal"
        step={step}
        value={draft}
        onFocus={() => setEditing(true)}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.blur()
          if (event.key === 'Escape') {
            setDraft(format(value))
            event.currentTarget.blur()
          }
        }}
        className="glass-light flex-1 rounded-lg border border-white/10 px-3 py-2 text-sm text-white focus:border-transparent focus:outline-none focus:ring-2 focus:ring-orange-500/50"
      />
    </div>
  )
}
