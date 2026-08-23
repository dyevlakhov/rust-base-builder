# Adding Real Rust Game Textures

This guide explains how to add authentic Rust game textures to your building blocks.

## Quick Start

1. **Download textures** from free sources (see below)
2. **Name them** according to the convention: `{tier}_{blockType}_{type}.jpg`
3. **Place them** in `public/textures/` directory
4. **Restart** the dev server

## Recommended Free Texture Sources

### 1. Poly Haven (CC0 - Free for Commercial Use)
- **Website**: https://polyhaven.com/
- **Search for**: "concrete", "stone", "wood planks", "metal", "corrugated metal"
- **Download**: Diffuse, Normal, Roughness maps
- **Format**: JPG or PNG

### 2. FreePBR (Free PBR Materials)
- **Website**: https://freepbr.com/
- **Categories**: Concrete, Stone, Metal, Wood
- **Download**: Full PBR material sets

### 3. Texture Haven (CC0)
- **Website**: https://texturehaven.com/
- **High quality**: 1K, 2K, 4K resolutions
- **Free**: No attribution required

## Texture Requirements

For each tier and block type combination, you need:

1. **Diffuse/Albedo Map** (`*_diffuse.jpg`)
   - Main color texture
   - Shows the base color and pattern
   - Example: Wood grain, stone surface, metal corrugation

2. **Normal Map** (`*_normal.jpg`) - Optional but recommended
   - Adds surface detail and depth
   - RGB format, tangent space
   - Makes surfaces look 3D

3. **Roughness Map** (`*_roughness.jpg`) - Optional
   - Controls surface shininess
   - Grayscale: White = rough, Black = smooth
   - Stone should be mostly white, Metal should be darker

4. **Metalness Map** (`*_metalness.jpg`) - Optional
   - Controls metallic appearance
   - Grayscale: White = metallic, Black = non-metallic
   - Metal/Armored tiers should be white, others black

## Example: Stone Foundation Textures

Download these files and name them:
- `stone_foundation_diffuse.jpg` - Main stone texture
- `stone_foundation_normal.jpg` - Stone surface bumps
- `stone_foundation_roughness.jpg` - Rough stone surface
- `stone_foundation_metalness.jpg` - Black (stone is not metal)

## Texture Naming Reference

### All Tier Combinations Needed:

**Foundations:**
- `twig_foundation_*.jpg`
- `wood_foundation_*.jpg`
- `stone_foundation_*.jpg`
- `metal_foundation_*.jpg`
- `armored_foundation_*.jpg`

**Walls:**
- `twig_wall_*.jpg`
- `wood_wall_*.jpg`
- `stone_wall_*.jpg`
- `metal_wall_*.jpg`
- `armored_wall_*.jpg`

**Floors:**
- `twig_floor_*.jpg`
- `wood_floor_*.jpg`
- `stone_floor_*.jpg`
- `metal_floor_*.jpg`
- `armored_floor_*.jpg`

## Quick Download Script

You can use this approach to download textures:

1. Visit Poly Haven: https://polyhaven.com/textures
2. Search for textures matching each tier:
   - **Twig**: Search "wood", "branches", "sticks"
   - **Wood**: Search "wood planks", "wooden boards"
   - **Stone**: Search "concrete", "stone", "cement"
   - **Metal**: Search "corrugated metal", "sheet metal", "metal"
   - **Armored**: Search "metal", "steel", "armor plate"

3. Download the texture set (diffuse, normal, roughness)
4. Rename files according to convention
5. Place in `public/textures/` folder

## Texture Tips

- **Resolution**: 512x512 minimum, 1024x1024 recommended
- **Tiling**: Textures should be seamless/tileable
- **File Size**: Keep under 1MB per texture for web performance
- **Format**: JPG for diffuse (smaller), PNG for normal maps (better quality)

## Fallback Behavior

If textures are missing, the application will:
1. Try to load from `public/textures/`
2. If not found, generate procedural textures
3. Procedural textures use tier colors with noise patterns

## Testing Textures

1. Place a texture file in `public/textures/`
2. Restart dev server: `npm run dev`
3. Place a block of that tier/type in the scene
4. The texture should appear automatically

## Legal Note

- **Extracting from Rust**: Only for personal use, check EULA
- **Free textures**: CC0/public domain textures are safe to use
- **Commercial use**: Verify license for any textures you download

