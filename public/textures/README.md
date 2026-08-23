# Rust Game Textures

This directory contains texture files for building blocks. The application will automatically load textures based on tier and block type.

## Texture Naming Convention

Textures should be named using the following pattern:

- `{tier}_{blockType}_diffuse.jpg` - Main color/albedo texture
- `{tier}_{blockType}_normal.jpg` - Normal map for surface detail
- `{tier}_{blockType}_roughness.jpg` - Roughness map (grayscale)
- `{tier}_{blockType}_metalness.jpg` - Metalness map (grayscale)

### Tiers

- `twig` - Twig/Stick tier
- `wood` - Wood tier
- `stone` - Stone tier
- `metal` - Sheet Metal tier
- `armored` - Armored/HQM tier

### Block Types

- `foundation` - Foundation blocks
- `wall` - Wall blocks
- `floor` - Floor blocks

## Example Files

For a stone foundation, you would need:

- `stone_foundation_diffuse.jpg`
- `stone_foundation_normal.jpg`
- `stone_foundation_roughness.jpg`
- `stone_foundation_metalness.jpg`

## Where to Get Textures

### Option 1: Extract from Rust Game (Legal Considerations)

If you own Rust and want to extract textures:

1. Use Unity Asset Bundle Extractor (UABE) or AssetStudio
2. Extract textures from Rust's asset bundles
3. Convert to JPG format
4. **Important**: Only use for personal projects, check EULA

### Option 2: Free Texture Sources (Recommended)

- **Poly Haven** (https://polyhaven.com/) - CC0 textures
- **FreePBR** (https://freepbr.com/) - Free PBR materials
- **Texture Haven** (https://texturehaven.com/) - CC0 textures
- **CC0 Textures** (https://cc0textures.com/) - Public domain textures

### Option 3: Generate Procedural Textures

The application will automatically generate procedural textures as fallback if files don't exist.

## Texture Specifications

- **Format**: JPG or PNG
- **Resolution**: 512x512 minimum, 1024x1024 or 2048x2048 recommended
- **Color Space**: sRGB
- **Normal Maps**: Should be in tangent space, RGB format
- **Roughness/Metalness**: Grayscale images (white = high, black = low)

## Adding Textures

1. Download or create texture files
2. Name them according to the convention above
3. Place them in this directory (`public/textures/`)
4. Restart the development server
5. Textures will automatically load

## Notes

- If a texture file is missing, the application will use a procedural fallback
- Textures are cached for performance
- All textures use tiling/repeat wrapping (4x4 repeat by default)
