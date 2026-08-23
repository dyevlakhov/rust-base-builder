'use client'

import { useEffect } from 'react'
import { useBuilderStore } from '@/store/useBuilderStore'
import { requestConfirmation, useConfirmStore } from '@/store/useConfirmStore'
import { isTypingTarget } from '@/utils/dom'

/**
 * Application-wide keyboard shortcuts.
 *
 * The listener reads both stores imperatively so it can be registered exactly
 * once, instead of being torn down and rebuilt every time a piece is placed.
 */
export function useAppShortcuts() {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return
      // The confirm dialog owns the keyboard while it is open.
      if (useConfirmStore.getState().request) return

      const { placementMode, selectedBlockId, setPlacementMode } = useBuilderStore.getState()

      if (event.key === 'Escape' && placementMode) {
        setPlacementMode(null)
        return
      }

      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedBlockId) {
        event.preventDefault()
        requestConfirmation({
          title: 'Demolish this piece?',
          message: 'The selected building piece will be removed from your design.',
          confirmLabel: 'Demolish',
          onConfirm: () => useBuilderStore.getState().deleteBlock(selectedBlockId),
        })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
}
