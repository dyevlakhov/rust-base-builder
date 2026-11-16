'use client'

import { Canvas } from '@react-three/fiber'
import { Grid, OrbitControls } from '@react-three/drei'
import { CELL, PIECES, PlacementProblem } from '@/engine'
import { useDesignStore } from '@/store/useDesignStore'
import { useToolStore } from '@/store/useToolStore'
import { useHydrated } from '@/hooks/useHydrated'
import { BuildController } from './scene/BuildController'
import { CameraRig, VIEW_POSITIONS } from './scene/CameraRig'
import { Pieces, noRaycast } from './scene/Pieces'
import { SelectionOutline } from './scene/SelectionOutline'
import { EnvironmentMap, SceneLights } from './scene/SceneEnvironment'

const CONTROLS: { keys: string; action: string }[] = [
  { keys: 'Left drag', action: 'Orbit' },
  { keys: 'Right drag', action: 'Pan' },
  { keys: 'Scroll', action: 'Zoom' },
  { keys: 'Arrows', action: 'Move camera' },
  { keys: 'R', action: 'Rotate / flip piece' },
  { keys: 'Ctrl Z / Ctrl ⇧ Z', action: 'Undo / redo' },
  { keys: 'Esc', action: 'Stop placing' },
  { keys: 'Del', action: 'Demolish selected' },
]

const PROBLEM_TEXT: Record<PlacementProblem, string> = {
  collision: 'Blocked by another piece',
  unsupported: 'Nothing to attach to',
  unstable: 'Not stable enough',
}

function SceneContent() {
  return (
    <>
      <CameraRig />
      <SceneLights />
      <EnvironmentMap />

      <Grid
        args={[100, 100]}
        cellSize={CELL}
        cellThickness={0.7}
        cellColor="#4d5560"
        sectionSize={CELL * 4}
        sectionThickness={1.2}
        sectionColor="#b0552a"
        fadeDistance={110}
        fadeStrength={1.4}
        followCamera={false}
        infiniteGrid
      />

      {/* Shadow catcher. Picking is done by the engine, not by this mesh. */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.001, 0]}
        receiveShadow
        raycast={noRaycast}
      >
        <planeGeometry args={[600, 600]} />
        <shadowMaterial transparent opacity={0.35} />
      </mesh>

      <Pieces />
      <SelectionOutline />
      <BuildController />

      <OrbitControls
        makeDefault
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 2 - 0.02}
        minDistance={3}
        maxDistance={140}
        enableDamping
        dampingFactor={0.08}
      />
    </>
  )
}

function PlacementStatus() {
  const activeType = useToolStore((state) => state.activeType)
  const ghost = useToolStore((state) => state.ghost)
  if (!activeType) return null

  return (
    <div className="mt-2 border-t border-white/10 pt-2 text-xs">
      <div className="font-medium text-white">{PIECES[activeType].label}</div>
      {ghost ? (
        <div className={ghost.valid ? 'text-sky-300' : 'text-red-400'}>
          {ghost.valid ? 'Click to build' : PROBLEM_TEXT[ghost.problem!]}
          {ghost.stability > 0 && (
            <span className="text-white/60"> · stability {Math.round(ghost.stability * 100)}%</span>
          )}
        </div>
      ) : (
        <div className="text-white/50">Point at the ground or a piece</div>
      )}
    </div>
  )
}

export function Scene3D() {
  const hydrated = useHydrated()
  const storedCount = useDesignStore((state) => state.world.pieces.size)
  const pieceCount = hydrated ? storedCount : 0
  const viewMode = useToolStore((state) => state.viewMode)
  const placing = useToolStore((state) => state.activeType !== null)

  return (
    <div className="relative h-full w-full" style={{ cursor: placing ? 'crosshair' : 'default' }}>
      <Canvas
        camera={{ position: VIEW_POSITIONS['3d'], fov: 50, near: 0.3, far: 2000 }}
        // three 0.185 deprecates PCFSoftShadowMap, which a bare `shadows` selects.
        shadows="percentage"
        dpr={[1, 2]}
        style={{ display: 'block', width: '100%', height: '100%' }}
      >
        <SceneContent />
      </Canvas>

      <div className="glass float-sm pointer-events-none absolute left-4 top-4 min-w-48 rounded-xl border border-white/10 px-4 py-3 text-sm text-white">
        <div className="font-semibold">View: {viewMode.toUpperCase()}</div>
        <div className="mt-1 text-xs text-white/70">Building pieces: {pieceCount}</div>
        <PlacementStatus />
      </div>

      <div className="glass float-sm pointer-events-none absolute bottom-4 left-4 rounded-xl border border-white/10 px-4 py-3 text-xs text-white">
        <div className="mb-2 font-semibold text-white/90">Controls</div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-white/70">
          {CONTROLS.map(({ keys, action }) => (
            <div key={keys} className="contents">
              <dt className="text-white">{keys}</dt>
              <dd>{action}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}
