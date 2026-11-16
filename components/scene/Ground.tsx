'use client'

import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { noRaycast } from './Pieces'

/** Side of the ground plane, in metres. Fog hides its edge long before this. */
const SIZE = 800
/** Real-world size of one tile of the aerial ground texture. */
const TILE = 15

/**
 * Grass and rock terrain under the base, so pieces stand on land rather than
 * floating over a white void. It also receives the shadows. Picking goes
 * through the engine's own ground plane at y = 0, not this mesh.
 */
export function Ground() {
  const invalidate = useThree((state) => state.invalidate)

  const material = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#5d6b45', roughness: 1, metalness: 0 }),
    []
  )

  useEffect(() => {
    const loader = new THREE.TextureLoader()
    const repeat = SIZE / TILE
    const load = (name: string, colorSpace: THREE.ColorSpace) =>
      loader.loadAsync(`/textures/ground/${name}.jpg`).then((texture) => {
        texture.colorSpace = colorSpace
        texture.wrapS = THREE.RepeatWrapping
        texture.wrapT = THREE.RepeatWrapping
        texture.repeat.set(repeat, repeat)
        texture.anisotropy = 8
        return texture
      })

    let cancelled = false
    Promise.all([
      load('color', THREE.SRGBColorSpace),
      load('normal', THREE.NoColorSpace),
      load('arm', THREE.NoColorSpace),
    ])
      .then(([color, normal, arm]) => {
        if (cancelled) return
        material.map = color
        material.normalMap = normal
        material.aoMap = arm
        material.roughnessMap = arm
        // Muted a little so the ground sits behind the building.
        material.color.set('#c9c4b6')
        material.needsUpdate = true
        invalidate()
      })
      .catch(() => {
        // The flat colour still reads as ground.
      })

    return () => {
      cancelled = true
      material.map?.dispose()
      material.normalMap?.dispose()
      material.aoMap?.dispose()
      material.dispose()
    }
  }, [material, invalidate])

  return (
    <mesh rotation-x={-Math.PI / 2} receiveShadow raycast={noRaycast} material={material}>
      <planeGeometry args={[SIZE, SIZE]} />
    </mesh>
  )
}
