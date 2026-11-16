import * as THREE from 'three'
import { Tier } from '@/engine'

/**
 * One physically based material per tier, shared by every piece of that tier.
 *
 * Textures are CC0 photoscans from Poly Haven chosen to read like each tier in
 * the game (see public/textures/README.md). Each tier ships three maps: colour,
 * an OpenGL normal map, and a packed ARM map — ambient occlusion in red,
 * roughness in green, metalness in blue — which three.js reads for all three
 * from a single texture.
 *
 * Until the maps arrive a piece is drawn in a flat colour close to the
 * texture's average, so the scene is never blank and never pops in white.
 */

interface TierLook {
  folder: string
  /** Real-world size of one texture tile, in metres. Geometry UVs are in metres. */
  tile: number
  /** Multiplied with the colour map. */
  tint: string
  /** Shown before the maps load. */
  fallback: string
  normalScale: number
}

const LOOKS: Record<Tier, TierLook> = {
  twig: { folder: 'twig', tile: 2.15, tint: '#efe2c6', fallback: '#8f7a5c', normalScale: 1.2 },
  wood: { folder: 'wood', tile: 2, tint: '#ffffff', fallback: '#7d6045', normalScale: 1 },
  stone: { folder: 'stone', tile: 2.5, tint: '#ffffff', fallback: '#7f7b74', normalScale: 1.1 },
  metal: { folder: 'metal', tile: 1.8, tint: '#8c8f93', fallback: '#5e5f60', normalScale: 1 },
  armored: { folder: 'armored', tile: 2, tint: '#ffffff', fallback: '#2f3133', normalScale: 1 },
}

const TEXTURE_ROOT = '/textures'
const ANISOTROPY = 8

const loader = new THREE.TextureLoader()
const materials = new Map<Tier, THREE.MeshStandardMaterial>()
const listeners = new Set<() => void>()

/**
 * Be told when a material changes after creation (its textures arrived). The
 * scene renders on demand, so it has to be asked to draw the new look.
 */
export function onMaterialsChange(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function load(url: string, colorSpace: THREE.ColorSpace, tile: number): Promise<THREE.Texture> {
  return loader.loadAsync(url).then((texture) => {
    texture.colorSpace = colorSpace
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(1 / tile, 1 / tile)
    texture.anisotropy = ANISOTROPY
    return texture
  })
}

export function tierMaterial(tier: Tier): THREE.MeshStandardMaterial {
  const cached = materials.get(tier)
  if (cached) return cached

  const look = LOOKS[tier]
  const material = new THREE.MeshStandardMaterial({
    color: look.fallback,
    roughness: 0.85,
    metalness: 0,
    envMapIntensity: 0.8,
  })
  materials.set(tier, material)

  const base = `${TEXTURE_ROOT}/${look.folder}`
  Promise.all([
    load(`${base}/color.jpg`, THREE.SRGBColorSpace, look.tile),
    load(`${base}/normal.jpg`, THREE.NoColorSpace, look.tile),
    load(`${base}/arm.jpg`, THREE.NoColorSpace, look.tile),
  ])
    .then(([color, normal, arm]) => {
      material.map = color
      material.normalMap = normal
      material.normalScale.setScalar(look.normalScale)
      material.aoMap = arm
      material.roughnessMap = arm
      material.metalnessMap = arm
      // With maps attached these become multipliers of the packed values.
      material.roughness = 1
      material.metalness = 1
      material.color.set(look.tint)
      // New maps change the shader's defines; recompile.
      material.needsUpdate = true
      for (const listener of listeners) listener()
    })
    .catch(() => {
      // A missing texture leaves the flat fallback colour, which still reads.
    })

  return material
}
