'use client'

import { Canvas, ThreeEvent } from '@react-three/fiber'
import { Grid, OrbitControls } from '@react-three/drei'
import { FOUNDATION_SIZE } from '@/types/building-blocks'
import { useBuilderStore } from '@/store/useBuilderStore'
import { useHydrated } from '@/hooks/useHydrated'
import { resolvePlacement } from '@/utils/placementUtils'
import { BuildingBlockMesh } from './scene/BuildingBlockMesh'
import { PlacementPreview } from './scene/PlacementPreview'
import { CameraRig, VIEW_POSITIONS } from './scene/CameraRig'
import { EnvironmentMap, SceneLights } from './scene/SceneEnvironment'

const CONTROLS: { keys: string; action: string }[] = [
  { keys: 'Left drag', action: 'Orbit' },
  { keys: 'Right drag', action: 'Pan' },
  { keys: 'Scroll', action: 'Zoom' },
  { keys: 'Arrows', action: 'Move camera' },
  { keys: 'Esc', action: 'Cancel placing' },
  { keys: 'Del', action: 'Demolish selected' },
]

function SceneContent() {
  const blocks = useBuilderStore((state) => state.blocks)
  const placementMode = useBuilderStore((state) => state.placementMode)

  // Reading the store imperatively keeps this handler stable and keeps the
  // click path identical to the one the preview renders.
  const handleGroundClick = (event: ThreeEvent<MouseEvent>) => {
    const state = useBuilderStore.getState()

    if (!state.placementMode) {
      state.setSelectedBlock(null)
      return
    }

    const placement = resolvePlacement(
      state.blocks,
      { x: event.point.x, z: event.point.z },
      state.placementMode,
      state.gridSize,
      state.snapToGrid
    )

    if (placement.valid) {
      state.addBlock(state.placementMode, placement.position, placement.rotation)
    }
  }

  return (
    <>
      <CameraRig />
      <SceneLights />
      <EnvironmentMap />

      <Grid
        args={[100, 100]}
        cellSize={FOUNDATION_SIZE}
        cellThickness={0.7}
        cellColor="#5c6470"
        sectionSize={FOUNDATION_SIZE * 4}
        sectionThickness={1.3}
        sectionColor="#cc5500"
        fadeDistance={90}
        fadeStrength={1.4}
        followCamera={false}
        infiniteGrid
      />

      {/* Ground plane: catches shadows and is the click target for placement. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow onClick={handleGroundClick}>
        <planeGeometry args={[400, 400]} />
        <shadowMaterial transparent opacity={0.32} />
      </mesh>

      {blocks.map((block) => (
        <BuildingBlockMesh key={block.id} block={block} />
      ))}

      {placementMode && <PlacementPreview blockType={placementMode} />}

      <OrbitControls
        makeDefault
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 2 - 0.02}
        minDistance={4}
        maxDistance={120}
        enableDamping
        dampingFactor={0.08}
      />
    </>
  )
}

export function Scene3D() {
  const hydrated = useHydrated()
  const storedBlockCount = useBuilderStore((state) => state.blocks.length)
  const blockCount = hydrated ? storedBlockCount : 0
  const viewMode = useBuilderStore((state) => state.viewMode)
  const placementMode = useBuilderStore((state) => state.placementMode)

  return (
    <div
      className="relative h-full w-full"
      style={{ cursor: placementMode ? 'crosshair' : 'default' }}
    >
      <Canvas
        camera={{ position: VIEW_POSITIONS['3d'], fov: 50, near: 0.5, far: 2000 }}
        // three 0.185 deprecates PCFSoftShadowMap, which is what a bare
        // `shadows` selects; "percentage" is PCFShadowMap.
        shadows="percentage"
        dpr={[1, 2]}
        style={{ display: 'block', width: '100%', height: '100%' }}
      >
        <SceneContent />
      </Canvas>

      <div className="glass float-sm pointer-events-none absolute left-4 top-4 rounded-xl border border-white/10 px-4 py-3 text-sm text-white">
        <div className="font-semibold">View: {viewMode.toUpperCase()}</div>
        <div className="mt-1 text-xs text-white/70">Building pieces: {blockCount}</div>
        {placementMode && (
          <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-orange-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-400" />
            Click to place
          </div>
        )}
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
