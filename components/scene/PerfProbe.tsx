'use client'

import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { Stats } from '@react-three/drei'

export interface PerfSnapshot {
  calls: number
  triangles: number
  geometries: number
  textures: number
  /** Frames rendered since the probe mounted. */
  frames: number
  /** Mean CPU time spent in `renderer.render` per frame, in ms. */
  renderMs: number
}

declare global {
  interface Window {
    /** Live renderer numbers, published when the page is opened with `?perf`. */
    __rbbPerf?: PerfSnapshot
  }
}

/** True when the page was opened with `?perf`. */
export function perfEnabled(): boolean {
  return typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('perf')
}

/**
 * Developer overlay: an FPS meter, plus draw calls and render cost on
 * `window.__rbbPerf` for scripted measurements. Mounted only with `?perf`.
 *
 * It wraps `renderer.render` rather than using `useFrame`, because a positive
 * `useFrame` priority would take over R3F's render loop.
 */
export function PerfProbe() {
  const gl = useThree((state) => state.gl)

  useEffect(() => {
    const original = gl.render.bind(gl)
    let frames = 0
    let total = 0

    // Wrapping a three.js method, not mutating React state.
    // eslint-disable-next-line react-hooks/immutability
    gl.render = (scene, camera) => {
      const start = performance.now()
      original(scene, camera)
      total += performance.now() - start
      frames += 1
      const { render, memory } = gl.info
      window.__rbbPerf = {
        calls: render.calls,
        triangles: render.triangles,
        geometries: memory.geometries,
        textures: memory.textures,
        frames,
        renderMs: total / frames,
      }
    }
    return () => {
      gl.render = original
    }
  }, [gl])

  return <Stats />
}
