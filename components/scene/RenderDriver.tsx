'use client'

import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { EffectComposer, N8AO, SMAA, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { useDesignStore } from '@/store/useDesignStore'
import { useToolStore } from '@/store/useToolStore'
import { onMaterialsChange } from '@/render/materials'
import { FrameMonitor, QUALITY, QualityLevel, useQualityStore } from '@/render/quality'

/** `?quality=low|medium|high` pins the level, for comparing and benchmarking. */
function pinnedQuality(): QualityLevel | null {
  if (typeof window === 'undefined') return null
  const value = new URLSearchParams(window.location.search).get('quality')
  return value === 'low' || value === 'medium' || value === 'high' ? value : null
}

/**
 * Keeps the on-demand render loop honest and the quality adaptive.
 *
 * The canvas only draws when asked. React prop changes ask by themselves; what
 * does not — store changes that only the per-frame code reads, textures that
 * finish loading — is wired to `invalidate` here.
 */
export function RenderDriver() {
  const invalidate = useThree((state) => state.invalidate)
  const setDpr = useThree((state) => state.setDpr)
  const level = useQualityStore((state) => state.level)

  useEffect(() => {
    const unsubscribe = [
      useDesignStore.subscribe(() => invalidate()),
      useToolStore.subscribe(() => invalidate()),
      onMaterialsChange(() => invalidate()),
    ]
    return () => unsubscribe.forEach((stop) => stop())
  }, [invalidate])

  useEffect(() => {
    setDpr(Math.min(window.devicePixelRatio || 1, QUALITY[level].maxDpr))
    invalidate()
  }, [level, setDpr, invalidate])

  const pinned = useMemo(() => pinnedQuality(), [])
  useEffect(() => {
    if (pinned) useQualityStore.setState({ level: pinned })
  }, [pinned])

  const monitor = useMemo(() => {
    const { step } = useQualityStore.getState()
    return new FrameMonitor(
      () => step(-1),
      () => step(1)
    )
  }, [])

  useFrame(() => {
    if (!pinned) monitor.frame(performance.now())
  })

  return null
}

/**
 * Screen-space ambient occlusion, on the high quality level only. It grounds
 * pieces against each other — the dark seam where a wall meets a floor — which
 * flat lighting cannot.
 *
 * While the composer runs, tone mapping moves from the renderer into the
 * effect chain, so both paths end up with the same AgX curve.
 */
export function Effects() {
  const enabled = useQualityStore((state) => QUALITY[state.level].ambientOcclusion)
  const gl = useThree((state) => state.gl)

  useEffect(() => {
    if (!enabled) return
    const previous = gl.toneMapping
    // The renderer is a three.js object, not React state; driving it
    // imperatively is how R3F works and there is no declarative equivalent.
    // eslint-disable-next-line react-hooks/immutability
    gl.toneMapping = THREE.NoToneMapping
    return () => {
      gl.toneMapping = previous
    }
  }, [enabled, gl])

  if (!enabled) return null

  return (
    <EffectComposer multisampling={0}>
      <N8AO aoRadius={1.4} distanceFalloff={0.6} intensity={2.2} quality="performance" halfRes />
      <ToneMapping mode={ToneMappingMode.AGX} />
      {/* MSAA inside the composer costs more than the occlusion itself. */}
      <SMAA />
    </EffectComposer>
  )
}
