'use client'

import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { Grid, OrbitControls } from '@react-three/drei'
import { CELL } from '@/engine'
import { useToolStore } from '@/store/useToolStore'
import { BuildController } from './scene/BuildController'
import { CameraRig, VIEW_POSITIONS } from './scene/CameraRig'
import { Pieces } from './scene/Pieces'
import { Ground } from './scene/Ground'
import { SelectionOutline } from './scene/SelectionOutline'
import { PerfProbe, perfEnabled } from './scene/PerfProbe'
import { Effects, RenderDriver } from './scene/RenderDriver'
import { EnvironmentMap, SceneLights } from './scene/SceneEnvironment'

function perfSpin(): boolean {
  return (
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('perf') === 'spin'
  )
}

function SceneContent() {
  return (
    <>
      <CameraRig />
      <SceneLights />
      <EnvironmentMap />

      <Ground />

      {/* The 3 m building grid, chalked faintly onto the ground. */}
      <Grid
        position={[0, 0.02, 0]}
        args={[100, 100]}
        cellSize={CELL}
        cellThickness={0.6}
        cellColor="#e8e1d0"
        sectionSize={CELL * 4}
        sectionThickness={1}
        sectionColor="#f2a93b"
        fadeDistance={70}
        fadeStrength={1.6}
        followCamera={false}
        infiniteGrid
      />

      <Pieces />
      <SelectionOutline />
      <BuildController />
      <RenderDriver />
      <Effects />
      {perfEnabled() && <PerfProbe />}

      <OrbitControls
        makeDefault
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 2 - 0.02}
        minDistance={3}
        maxDistance={140}
        enableDamping
        // `?perf=spin` keeps the camera turning, for frame-time measurements.
        autoRotate={perfSpin()}
        autoRotateSpeed={6}
        dampingFactor={0.08}
      />
    </>
  )
}

export function Scene3D() {
  const placing = useToolStore((state) => state.activeType !== null)

  return (
    <div className="relative h-full w-full" style={{ cursor: placing ? 'crosshair' : 'default' }}>
      <Canvas
        camera={{ position: VIEW_POSITIONS['3d'], fov: 50, near: 0.3, far: 2000 }}
        // three 0.185 deprecates PCFSoftShadowMap, which a bare `shadows` selects.
        shadows="percentage"
        // Draw only when something changes. See RenderDriver for what asks.
        frameloop="demand"
        dpr={[1, 2]}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.AgXToneMapping
        }}
        style={{ display: 'block', width: '100%', height: '100%' }}
      >
        <SceneContent />
      </Canvas>
    </div>
  )
}
