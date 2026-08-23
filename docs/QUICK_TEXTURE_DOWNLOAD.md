# Quick Guide: Download Rust-Like Textures

The procedural textures now look much more like Rust, but if you want **real high-quality textures**, here's how to get them quickly:

## Option 1: Poly Haven (Recommended - Free CC0)

1. Go to: https://polyhaven.com/textures
2. Search and download these textures:

### For Twig Tier:

- Search: "wood", "branches", "sticks"
- Download: `wood_planks_01` or similar
- Files needed: `diffuse.jpg`, `normal.jpg`, `roughness.jpg`

### For Wood Tier:

- Search: "wood planks", "wooden boards"
- Download: `wood_planks_02` or `wood_planks_03`
- Files needed: `diffuse.jpg`, `normal.jpg`, `roughness.jpg`

### For Stone Tier:

- Search: "concrete", "stone", "cement"
- Download: `concrete_wall_01` or `stone_wall_01`
- Files needed: `diffuse.jpg`, `normal.jpg`, `roughness.jpg`

### For Metal Tier:

- Search: "corrugated metal", "sheet metal", "metal"
- Download: `metal_01` or `corrugated_metal_01`
- Files needed: `diffuse.jpg`, `normal.jpg`, `roughness.jpg`, `metalness.jpg`

### For Armored Tier:

- Search: "metal", "steel", "armor plate"
- Download: `metal_plate_01` or `steel_01`
- Files needed: `diffuse.jpg`, `normal.jpg`, `roughness.jpg`, `metalness.jpg`

3. **Rename files** according to convention:
   - `stone_foundation_diffuse.jpg`
   - `stone_foundation_normal.jpg`
   - `stone_foundation_roughness.jpg`
   - `stone_foundation_metalness.jpg` (only for metal/armored)

4. **Place in**: `public/textures/` folder

## Option 2: FreePBR (Free PBR Materials)

1. Go to: https://freepbr.com/
2. Browse categories: Concrete, Stone, Metal, Wood
3. Download texture sets
4. Rename and place in `public/textures/`

## Option 3: Texture Haven (CC0)

1. Go to: https://texturehaven.com/
2. Search for textures matching each tier
3. Download 1K or 2K resolution (smaller file size)
4. Rename and place in `public/textures/`

## Quick Rename Script

After downloading textures, rename them using this pattern:

```
{original_name}_diffuse.jpg → {tier}_{blockType}_diffuse.jpg
{original_name}_normal.jpg → {tier}_{blockType}_normal.jpg
{original_name}_roughness.jpg → {tier}_{blockType}_roughness.jpg
{original_name}_metalness.jpg → {tier}_{blockType}_metalness.jpg
```

Example:

- `concrete_wall_01_diffuse.jpg` → `stone_foundation_diffuse.jpg`
- `concrete_wall_01_normal.jpg` → `stone_foundation_normal.jpg`
- `concrete_wall_01_roughness.jpg` → `stone_foundation_roughness.jpg`

## Texture Requirements

- **Format**: JPG (for diffuse) or PNG (for normal maps)
- **Resolution**: 512x512 minimum, 1024x1024 recommended
- **Naming**: Must follow exact convention: `{tier}_{blockType}_{type}.jpg`
- **Tiling**: Textures should be seamless/tileable

## Testing

1. Place texture files in `public/textures/`
2. Restart dev server: `npm run dev`
3. Place blocks in the scene
4. Real textures will automatically replace procedural ones!

## Current Procedural Textures

The procedural textures now include:

- ✅ Twig: Vertical stick bundle pattern
- ✅ Wood: Horizontal wood grain
- ✅ Stone: Concrete aggregate pattern
- ✅ Metal: Corrugated ridges
- ✅ Armored: Smooth metal with rivets

These look much more like Rust now, but real textures will look even better!
