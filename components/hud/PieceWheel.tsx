'use client'

import { useEffect, useRef, useState } from 'react'
import { PIECES } from '@/engine'
import { useToolStore } from '@/store/useToolStore'
import { useConfirmStore } from '@/store/useConfirmStore'
import { isTypingTarget } from '@/utils/dom'
import { PieceIcon } from '@/components/icons/PieceIcon'
import { HOTBAR } from './keys'

const OUTER = 150
const INNER = 58
/** Pointer movement below this from the centre picks nothing. */
const DEAD_ZONE = 30
const SLICE = (Math.PI * 2) / HOTBAR.length

/** SVG path for slice `i`, starting at 12 o'clock and going clockwise. */
function slicePath(i: number): string {
  const a0 = i * SLICE - SLICE / 2
  const a1 = a0 + SLICE
  const point = (r: number, a: number) => `${Math.sin(a) * r} ${-Math.cos(a) * r}`
  return [
    `M ${point(INNER, a0)}`,
    `L ${point(OUTER, a0)}`,
    `A ${OUTER} ${OUTER} 0 0 1 ${point(OUTER, a1)}`,
    `L ${point(INNER, a1)}`,
    `A ${INNER} ${INNER} 0 0 0 ${point(INNER, a0)}`,
    'Z',
  ].join(' ')
}

/**
 * Hold Q: a wheel of every piece opens around the cursor. Flick towards one
 * and let go to pick it — faster than reaching for the number row, and the
 * hand never leaves the mouse.
 */
export function PieceWheel() {
  const [centre, setCentre] = useState<{ x: number; y: number } | null>(null)
  const [hovered, setHovered] = useState<number | null>(null)
  const pointer = useRef({ x: 0, y: 0 })
  const hoveredRef = useRef<number | null>(null)
  const centreRef = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    pointer.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 }

    const close = () => {
      centreRef.current = null
      hoveredRef.current = null
      setCentre(null)
      setHovered(null)
    }

    const handleMove = (event: PointerEvent) => {
      pointer.current = { x: event.clientX, y: event.clientY }
      const c = centreRef.current
      if (!c) return
      const dx = event.clientX - c.x
      const dy = event.clientY - c.y
      let index: number | null = null
      if (Math.hypot(dx, dy) > DEAD_ZONE) {
        const angle = (Math.atan2(dx, -dy) + Math.PI * 2) % (Math.PI * 2)
        index = Math.floor((angle + SLICE / 2) / SLICE) % HOTBAR.length
      }
      if (index !== hoveredRef.current) {
        hoveredRef.current = index
        setHovered(index)
      }
    }

    const handleDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'q' || event.repeat) return
      if (event.ctrlKey || event.metaKey || event.altKey) return
      if (isTypingTarget(event.target) || useConfirmStore.getState().request) return
      // Keep the whole wheel on screen.
      const margin = OUTER + 12
      const c = {
        x: Math.min(Math.max(pointer.current.x, margin), window.innerWidth - margin),
        y: Math.min(Math.max(pointer.current.y, margin), window.innerHeight - margin),
      }
      centreRef.current = c
      setCentre(c)
    }

    const handleUp = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'q' || !centreRef.current) return
      const index = hoveredRef.current
      if (index !== null) useToolStore.getState().setActiveType(HOTBAR[index].type)
      close()
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && centreRef.current) {
        event.stopPropagation()
        close()
      }
    }

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('keydown', handleDown)
    window.addEventListener('keydown', handleEscape, true)
    window.addEventListener('keyup', handleUp)
    window.addEventListener('blur', close)
    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('keydown', handleDown)
      window.removeEventListener('keydown', handleEscape, true)
      window.removeEventListener('keyup', handleUp)
      window.removeEventListener('blur', close)
    }
  }, [])

  if (!centre) return null
  const label = hovered !== null ? PIECES[HOTBAR[hovered].type].label : 'Pick a piece'

  return (
    <div className="pointer-events-none fixed inset-0 z-40" role="dialog" aria-label="Piece wheel">
      {/* A zero-sized SVG with overflow does not paint in Chrome; size it to the wheel. */}
      <svg
        className="absolute motion-safe:animate-[wheel-in_120ms_ease-out]"
        style={{ left: centre.x - OUTER - 2, top: centre.y - OUTER - 2 }}
        width={(OUTER + 2) * 2}
        height={(OUTER + 2) * 2}
        viewBox={`${-OUTER - 2} ${-OUTER - 2} ${(OUTER + 2) * 2} ${(OUTER + 2) * 2}`}
      >
        <style>{`@keyframes wheel-in { from { opacity: 0; transform: scale(0.92) } }`}</style>
        {HOTBAR.map(({ type, key }, i) => {
          const mid = i * SLICE
          const r = (OUTER + INNER) / 2
          const active = hovered === i
          return (
            <g key={type}>
              <path
                d={slicePath(i)}
                fill={active ? 'rgb(242 169 59 / 0.9)' : 'rgb(30 32 27 / 0.9)'}
                stroke="rgb(232 225 208 / 0.14)"
                strokeWidth={1}
              />
              <foreignObject
                x={Math.sin(mid) * r - 18}
                y={-Math.cos(mid) * r - 22}
                width={36}
                height={44}
              >
                <div
                  className={`flex flex-col items-center ${active ? 'text-panel' : 'text-ink/85'}`}
                >
                  <PieceIcon type={type} size={30} />
                  <span className="font-stencil text-xs leading-none opacity-70">{key}</span>
                </div>
              </foreignObject>
            </g>
          )
        })}
        <circle r={INNER - 1} fill="rgb(30 32 27 / 0.92)" stroke="rgb(232 225 208 / 0.14)" />
        <foreignObject x={-(INNER - 10)} y={-14} width={(INNER - 10) * 2} height={28}>
          <div className="text-center font-display text-base leading-7 font-semibold text-ink">
            {label}
          </div>
        </foreignObject>
      </svg>
    </div>
  )
}
