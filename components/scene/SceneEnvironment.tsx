'use client'

import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { Sky } from '@react-three/drei'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { World, boundsOf } from '@/engine'
import { useDesignStore } from '@/store/useDesignStore'
import { QUALITY, useQualityStore } from '@/render/quality'

/** Direction the sunlight comes from. Matches the sky's sun. */
const SUN_DIRECTION = new THREE.Vector3(14, 18, 8).normalize()

/** The shadow box never shrinks below this, so an empty scene still has one. */
const MIN_SHADOW_RADIUS = 15
const SHADOW_MARGIN = 6

const extentCache = new WeakMap<World, { center: THREE.Vector3; radius: number }>()

/** Centre and radius of the base's bounding box, for fitting the shadow camera. */
function extentOf(world: World): { center: THREE.Vector3; radius: number } {
  let extent = extentCache.get(world)
  if (extent) return extent

  let minX = Infinity
  let maxX = -Infinity
  let minY = 0
  let maxY = 0
  let minZ = Infinity
  let maxZ = -Infinity
  for (const piece of world.pieces.values()) {
    const b = boundsOf(piece)
    minX = Math.min(minX, b.minX)
    maxX = Math.max(maxX, b.maxX)
    minY = Math.min(minY, b.minY)
    maxY = Math.max(maxY, b.maxY)
    minZ = Math.min(minZ, b.minZ)
    maxZ = Math.max(maxZ, b.maxZ)
  }

  if (minX === Infinity) {
    extent = { center: new THREE.Vector3(), radius: MIN_SHADOW_RADIUS }
  } else {
    const center = new THREE.Vector3((minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2)
    const radius = Math.hypot(maxX - minX, maxY - minY, maxZ - minZ) / 2 + SHADOW_MARGIN
    extent = { center, radius: Math.max(MIN_SHADOW_RADIUS, radius) }
  }
  extentCache.set(world, extent)
  return extent
}

/**
 * Direct lights and the sky dome.
 *
 * The sun's shadow camera is fitted to the base: a small base gets crisp
 * shadows from the whole shadow map, and a large one is covered edge to edge
 * instead of losing shadows past a fixed box. The shadow map size follows the
 * render quality.
 *
 * Nothing here loads, so it is deliberately kept outside any Suspense boundary:
 * the scene always has something to show.
 */
export function SceneLights() {
  const world = useDesignStore((state) => state.world)
  const shadowMapSize = useQualityStore((state) => QUALITY[state.level].shadowMapSize)
  const lightRef = useRef<THREE.DirectionalLight>(null)
  const target = useMemo(() => new THREE.Object3D(), [])
  const invalidate = useThree((state) => state.invalidate)

  useLayoutEffect(() => {
    const light = lightRef.current
    if (!light) return
    const { center, radius } = extentOf(world)

    target.position.copy(center)
    target.updateMatrixWorld()
    light.position.copy(center).addScaledVector(SUN_DIRECTION, radius * 2)

    const camera = light.shadow.camera
    camera.left = -radius
    camera.right = radius
    camera.top = radius
    camera.bottom = -radius
    camera.near = 0.5
    camera.far = radius * 4
    camera.updateProjectionMatrix()

    if (light.shadow.mapSize.x !== shadowMapSize) {
      light.shadow.mapSize.set(shadowMapSize, shadowMapSize)
      // A new size needs a new render target.
      light.shadow.map?.dispose()
      light.shadow.map = null
    }
    invalidate()
  }, [world, shadowMapSize, target, invalidate])

  return (
    <>
      <ambientLight intensity={0.55} />
      <primitive object={target} />
      <directionalLight
        ref={lightRef}
        target={target}
        intensity={2.4}
        castShadow
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
      />
      <hemisphereLight args={['#b9d5ff', '#6b5a4a', 0.8]} />
      <fog attach="fog" args={['#c3ccd4', 90, 380]} />
      {/* `distance` must stay inside the camera's far plane or the dome is clipped away. */}
      <Sky distance={1500} sunPosition={[140, 180, 80]} turbidity={6} rayleigh={1.2} />
    </>
  )
}

/**
 * Image-based lighting so the metal tiers actually have something to reflect.
 *
 * The map is pre-filtered from three's built-in `RoomEnvironment` rather than
 * from one of drei's `preset` HDRIs: presets are fetched from a third-party CDN
 * at runtime, and a slow or blocked CDN would leave the user staring at an empty
 * canvas. This is generated on the GPU once, from code that ships with three.
 */
export function EnvironmentMap() {
  const gl = useThree((state) => state.gl)
  const scene = useThree((state) => state.scene)

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const room = new RoomEnvironment()
    const target = pmrem.fromScene(room, 0.04)

    // Mutating the three.js scene is how React Three Fiber is driven; the
    // immutability rule is aimed at React state, and there is no declarative
    // equivalent for attaching a pre-filtered environment map.
    // eslint-disable-next-line react-hooks/immutability
    scene.environment = target.texture

    return () => {
      scene.environment = null
      target.dispose()
      pmrem.dispose()
      room.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose()
          const material = object.material
          if (Array.isArray(material)) material.forEach((entry) => entry.dispose())
          else material.dispose()
        }
      })
    }
  }, [gl, scene])

  return null
}
