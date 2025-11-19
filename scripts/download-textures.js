#!/usr/bin/env node

/**
 * Texture Download Helper Script
 * 
 * This script helps download realistic Rust-like textures from free sources.
 * Run with: node scripts/download-textures.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const TEXTURES_DIR = path.join(__dirname, '..', 'public', 'textures');

// Ensure textures directory exists
if (!fs.existsSync(TEXTURES_DIR)) {
  fs.mkdirSync(TEXTURES_DIR, { recursive: true });
}

console.log('🎨 Rust Texture Download Helper\n');
console.log('This script will help you download realistic textures.\n');
console.log('Recommended sources:');
console.log('1. Poly Haven: https://polyhaven.com/textures');
console.log('2. FreePBR: https://freepbr.com/');
console.log('3. Texture Haven: https://texturehaven.com/\n');

// Texture mapping guide
const textureGuide = {
  twig: {
    search: 'wood planks, branches, sticks',
    examples: ['wood_planks_01', 'wood_planks_02'],
    sources: [
      'https://polyhaven.com/a/wood_planks_01',
      'https://polyhaven.com/a/wood_planks_02'
    ]
  },
  wood: {
    search: 'wood planks, wooden boards',
    examples: ['wood_planks_03', 'wood_planks_04'],
    sources: [
      'https://polyhaven.com/a/wood_planks_03',
      'https://polyhaven.com/a/wood_planks_04'
    ]
  },
  stone: {
    search: 'concrete, stone wall, cement',
    examples: ['concrete_wall_01', 'stone_wall_01'],
    sources: [
      'https://polyhaven.com/a/concrete_wall_01',
      'https://polyhaven.com/a/stone_wall_01'
    ]
  },
  metal: {
    search: 'corrugated metal, sheet metal',
    examples: ['metal_01', 'corrugated_metal_01'],
    sources: [
      'https://polyhaven.com/a/metal_01',
      'https://polyhaven.com/a/corrugated_metal_01'
    ]
  },
  armored: {
    search: 'metal plate, steel, armor',
    examples: ['metal_plate_01', 'steel_01'],
    sources: [
      'https://polyhaven.com/a/metal_plate_01',
      'https://polyhaven.com/a/steel_01'
    ]
  }
};

console.log('📋 Texture Guide:\n');
Object.entries(textureGuide).forEach(([tier, info]) => {
  console.log(`${tier.toUpperCase()}:`);
  console.log(`  Search for: ${info.search}`);
  console.log(`  Examples: ${info.examples.join(', ')}`);
  console.log(`  Sources:`);
  info.sources.forEach(src => console.log(`    - ${src}`));
  console.log('');
});

console.log('\n📝 Instructions:');
console.log('1. Visit the sources above');
console.log('2. Download texture sets (diffuse, normal, roughness, metalness)');
console.log('3. Rename files according to this pattern:');
console.log('   {tier}_{blockType}_{type}.jpg');
console.log('   Example: stone_foundation_diffuse.jpg');
console.log('4. Place files in: public/textures/');
console.log('\n✅ After adding textures, restart your dev server!');

// Create a README with direct download instructions
const readmeContent = `# Realistic Rust Textures

## Quick Download Links

### Twig Tier
- **Poly Haven Wood Planks**: https://polyhaven.com/a/wood_planks_01
- Download: diffuse, normal, roughness maps
- Rename to: \`twig_foundation_*.jpg\`, \`twig_wall_*.jpg\`, \`twig_floor_*.jpg\`

### Wood Tier  
- **Poly Haven Wood Planks**: https://polyhaven.com/a/wood_planks_03
- Download: diffuse, normal, roughness maps
- Rename to: \`wood_foundation_*.jpg\`, \`wood_wall_*.jpg\`, \`wood_floor_*.jpg\`

### Stone Tier
- **Poly Haven Concrete**: https://polyhaven.com/a/concrete_wall_01
- **Poly Haven Stone**: https://polyhaven.com/a/stone_wall_01
- Download: diffuse, normal, roughness maps
- Rename to: \`stone_foundation_*.jpg\`, \`stone_wall_*.jpg\`, \`stone_floor_*.jpg\`

### Metal Tier
- **Poly Haven Metal**: https://polyhaven.com/a/metal_01
- **Poly Haven Corrugated**: https://polyhaven.com/a/corrugated_metal_01
- Download: diffuse, normal, roughness, metalness maps
- Rename to: \`metal_foundation_*.jpg\`, \`metal_wall_*.jpg\`, \`metal_floor_*.jpg\`

### Armored Tier
- **Poly Haven Metal Plate**: https://polyhaven.com/a/metal_plate_01
- **Poly Haven Steel**: https://polyhaven.com/a/steel_01
- Download: diffuse, normal, roughness, metalness maps
- Rename to: \`armored_foundation_*.jpg\`, \`armored_wall_*.jpg\`, \`armored_floor_*.jpg\`

## Naming Convention

Files must be named exactly:
- \`{tier}_{blockType}_diffuse.jpg\`
- \`{tier}_{blockType}_normal.jpg\`
- \`{tier}_{blockType}_roughness.jpg\`
- \`{tier}_{blockType}_metalness.jpg\` (only for metal/armored)

Where:
- \`{tier}\` = twig, wood, stone, metal, or armored
- \`{blockType}\` = foundation, wall, or floor

## Example Files Needed

For a complete set, you need:
- stone_foundation_diffuse.jpg
- stone_foundation_normal.jpg
- stone_foundation_roughness.jpg
- stone_wall_diffuse.jpg
- stone_wall_normal.jpg
- stone_wall_roughness.jpg
- stone_floor_diffuse.jpg
- stone_floor_normal.jpg
- stone_floor_roughness.jpg
- (repeat for each tier)

## Tips

1. Use 1K or 2K resolution (smaller file size, still looks great)
2. Ensure textures are seamless/tileable
3. JPG for diffuse, PNG for normal maps (better quality)
4. After adding textures, restart: \`npm run dev\`
`;

fs.writeFileSync(
  path.join(TEXTURES_DIR, 'DOWNLOAD_GUIDE.md'),
  readmeContent
);

console.log('\n✅ Created DOWNLOAD_GUIDE.md in public/textures/');
console.log('   Check it for direct download links!\n');

