import { create } from 'zustand'

/**
 * Render quality, stepped down automatically when frames get slow and back up
 * when there is headroom.
 *
 *   high    pixel ratio up to 1.5, ambient occlusion, 2048 shadows
 *   medium  pixel ratio up to 1.5, no ambient occlusion, 2048 shadows
 *   low     pixel ratio 1, no ambient occlusion, 1024 shadows
 */
export type QualityLevel = 'high' | 'medium' | 'low'

export interface QualitySettings {
  maxDpr: number
  ambientOcclusion: boolean
  shadowMapSize: number
}

export const QUALITY: Record<QualityLevel, QualitySettings> = {
  high: { maxDpr: 1.5, ambientOcclusion: true, shadowMapSize: 2048 },
  medium: { maxDpr: 1.5, ambientOcclusion: false, shadowMapSize: 2048 },
  low: { maxDpr: 1, ambientOcclusion: false, shadowMapSize: 1024 },
}

const ORDER: QualityLevel[] = ['low', 'medium', 'high']

interface QualityState {
  level: QualityLevel
  /** Times the level went back up after going down; stops oscillation. */
  recoveries: number
  step: (direction: -1 | 1) => void
}

/** Give up on stepping back up after this many recoveries. */
const MAX_RECOVERIES = 2

export const useQualityStore = create<QualityState>((set, get) => ({
  level: 'high',
  recoveries: 0,
  step: (direction) => {
    const { level, recoveries } = get()
    const index = ORDER.indexOf(level) + direction
    if (index < 0 || index >= ORDER.length) return
    if (direction > 0 && recoveries >= MAX_RECOVERIES) return
    set({ level: ORDER[index], recoveries: recoveries + (direction > 0 ? 1 : 0) })
  },
}))

/**
 * Decides when to step quality, from the intervals between rendered frames.
 *
 * The scene renders on demand, so idle time between frames says nothing about
 * performance. Only intervals between frames rendered back to back — while the
 * camera moves or the cursor drags a ghost — count; anything longer than
 * `GAP_MS` starts a new run.
 */
export class FrameMonitor {
  private run: number[] = []

  constructor(
    private readonly onSlow: () => void,
    private readonly onFast: () => void,
    private readonly window = 90,
    private readonly slowMs = 24,
    private readonly fastMs = 15
  ) {}

  private last = 0
  private static readonly GAP_MS = 120

  frame(now: number) {
    const interval = now - this.last
    this.last = now
    if (interval > FrameMonitor.GAP_MS) {
      this.run = []
      return
    }
    this.run.push(interval)
    if (this.run.length < this.window) return

    const sorted = [...this.run].sort((a, b) => a - b)
    const median = sorted[sorted.length >> 1]
    this.run = []
    if (median > this.slowMs) this.onSlow()
    else if (median < this.fastMs) this.onFast()
  }
}
