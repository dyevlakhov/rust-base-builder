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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={dismiss}
    >
      <div
        className="glass float w-full max-w-sm rounded-2xl border border-white/10 p-5 text-white"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="confirm-dialog-title" className="text-base font-semibold">
          {request.title}
        </h2>
        <p className="mt-2 text-sm text-white/70">{request.message}</p>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={dismiss}
            className="glass-light rounded-lg px-4 py-2 text-sm text-white/80 transition-colors hover:bg-white/15 hover:text-white"
          >
            Cancel
          </button>
          <button
            ref={confirmRef}
            onClick={accept}
            className="rounded-lg bg-red-500/90 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-400/60"
          >
            {request.confirmLabel ?? 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}
