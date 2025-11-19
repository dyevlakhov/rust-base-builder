# Installation Instructions

## Fresh Installation Required

Since this project has been converted from a 2D Rust code architecture builder to a **3D Building Constructor**, you need to reinstall dependencies with the new packages.

## Step-by-Step Installation

### 1. Clean Old Dependencies

```bash
rm -rf node_modules package-lock.json
```

This removes old packages that are no longer needed.

### 2. Install New Dependencies

```bash
npm install
```

This will install:
- **Three.js** (0.160.0) - 3D graphics engine
- **@react-three/fiber** (8.15.12) - React renderer for Three.js
- **@react-three/drei** (9.92.7) - Useful helpers for R3F
- **@types/three** (0.160.0) - TypeScript types for Three.js
- And all other dependencies (Next.js, React, Zustand, Tailwind, etc.)

### 3. Verify Installation

```bash
npm run dev
```

If successful, you should see:
```
✓ Ready in Xms
○ Local: http://localhost:3000
```

### 4. Open in Browser

Navigate to [http://localhost:3000](http://localhost:3000)

You should see:
- Dark themed UI
- Left sidebar with building blocks (Foundation, Wall, Door, etc.)
- Large 3D canvas in the center with grid
- Sky and lighting

## Expected Dependencies

After installation, your `node_modules` should include:

### Core 3D Libraries
- `three` - The 3D engine
- `@react-three/fiber` - React integration
- `@react-three/drei` - 3D helpers (OrbitControls, Sky, Grid, etc.)

### Framework
- `next` - Next.js framework
- `react` & `react-dom` - React library

### State & Utilities
- `zustand` - State management
- `lucide-react` - Icons
- `clsx` - Class utilities

### Styling
- `tailwindcss` - CSS framework
- `postcss` - CSS processor
- `autoprefixer` - CSS vendor prefixes

### TypeScript
- `typescript` - Language
- `@types/*` - Type definitions

## Troubleshooting

### Issue: "Module not found: Can't resolve 'three'"

**Solution**: Make sure you ran `npm install` after cleaning node_modules

```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: Canvas is black/not showing

**Causes**:
1. Three.js not installed correctly
2. Browser doesn't support WebGL

**Solution**:
1. Check browser console for errors
2. Verify WebGL support: visit https://get.webgl.org/
3. Try a different browser (Chrome recommended)

### Issue: "Cannot find module '@react-three/fiber'"

**Solution**: The new dependencies weren't installed

```bash
npm install @react-three/fiber @react-three/drei three
```

### Issue: TypeScript errors about Three.js types

**Solution**: Install types

```bash
npm install --save-dev @types/three
```

### Issue: Build fails with Next.js errors

**Solution**: Clear Next.js cache

```bash
rm -rf .next
npm run dev
```

## Verification Checklist

After installation, verify:

- [ ] `npm run dev` starts without errors
- [ ] Browser opens to http://localhost:3000
- [ ] 3D scene visible with grid
- [ ] Left sidebar shows building blocks
- [ ] Clicking blocks adds them to scene
- [ ] Can rotate camera with mouse
- [ ] No console errors

## System Requirements

### Minimum
- Node.js 18.0 or higher
- 2GB RAM
- Modern browser with WebGL support

### Recommended
- Node.js 20.0 or higher
- 4GB RAM
- Chrome or Firefox (latest)
- Discrete GPU for better performance

## Browser Compatibility

### Fully Supported
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 15+
- ✅ Edge 90+

### Partial Support
- ⚠️ Mobile browsers (limited 3D performance)
- ⚠️ Older browsers (may need polyfills)

### Not Supported
- ❌ Internet Explorer (no WebGL 2.0)

## Performance Notes

### Good Performance (60 FPS)
- Up to 100 building blocks
- Modern discrete GPU
- Desktop browser

### Acceptable Performance (30-60 FPS)
- 50-100 blocks
- Integrated GPU
- Laptop

### Lower Performance
- 100+ blocks may slow down
- Very old hardware
- Mobile devices

## Development Mode vs Production

### Development (`npm run dev`)
- Hot reload enabled
- Source maps for debugging
- Larger bundle size
- Slower initial load

### Production (`npm run build` then `npm start`)
- Optimized bundle
- Faster loading
- Smaller size
- Better performance

## Next Steps

After successful installation:

1. Read [QUICKSTART.md](./QUICKSTART.md) for a quick tutorial
2. Check [EXAMPLES.md](./EXAMPLES.md) for building ideas
3. Review [README.md](./README.md) for full documentation

## Support

If installation issues persist:

1. Check Node.js version: `node --version` (should be 18+)
2. Check npm version: `npm --version`
3. Clear npm cache: `npm cache clean --force`
4. Try with a fresh clone of the repository
5. Check for conflicting global packages

## Common npm Errors

### EACCES (Permission Denied)
```bash
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules
```

### ERESOLVE (Dependency Conflicts)
```bash
npm install --legacy-peer-deps
```

### Network Issues
```bash
npm config set registry https://registry.npmjs.org/
npm install
```

Happy building! 🏗️

