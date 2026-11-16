'use client'

import { useRef } from 'react'
import { Download, Keyboard, Redo2, Trash2, Undo2, Upload } from 'lucide-react'
import { SaveFormatError, deserialize, serialize } from '@/engine'
import { useDesignStore } from '@/store/useDesignStore'
import { ViewMode, useToolStore } from '@/store/useToolStore'
import { requestConfirmation } from '@/store/useConfirmStore'
import { useHydrated } from '@/hooks/useHydrated'

const VIEWS: { mode: ViewMode; label: string }[] = [
  { mode: '3d', label: '3D' },
  { mode: 'top', label: 'Top' },
  { mode: 'front', label: 'Front' },
  { mode: 'side', label: 'Side' },
]

const iconButton =
  'flex h-8 w-8 items-center justify-center rounded-[3px] text-ink/80 transition-colors hover:bg-ink/10 hover:text-ink disabled:pointer-events-none disabled:opacity-30'

const textButton =
  'flex h-8 items-center gap-1.5 rounded-[3px] px-2.5 text-sm text-ink/85 transition-colors hover:bg-ink/10 hover:text-ink disabled:pointer-events-none disabled:opacity-30'

export function TopBar() {
  const world = useDesignStore((state) => state.world)
  const canUndo = useDesignStore((state) => state.past.length > 0)
  const canRedo = useDesignStore((state) => state.future.length > 0)
  const viewMode = useToolStore((state) => state.viewMode)
  const setViewMode = useToolStore((state) => state.setViewMode)
  const toggleKeymap = useToolStore((state) => state.toggleKeymap)
  const fileInput = useRef<HTMLInputElement>(null)

  const hydrated = useHydrated()
  const count = hydrated ? world.pieces.size : 0
  const isEmpty = count === 0

  const handleExport = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(serialize(world))], { type: 'application/json' })
    )
    const link = document.createElement('a')
    link.href = url
    link.download = `rust-base-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  const handleImport = async (file: File) => {
    try {
      const loaded = deserialize(JSON.parse(await file.text()))
      const replace = () => {
        useDesignStore.getState().load(loaded)
        useToolStore.getState().select(null)
      }
      if (isEmpty) replace()
      else
        requestConfirmation({
          title: 'Replace this base?',
          message: `${file.name} has ${loaded.length} pieces. Undo brings the current base back.`,
          confirmLabel: 'Replace base',
          onConfirm: replace,
        })
    } catch (error) {
      requestConfirmation({
        title: 'This file cannot be opened',
        message:
          error instanceof SaveFormatError
            ? error.message
            : 'It is not a base exported from this planner.',
        confirmLabel: 'OK',
        tone: 'neutral',
        onConfirm: () => {},
      })
    }
  }

  const handleClear = () => {
    requestConfirmation({
      title: 'Clear the whole base?',
      message: `All ${count} pieces will be removed. Undo brings them back.`,
      confirmLabel: 'Clear base',
      onConfirm: () => {
        useDesignStore.getState().clear()
        useToolStore.getState().select(null)
      },
    })
  }

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3">
      <div className="hud-panel pointer-events-auto flex h-10 items-center gap-3 px-3">
        <h1 className="font-stencil text-xl leading-none font-extrabold tracking-wide text-ink">
          Rust Base Builder
        </h1>
        <span className="hidden text-sm text-mute sm:inline">
          {count === 1 ? '1 piece' : `${count} pieces`}
        </span>
      </div>

      <div className="hud-panel pointer-events-auto flex h-10 items-center gap-1 px-1">
        <button
          onClick={() => useDesignStore.getState().undo()}
          disabled={!canUndo}
          aria-label="Undo (Ctrl+Z)"
          title="Undo (Ctrl+Z)"
          className={iconButton}
        >
          <Undo2 size={17} />
        </button>
        <button
          onClick={() => useDesignStore.getState().redo()}
          disabled={!canRedo}
          aria-label="Redo (Ctrl+Shift+Z)"
          title="Redo (Ctrl+Shift+Z)"
          className={iconButton}
        >
          <Redo2 size={17} />
        </button>

        <span className="mx-1 h-5 w-px bg-ink/12" />

        <div className="flex" role="radiogroup" aria-label="Camera view">
          {VIEWS.map(({ mode, label }) => (
            <button
              key={mode}
              role="radio"
              aria-checked={viewMode === mode}
              onClick={() => setViewMode(mode)}
              className={`h-8 rounded-[3px] px-2.5 font-display text-base font-semibold transition-colors ${
                viewMode === mode ? 'bg-ink/12 text-signal' : 'text-ink/70 hover:text-ink'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <span className="mx-1 h-5 w-px bg-ink/12" />

        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (file) void handleImport(file)
          }}
        />
        <button onClick={() => fileInput.current?.click()} className={textButton}>
          <Upload size={15} />
          <span className="hidden md:inline">Import</span>
        </button>
        <button onClick={handleExport} disabled={isEmpty} className={textButton}>
          <Download size={15} />
          <span className="hidden md:inline">Export</span>
        </button>
        <button
          onClick={handleClear}
          disabled={isEmpty}
          aria-label="Clear base"
          title="Clear base"
          className={`${iconButton} hover:text-oxide`}
        >
          <Trash2 size={16} />
        </button>

        <span className="mx-1 h-5 w-px bg-ink/12" />

        <button
          onClick={() => toggleKeymap()}
          aria-label="Keyboard shortcuts (?)"
          title="Keyboard shortcuts (?)"
          className={iconButton}
        >
          <Keyboard size={17} />
        </button>
      </div>
    </header>
  )
}
