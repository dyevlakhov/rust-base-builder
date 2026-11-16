'use client'

import { useEffect } from 'react'
import { PIECES, removeCommand } from '@/engine'
import { useDesignStore } from '@/store/useDesignStore'
import { useToolStore } from '@/store/useToolStore'
import { requestConfirmation, useConfirmStore } from '@/store/useConfirmStore'
import { isTypingTarget } from '@/utils/dom'

/** Ask before demolishing, saying how much will come down with the piece. */
export function requestDemolish(id: string) {
  const { world } = useDesignStore.getState()
  const piece = world.pieces.get(id)
  if (!piece) return

  const falling = (removeCommand(world, id)?.remove.length ?? 1) - 1
  requestConfirmation({
    title: `Demolish ${PIECES[piece.type].label.toLowerCase()}?`,
    message:
      falling > 0
        ? `${falling} more piece${falling === 1 ? '' : 's'} it holds up will collapse with it. Ctrl+Z brings them back.`
        : 'Ctrl+Z brings it back.',
    confirmLabel: 'Demolish',
    onConfirm: () => {
      useDesignStore.getState().remove(id)
      useToolStore.getState().select(null)
    },
  })
}

/**
 * Application-wide keyboard shortcuts. Both stores are read imperatively so the
 * listener is registered exactly once.
 */
export function useAppShortcuts() {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return
      // The confirm dialog owns the keyboard while it is open.
      if (useConfirmStore.getState().request) return

      const tool = useToolStore.getState()
      const design = useDesignStore.getState()
      const modifier = event.metaKey || event.ctrlKey
      const key = event.key.toLowerCase()

      if (modifier && key === 'z') {
        event.preventDefault()
        if (event.shiftKey) design.redo()
        else design.undo()
        return
      }
      if (modifier && key === 'y') {
        event.preventDefault()
        design.redo()
        return
      }
      if (modifier) return

      if (key === 'escape') {
        if (tool.activeType) tool.setActiveType(null)
        else tool.select(null)
        return
      }

      if (key === 'r' && tool.activeType) {
        tool.rotate()
        return
      }

      if ((key === 'delete' || key === 'backspace') && tool.selectedId) {
        event.preventDefault()
        requestDemolish(tool.selectedId)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
}
