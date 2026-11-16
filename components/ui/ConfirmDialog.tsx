'use client'

import { useEffect, useRef } from 'react'
import { useConfirmStore } from '@/store/useConfirmStore'

/**
 * Replacement for `window.confirm`, which blocks the main thread, cannot be
 * styled, and looks out of place over a 3D canvas.
 */
export function ConfirmDialog() {
  const request = useConfirmStore((state) => state.request)
  const accept = useConfirmStore((state) => state.accept)
  const dismiss = useConfirmStore((state) => state.dismiss)
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!request) return

    confirmRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        dismiss()
      }
    }

    // Capture phase so the dialog wins over the app-wide Escape shortcut.
    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [request, dismiss])

  if (!request) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      onClick={dismiss}
    >
      <div className="hud-panel w-full max-w-sm p-5" onClick={(event) => event.stopPropagation()}>
        <h2
          id="confirm-dialog-title"
          className="font-display text-2xl leading-tight font-semibold text-ink"
        >
          {request.title}
        </h2>
        <p className="mt-2 text-sm text-ink/75">{request.message}</p>

        <div className="mt-5 flex justify-end gap-2">
          {request.tone !== 'neutral' && (
            <button
              onClick={dismiss}
              className="h-9 rounded-[3px] px-4 text-sm text-ink/80 transition-colors hover:bg-ink/10 hover:text-ink"
            >
              Cancel
            </button>
          )}
          <button
            ref={confirmRef}
            onClick={accept}
            className={`h-9 rounded-[3px] px-4 text-sm font-semibold transition-colors ${
              request.tone === 'neutral'
                ? 'bg-signal text-panel hover:bg-signal/90'
                : 'bg-oxide text-ink hover:bg-oxide/90'
            }`}
          >
            {request.confirmLabel ?? 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}
