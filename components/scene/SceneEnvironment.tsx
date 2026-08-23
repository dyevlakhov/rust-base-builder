'use client'

import { useEffect } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { Sky } from '@react-three/drei'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

/**
 * Direct lights and the sky dome.
 *
 * Nothing here loads, so it is deliberately kept outside any Suspense boundary:
 * the scene always has something to show.
 */
export function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight
        position={[14, 18, 8]}
        intensity={2.0}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
        shadow-camera-far={80}
      />
      <hemisphereLight args={['#b9d5ff', '#6b5a4a', 0.9]} />
      {/* `distance` must stay inside the camera's far plane or the dome is clipped away. */}
      <Sky distance={1500} sunPosition={[100, 30, 100]} turbidity={6} rayleigh={1.2} />
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
