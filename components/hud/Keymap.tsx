'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { useToolStore } from '@/store/useToolStore'

const GROUPS: { title: string; keys: [string, string][] }[] = [
  {
    title: 'Building',
    keys: [
      ['1 – =', 'Pick a piece from the hotbar'],
      ['Hold Q', 'Piece wheel'],
      ['Click', 'Build'],
      ['R', 'Flip a wall, turn a lone foundation'],
      ['T / Shift T', 'Next / previous tier'],
      ['G', 'Grid snap for lone foundations'],
      ['Esc', 'Stop building, or deselect'],
    ],
  },
  {
    title: 'Pieces',
    keys: [
      ['Click', 'Select'],
      ['U', 'Upgrade the selected piece'],
      ['Delete', 'Demolish the selected piece'],
      ['Ctrl Z', 'Undo'],
      ['Ctrl Shift Z', 'Redo'],
    ],
  },
  {
    title: 'Camera',
    keys: [
      ['Left drag', 'Orbit'],
      ['Right drag', 'Pan'],
      ['Scroll', 'Zoom'],
      ['Arrows', 'Move'],
      ['Page Up / Down', 'Raise / lower'],
    ],
  },
]

export function Keymap() {
  const open = useToolStore((state) => state.keymapOpen)
  const toggle = useToolStore((state) => state.toggleKeymap)

  useEffect(() => {
    if (!open) return
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        toggle(false)
      }
    }
    window.addEventListener('keydown', handleKey, true)
    return () => window.removeEventListener('keydown', handleKey, true)
  }, [open, toggle])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={() => toggle(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="keymap-title"
        className="hud-panel w-full max-w-4xl p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="keymap-title" className="font-display text-2xl font-semibold text-ink">
            Controls
          </h2>
          <button
            onClick={() => toggle(false)}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-[3px] text-mute hover:bg-ink/10 hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {GROUPS.map(({ title, keys }) => (
            <section key={title}>
              <h3 className="mb-2 font-display text-lg font-semibold text-signal">{title}</h3>
              <dl className="space-y-1.5 text-sm">
                {keys.map(([key, action]) => (
                  <div key={key + action} className="flex gap-3">
                    <dt className="w-24 shrink-0 font-display text-base leading-5 font-semibold text-ink">
                      {key}
                    </dt>
                    <dd className="text-ink/75">{action}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
