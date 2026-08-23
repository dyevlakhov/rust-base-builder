import * as THREE from 'three'
import { BlockCategory, BuildingTier, TIER_PROPERTIES } from '@/types/building-blocks'

// Optional PBR maps are read from /public/textures. Anything missing is replaced
// by a procedurally generated stand-in, so the app has no texture assets to ship.
const TEXTURE_BASE_URL = '/textures'

export interface MaterialTextures {
  map: THREE.Texture | null // Diffuse/Albedo
  normalMap: THREE.Texture | null
  roughnessMap: THREE.Texture | null
  metalnessMap: THREE.Texture | null
}

/** Peak lightness swing of the generated grain, as a fraction of the base colour. */
const DIFFUSE_CONTRAST = 0.16

const textureLoader = new THREE.TextureLoader()

/**
 * One entry per tier/category pair. Procedural generation walks 512x512 pixels
 * four times, so it must happen once per material and never once per block.
 */
const materialCache = new Map<string, Promise<MaterialTextures>>()

function loadTexture(url: string, colorSpace: THREE.ColorSpace): Promise<THREE.Texture | null> {
  return new Promise((resolve) => {
    textureLoader.load(
      url,
      (texture) => {
        texture.wrapS = THREE.RepeatWrapping
        texture.wrapT = THREE.RepeatWrapping
        texture.colorSpace = colorSpace
        resolve(texture)
      },
      undefined,
      () => resolve(null)
    )
  })
}

// Generate procedural textures as fallback if files don't exist
function createProceduralTexture(
  color: string,
  type: 'diffuse' | 'normal' | 'roughness' | 'metalness',
  tier?: BuildingTier
): THREE.Texture {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')!

  if (type === 'diffuse') {
    const baseColor = new THREE.Color(color)
    const r = Math.floor(baseColor.r * 255)
    const g = Math.floor(baseColor.g * 255)
    const b = Math.floor(baseColor.b * 255)

    // Fill base color
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
    ctx.fillRect(0, 0, 512, 512)

    const imageData = ctx.getImageData(0, 0, 512, 512)
    const data = imageData.data

    // Tier-specific texture patterns matching Rust game style
    for (let y = 0; y < 512; y++) {
      for (let x = 0; x < 512; x++) {
        const i = (y * 512 + x) * 4
        // Signed, roughly -1.5..1.5. Applied once below so every tier shares the
        // same contrast calibration instead of each inventing its own offsets.
        let variation = 0

        if (tier === 'twig') {
          // Twig: Bundled sticks pattern - more realistic with individual stick details
          const stickWidth = 6 + Math.sin(x / 25) * 1.5
          const stickIndex = Math.floor(x / stickWidth)
          const stickSeed = (stickIndex * 7) % 13
          const stickOffset = (stickSeed % 5) * 2

          // Individual stick pattern
          const stickPattern = Math.sin(((x + stickOffset) / stickWidth) * Math.PI * 2) * 0.4
          const stickDetail = Math.sin((x + stickOffset) / 2) * 0.15

          // Vertical grain for stick texture
          const verticalGrain = Math.sin(y / 3 + x / 10) * 0.25

          // Knots and imperfections
          const knotX = (x % 40) - 20
          const knotY = (y % 40) - 20
          const knotDist = Math.sqrt(knotX * knotX + knotY * knotY)
          const knotPattern = knotDist < 3 ? -0.2 : 0

          variation = stickPattern + stickDetail + verticalGrain + knotPattern
        } else if (tier === 'wood') {
          // Wood: Realistic wood grain pattern with growth rings
          const grainFreq = y / 12
          const grainWave = Math.sin(grainFreq + Math.cos(x / 48) * 1.5) * 0.5

          // Growth rings (concentric patterns)
          const ringDist = Math.sqrt(Math.pow(x - 256, 2) + Math.pow(y - 256, 2))
          const ringPattern = Math.sin(ringDist / 8) * 0.2

          // Fine grain detail
          const grainDetail = Math.sin(x / 6 + y / 24) * 0.15
          const grainDetail2 = Math.sin(x / 3 + y / 12) * 0.1

          // Wood knots
          const knotX = (x % 60) - 30
          const knotY = (y % 60) - 30
          const knotDist = Math.sqrt(knotX * knotX + knotY * knotY)
          const knotPattern = knotDist < 4 ? -0.25 : knotDist < 8 ? 0.1 : 0

          variation = grainWave + ringPattern + grainDetail + grainDetail2 + knotPattern
        } else if (tier === 'stone') {
          // Stone: Realistic concrete aggregate with pebbles and rough texture
          const aggregateX = Math.floor(x / 24)
          const aggregateY = Math.floor(y / 24)
          const seed1 = (aggregateX * 17 + aggregateY * 23) % 100
          const seed2 = (aggregateX * 31 + aggregateY * 37) % 100

          // Multiple sizes of aggregate
          const largeAggregateSize = (seed1 % 12) + 6
          const smallAggregateSize = (seed2 % 6) + 2

          const distToCenterLarge = Math.sqrt(
            Math.pow((x % 24) - 12, 2) + Math.pow((y % 24) - 12, 2)
          )
          const distToCenterSmall = Math.sqrt(Math.pow((x % 12) - 6, 2) + Math.pow((y % 12) - 6, 2))

          const largePattern = distToCenterLarge < largeAggregateSize ? 0.35 : -0.08
          const smallPattern = distToCenterSmall < smallAggregateSize ? 0.2 : -0.05

          // Rough concrete surface texture
          const roughSurface1 = Math.sin(x / 3 + y / 3) * 0.12
          const roughSurface2 = Math.sin(x / 5 + y / 5) * 0.08

          // Cracks and imperfections
          const crackPattern = Math.sin(x / 40 + y / 60) < -0.7 ? -0.15 : 0

          variation = largePattern + smallPattern + roughSurface1 + roughSurface2 + crackPattern
        } else if (tier === 'metal') {
          // Metal: Realistic corrugated sheet metal with depth and reflections
          const ridgeFreq = x / 20
          const ridgeWave = Math.sin(ridgeFreq * Math.PI * 2)

          // Corrugation depth - darker in valleys, lighter on peaks
          const ridgeDepth = ridgeWave * 0.6
          const ridgeShadow = ridgeWave > 0.5 ? 0.3 : ridgeWave < -0.5 ? -0.25 : ridgeDepth * 0.4

          // Metal scratches and wear
          const scratchPattern = Math.sin(y / 1.5 + x / 8) * 0.08
          const wearPattern = Math.sin(x / 15 + y / 20) * 0.05

          // Rust spots (subtle)
          const rustX = (x % 80) - 40
          const rustY = (y % 80) - 40
          const rustDist = Math.sqrt(rustX * rustX + rustY * rustY)
          const rustPattern = rustDist < 8 ? -0.1 : 0

          variation = ridgeShadow + scratchPattern + wearPattern + rustPattern
        } else if (tier === 'armored') {
          // Armored: Realistic smooth metal plate with rivets and weld lines
          const rivetSpacing = 56
          const rivetX = (x % rivetSpacing) - rivetSpacing / 2
          const rivetY = (y % rivetSpacing) - rivetSpacing / 2
          const rivetDist = Math.sqrt(rivetX * rivetX + rivetY * rivetY)

          // Rivet head (darker center, lighter rim)
          const rivetPattern =
            rivetDist < 3 ? -0.35 : rivetDist < 5 ? 0.15 : rivetDist < 7 ? -0.1 : 0

          // Weld lines between plates
          const weldLineX = Math.abs((x % rivetSpacing) - rivetSpacing / 2) < 1 ? -0.2 : 0
          const weldLineY = Math.abs((y % rivetSpacing) - rivetSpacing / 2) < 1 ? -0.2 : 0

          // Smooth polished surface with subtle scratches
          const smoothSurface = Math.sin(x / 20 + y / 20) * 0.04
          const scratchPattern = Math.sin(y / 3 + x / 12) * 0.03

          // Plate seams
          const seamPattern = (weldLineX + weldLineY) * 0.5

          variation = rivetPattern + seamPattern + smoothSurface + scratchPattern
        } else {
          // Default: Generic noise pattern
          const noiseX = x / 32 + Math.sin(y / 16) * 0.5
          const noiseY = y / 32 + Math.cos(x / 16) * 0.5
          const noise = (Math.sin(noiseX) + Math.cos(noiseY)) * 0.5 + 0.5
          variation = noise - 0.5
        }

        // Multiplicative keeps the tier hue; +-DIFFUSE_CONTRAST keeps the mean
        // on the tier colour rather than dragging it towards black.
        const shade = 1 + variation * DIFFUSE_CONTRAST
        data[i] = Math.max(0, Math.min(255, r * shade))
        data[i + 1] = Math.max(0, Math.min(255, g * shade))
        data[i + 2] = Math.max(0, Math.min(255, b * shade))
        data[i + 3] = 255
      }
    }
    ctx.putImageData(imageData, 0, 0)
  } else if (type === 'normal') {
    // Generate normal maps matching Rust style
    const imageData = ctx.createImageData(512, 512)
    const data = imageData.data

    for (let y = 0; y < 512; y++) {
      for (let x = 0; x < 512; x++) {
        const i = (y * 512 + x) * 4

        let nx = 0.5
        let ny = 0.5
        let nz = 1.0

        if (tier === 'twig') {
          // Twig: Vertical stick grooves
          nx = Math.sin(x / 8) * 0.2 + 0.5
          ny = 0.5
          nz = 0.98
        } else if (tier === 'wood') {
          // Wood: Horizontal grain grooves
          nx = 0.5
          ny = Math.sin(y / 8) * 0.2 + 0.5
          nz = 0.98
        } else if (tier === 'stone') {
          // Stone: Rough aggregate bumps
          const bumpX = Math.sin(x / 4) * Math.cos(y / 4) * 0.15
          const bumpY = Math.cos(x / 4) * Math.sin(y / 4) * 0.15
          nx = bumpX + 0.5
          ny = bumpY + 0.5
          nz = 0.97
        } else if (tier === 'metal') {
          // Metal: Corrugated ridges
          nx = Math.sin((x / 12) * Math.PI * 2) * 0.3 + 0.5
          ny = 0.5
          nz = 0.95
        } else if (tier === 'armored') {
          // Armored: Smooth with rivet bumps
          const rivetX = (x % 64) - 32
          const rivetY = (y % 64) - 32
          const rivetDist = Math.sqrt(rivetX * rivetX + rivetY * rivetY)
          const rivetBump = rivetDist < 4 ? 0.2 : 0
          nx = Math.sin(x / 16) * 0.05 + rivetBump + 0.5
          ny = Math.sin(y / 16) * 0.05 + rivetBump + 0.5
          nz = 0.99
        } else {
          // Default: Simple variation
          nx = Math.sin(x / 32) * 0.2 + 0.5
          ny = Math.cos(y / 32) * 0.2 + 0.5
          nz = 0.98
        }

        data[i] = Math.floor(nx * 255) // R (X normal)
        data[i + 1] = Math.floor(ny * 255) // G (Y normal)
        data[i + 2] = Math.floor(nz * 255) // B (Z normal)
        data[i + 3] = 255 // Alpha
      }
    }
    ctx.putImageData(imageData, 0, 0)
  } else if (type === 'roughness') {
    // Roughness maps matching Rust tiers
    const imageData = ctx.createImageData(512, 512)
    const data = imageData.data

    let baseRoughness = 220 // Default rough

    if (tier === 'twig')
      baseRoughness = 250 // Very rough
    else if (tier === 'wood')
      baseRoughness = 230 // Rough
    else if (tier === 'stone')
      baseRoughness = 240 // Very rough
    else if (tier === 'metal')
      baseRoughness = 120 // Smooth metal
    else if (tier === 'armored') baseRoughness = 80 // Very smooth

    for (let i = 0; i < data.length; i += 4) {
      const variation = (Math.random() - 0.5) * 30
      const value = Math.max(50, Math.min(255, baseRoughness + variation))
      data[i] = value // R
      data[i + 1] = value // G
      data[i + 2] = value // B
      data[i + 3] = 255 // Alpha
    }
    ctx.putImageData(imageData, 0, 0)
  } else if (type === 'metalness') {
    // Metalness maps matching Rust tiers
    const imageData = ctx.createImageData(512, 512)
    const data = imageData.data

    let baseMetalness = 0 // Default non-metallic

    if (tier === 'metal')
      baseMetalness = 200 // Highly metallic
    else if (tier === 'armored') baseMetalness = 220 // Very metallic

    for (let i = 0; i < data.length; i += 4) {
      const variation = (Math.random() - 0.5) * 20
      const value = Math.max(0, Math.min(255, baseMetalness + variation))
      data[i] = value // R
      data[i + 1] = value // G
      data[i + 2] = value // B
      data[i + 3] = 255 // Alpha
    }
    ctx.putImageData(imageData, 0, 0)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.colorSpace = type === 'diffuse' ? THREE.SRGBColorSpace : THREE.NoColorSpace
  texture.repeat.set(4, 4) // Tile the texture
  return texture
}

async function buildMaterialTextures(
  tier: BuildingTier,
  category: BlockCategory
): Promise<MaterialTextures> {
  const name = `${tier}_${category}`
  const { color } = TIER_PROPERTIES[tier]

  const [map, normalMap, roughnessMap, metalnessMap] = await Promise.all([
    loadTexture(`${TEXTURE_BASE_URL}/${name}_diffuse.jpg`, THREE.SRGBColorSpace),
    loadTexture(`${TEXTURE_BASE_URL}/${name}_normal.jpg`, THREE.NoColorSpace),
    loadTexture(`${TEXTURE_BASE_URL}/${name}_roughness.jpg`, THREE.NoColorSpace),
    loadTexture(`${TEXTURE_BASE_URL}/${name}_metalness.jpg`, THREE.NoColorSpace),
  ])

  return {
    map: map ?? createProceduralTexture(color, 'diffuse', tier),
    normalMap: normalMap ?? createProceduralTexture('#8080ff', 'normal', tier),
    roughnessMap: roughnessMap ?? createProceduralTexture('#c8c8c8', 'roughness', tier),
    metalnessMap: metalnessMap ?? createProceduralTexture('#000000', 'metalness', tier),
  }
}

/** Textures for a tier/category pair. Repeated calls share one set of textures. */
export function loadMaterialTextures(
  tier: BuildingTier,
  category: BlockCategory
): Promise<MaterialTextures> {
  const key = `${tier}_${category}`
  let pending = materialCache.get(key)

  if (!pending) {
    pending = buildMaterialTextures(tier, category)
    materialCache.set(key, pending)
  }

  return pending
}
