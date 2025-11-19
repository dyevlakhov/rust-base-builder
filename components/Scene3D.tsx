'use client'

import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, Grid, Sky, Environment } from '@react-three/drei'
import { BuildingBlockMesh } from './BuildingBlockMesh'
import { PlacementPreview } from './PlacementPreview'
import { useBuilderStore } from '@/store/useBuilderStore'
import { Suspense, useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import {
  getBlockHeight,
  calculateYPosition,
  checkFoundationOverlap,
  checkBlockOverlap,
  isFoundation,
} from '@/utils/placementUtils'

function SceneContent() {
  const blocks = useBuilderStore(state => state.blocks)
  const placementMode = useBuilderStore(state => state.placementMode)
  const addBlock = useBuilderStore(state => state.addBlock)
  const setPlacementMode = useBuilderStore(state => state.setPlacementMode)
  const snapPosition = useBuilderStore(state => state.snapPosition)
  const deleteBlock = useBuilderStore(state => state.deleteBlock)
  const selectedBlockId = useBuilderStore(state => state.selectedBlockId)
  const gridSize = useBuilderStore(state => state.gridSize)
  
  const { camera, raycaster, pointer } = useThree()
  const keysPressed = useRef<Set<string>>(new Set())

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!placementMode) return
      
      const target = event.target as HTMLElement
      if (target.closest('aside') || target.closest('header') || target.closest('button') || target.closest('.absolute')) {
        return
      }
      
      raycaster.setFromCamera(pointer, camera)
      
      const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
      const intersectPoint = new THREE.Vector3()
      raycaster.ray.intersectPlane(groundPlane, intersectPoint)
      
      if (!intersectPoint) return

      const blockHeight = getBlockHeight(placementMode)
      // For walls, we need to snap first to get exact edge position, then find blocks below
      const tempSnapped = snapPosition([intersectPoint.x, 100, intersectPoint.z], placementMode)
      const yPos = calculateYPosition(blocks, [intersectPoint.x, 100, intersectPoint.z], placementMode, gridSize, tempSnapped)
      const snapped = snapPosition([intersectPoint.x, yPos, intersectPoint.z], placementMode)
      
      // Check collision
      let canPlace = true
      
      if (isFoundation(placementMode)) {
        canPlace = !checkFoundationOverlap(blocks, snapped, placementMode)
        if (canPlace) {
          const overlappingBlocks = blocks.filter(block => {
            if (isFoundation(block.type)) return false
            const xDist = Math.abs(block.position[0] - snapped[0])
            const zDist = Math.abs(block.position[2] - snapped[2])
            const isAtSameXZ = xDist < 1.6 && zDist < 1.6
            const blockBottom = block.position[1] - block.scale[1] / 2
            return isAtSameXZ && blockBottom <= 0.3
          })
          canPlace = overlappingBlocks.length === 0
          }
        } else {
        canPlace = !checkBlockOverlap(blocks, snapped, placementMode, blockHeight)
      }
      
      if (canPlace) {
        addBlock(placementMode, snapped)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && placementMode) {
        setPlacementMode(null)
        return
      }
      
      if ((event.key === 'Delete' || event.key === 'Backspace') && !placementMode) {
        if (selectedBlockId) {
          if (confirm('Demolish this building piece?')) {
            deleteBlock(selectedBlockId)
          }
        }
        return
      }
      
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown'].includes(event.key)) {
        keysPressed.current.add(event.key)
        event.preventDefault()
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown'].includes(event.key)) {
        keysPressed.current.delete(event.key)
        event.preventDefault()
      }
    }

    window.addEventListener('click', handleClick)
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    return () => {
      window.removeEventListener('click', handleClick)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [placementMode, addBlock, setPlacementMode, camera, raycaster, pointer, snapPosition, deleteBlock, selectedBlockId, blocks, gridSize])

  useFrame((state, delta) => {
    if (!camera || keysPressed.current.size === 0) return

    const panSpeed = 2.0 * delta
    const panDirection = new THREE.Vector3(0, 0, 0)
    
    if (keysPressed.current.has('ArrowUp')) {
      const forward = new THREE.Vector3()
      camera.getWorldDirection(forward)
      forward.y = 0
      forward.normalize()
      panDirection.add(forward.multiplyScalar(panSpeed))
    }
    
    if (keysPressed.current.has('ArrowDown')) {
      const forward = new THREE.Vector3()
      camera.getWorldDirection(forward)
      forward.y = 0
      forward.normalize()
      panDirection.add(forward.multiplyScalar(-panSpeed))
    }
    
    if (keysPressed.current.has('ArrowLeft')) {
      const forward = new THREE.Vector3()
      camera.getWorldDirection(forward)
      forward.y = 0
      forward.normalize()
      const left = new THREE.Vector3(-forward.z, 0, forward.x)
      panDirection.add(left.multiplyScalar(panSpeed))
    }
    
    if (keysPressed.current.has('ArrowRight')) {
      const forward = new THREE.Vector3()
      camera.getWorldDirection(forward)
      forward.y = 0
      forward.normalize()
      const right = new THREE.Vector3(forward.z, 0, -forward.x)
      panDirection.add(right.multiplyScalar(panSpeed))
    }
    
    if (keysPressed.current.has('PageUp')) {
      panDirection.y += panSpeed
    }
    
    if (keysPressed.current.has('PageDown')) {
      panDirection.y -= panSpeed
    }
    
    if (panDirection.length() > 0) {
      camera.position.add(panDirection)
    }
  })

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-10, 10, -10]} intensity={0.3} />

      <Sky sunPosition={[100, 20, 100]} />
      <Environment preset="sunset" />

      <Grid
        args={[100, 100]}
        cellSize={3}
        cellThickness={0.8}
        cellColor="#6f6f6f"
        sectionSize={3}
        sectionThickness={1.5}
        sectionColor="#cc5500"
        fadeDistance={50}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid
      />

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <planeGeometry args={[1000, 1000]} />
        <meshStandardMaterial color="#2a2a2a" transparent opacity={0.01} />
      </mesh>

      {blocks.map((block) => (
        <BuildingBlockMesh key={block.id} block={block} />
      ))}

      {placementMode && <PlacementPreview blockType={placementMode} />}

      <OrbitControls
        makeDefault
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 2}
        enableDamping
        dampingFactor={0.05}
      />
    </>
  )
}

export function Scene3D() {
  const blocks = useBuilderStore(state => state.blocks)
  const viewMode = useBuilderStore(state => state.viewMode)
  const placementMode = useBuilderStore(state => state.placementMode)

  const getCameraPosition = (): [number, number, number] => {
    switch (viewMode) {
      case 'top': return [0, 20, 0]
      case 'front': return [0, 5, 15]
      case 'side': return [15, 5, 0]
      default: return [10, 10, 10]
    }
  }

  return (
    <div className="w-full h-full relative" style={{ cursor: placementMode ? 'crosshair' : 'default' }}>
      <Canvas
        camera={{ position: getCameraPosition(), fov: 50 }}
        shadows
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>
      </Canvas>

      <div className="absolute top-4 left-4 glass float-sm text-white px-4 py-3 rounded-xl text-sm border border-white/10">
        <div className="font-semibold text-white">View: {viewMode.toUpperCase()}</div>
        <div className="text-xs text-white/70 mt-1">Building Pieces: {blocks.length}</div>
        {placementMode && (
          <div className="text-xs text-orange-400 mt-2 font-medium animate-pulse flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-orange-400 rounded-full"></div>
            Click to place
          </div>
        )}
      </div>

      <div className="absolute bottom-4 left-4 glass float-sm text-white px-4 py-3 rounded-xl text-xs max-w-xs border border-white/10">
        <div className="font-semibold mb-2 text-white/90">Controls</div>
        <div className="space-y-1 text-white/70">
          <div>• <span className="text-white">Left Click + Drag:</span> Rotate</div>
          <div>• <span className="text-white">Right Click + Drag:</span> Pan</div>
          <div>• <span className="text-white">Scroll:</span> Zoom</div>
          <div>• <span className="text-white">Arrow Keys:</span> Pan camera</div>
        </div>
      </div>

      <div className="absolute bottom-4 right-4 glass float-sm text-white px-3 py-2 rounded-xl text-xs border border-white/10">
        {/* <div className="text-white/70">Created by</div> */}
        <div className="font-semibold text-white/90">Set sosi</div>
      </div>
    </div>
  )
}
