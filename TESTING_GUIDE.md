# Testing Guide - Rust Base Builder

This guide will help you verify that all building mechanics work correctly according to the Rust game system.

---

## 🚀 Quick Start Test

### Test 1: Basic 2x2 Base with Floor

**Goal**: Verify foundations, walls, and floors work correctly.

**Steps**:
1. Open the app in browser (`npm run dev`)
2. Select "Square Foundation" from the left palette
3. Click in the 3D scene to place first foundation
4. Place 3 more foundations in a 2x2 square pattern
5. Select "Full Wall" from palette
6. Place walls around the perimeter (you should need 12 walls for a 2x2 square)
7. Select "Square Floor" from palette
8. **CRITICAL TEST**: Click in the center of your walled area

**Expected Result**:
- Floor should appear **on top of the walls** at Y ≈ 3.4
- Floor should NOT appear on the foundation at Y ≈ 0.15
- Preview ghost should show the floor floating above walls before you click

**Debug Console Output**:
```
Placing floor-square at (4.5, 3.4, 4.5)
Found 4 blocks below with threshold 2.2
Floor detection: Found block wall-full at (3.0, 1.8, 4.5) distances: X=1.50, Z=0.00
Floor detection: Found block wall-full at (6.0, 1.8, 4.5) distances: X=1.50, Z=0.00
Floor detection: Found block wall-full at (4.5, 1.8, 3.0) distances: X=0.00, Z=1.50
Floor detection: Found block wall-full at (4.5, 1.8, 6.0) distances: X=0.00, Z=1.50
Highest block below: wall-full at Y=1.8, top at 3.3
Placing floor/roof on top at Y=3.4
```

**If Floor Places on Foundation (WRONG)**:
```
Placing floor-square at (4.5, 3.4, 4.5)
Found 0 blocks below with threshold 2.2  ← ERROR!
No blocks found below, using default Y=3.4
```
This means the detection is broken. Check threshold and <= operator.

---

## 🏗️ Comprehensive Test Suite

### Test 2: Wall Stacking (Half + Half = Full)

**Steps**:
1. Place 1 foundation
2. Select "Half Wall"
3. Place half wall on one edge
4. Select "Half Wall" again
5. Click on the same position to stack

**Expected**:
- First half wall: Y center ≈ 1.05 (height 1.5m)
- Second half wall: Y center ≈ 2.55 (height 1.5m)
- Combined height: 3.0m (same as full wall)

**Console Output**:
```
Placing wall-half at (0.0, 1.1, 1.5)
Found 1 blocks below with threshold 1.6
Highest block below: foundation-square at Y=0.2, top at 0.3
Placing wall/roof on top at Y=1.1

[Then for second half wall:]
Placing wall-half at (0.0, 2.6, 1.5)
Found 1 blocks below with threshold 1.6
Highest block below: wall-half at Y=1.1, top at 1.8
Placing wall/roof on top at Y=2.6
```

### Test 3: Low Wall Stacking (3× Low = Full)

**Steps**:
1. Place 1 foundation
2. Place 3 low walls on same position

**Expected**:
- First: Y ≈ 0.8 (0.3 + 0.5)
- Second: Y ≈ 1.8 (1.3 + 0.5)
- Third: Y ≈ 2.8 (2.3 + 0.5)
- Total height: 3.0m

### Test 4: Multi-Story Building

**Steps**:
1. Build ground floor:
   - 4 foundations in square
   - 8 walls around perimeter
   - 4 floor tiles on top
2. Build second floor:
   - 8 walls on the floor tiles
   - 4 floor tiles on top
3. Add roof on top

**Expected Heights**:
```
Ground level:
- Foundations: Y = 0.15
- Walls: Y = 1.8
- Floor 1: Y = 3.4

Second level:
- Walls: Y = 5.0 (3.5 + 1.5)
- Floor 2: Y = 6.6

Top:
- Roof: Y = 6.7
```

**Verify**:
- No gaps between levels
- Walls sit flush on floors
- Each level is exactly 3.0m high

### Test 5: Wall Auto-Rotation

**Steps**:
1. Place foundation at (1.5, 1.5)
2. Select "Full Wall"
3. Move mouse to north edge (Z=0) - wall preview should be horizontal (0°)
4. Move mouse to west edge (X=0) - wall preview should rotate vertical (90°)
5. Move mouse to south edge (Z=3) - wall preview horizontal again
6. Move mouse to east edge (X=3) - wall preview vertical again

**Expected**:
- North/South edges: Rotation Y = 0° (horizontal, facing Z direction)
- East/West edges: Rotation Y = 90° (vertical, facing X direction)
- Orange cone on preview points forward to show direction

### Test 6: Grid Snapping

**Steps**:
1. Place foundation anywhere
2. Check position in right panel

**Expected**:
- X and Z coordinates are always: 1.5, 4.5, 7.5, -1.5, -4.5, etc.
- Never: 2.3, 5.7, etc. (those would be off-grid)

**For walls**:
- X or Z coordinate is: 0, 3, 6, -3, -6, etc. (edges)
- Other coordinate is: 1.5, 4.5, etc. (center)

### Test 7: UI Click-Through Prevention

**Steps**:
1. Select "Square Foundation" to enter placement mode
2. Click on the left sidebar (Block Palette)
3. Click on the top header
4. Click on the right properties panel
5. Click on a button

**Expected**:
- NO foundations placed when clicking UI elements
- Cursor shows crosshair only over 3D canvas
- Only clicking in the 3D scene places blocks

### Test 8: Doorway and Door Placement

**Steps**:
1. Build a basic room (foundation + 4 walls)
2. Delete one wall
3. Place "Doorway" in that position
4. Select "Wooden Door"
5. Place door in the doorway

**Expected**:
- Doorway: Height 3.0m, Y center ≈ 1.8
- Door: Height 2.0m, Y center ≈ 1.4
- Door fits inside doorway
- Door sits on foundation

### Test 9: Roof Placement on Multi-Story

**Steps**:
1. Build 2-story building (test 4)
2. Select "Square Roof"
3. Place roof on top of second floor

**Expected**:
- Roof detects floor below (not foundation!)
- Roof Y ≈ 6.7 (sits on second floor at 6.5)
- Roof does NOT fall to Y=3.4 (first floor)

**Console Should Show**:
```
Placing roof-square at (4.5, 6.7, 4.5)
Found 1 blocks below with threshold 2.2
Floor detection: Found block floor-square at (4.5, 6.6, 4.5) distances: X=0.00, Z=0.00
Highest block below: floor-square at Y=6.6, top at 6.7
Placing floor/roof on top at Y=6.8
```

### Test 10: Negative Coordinates

**Steps**:
1. Rotate camera to see negative coordinates
2. Place foundations at X or Z < 0
3. Place walls on those foundations

**Expected**:
- Same snapping behavior
- Foundations at -1.5, -4.5, etc.
- Walls at -3, -6, etc.
- No bugs with negative numbers

---

## 🐛 Common Issues & How to Spot Them

### Issue: Floor on Foundation (Not Walls)

**Symptoms**:
- Floor appears at Y ≈ 0.3 instead of Y ≈ 3.4
- Floor clips through walls
- Console shows "Found 0 blocks below"

**Cause**: Detection threshold too small or wrong comparison operator

**How to Fix**:
```typescript
// Check Scene3D.tsx around line 80:
const threshold = isFloorOrRoof ? 2.2 : 1.6  // Must be 2.2+
const isAtSameXZ = xDist <= threshold && zDist <= threshold  // Must be <=
```

### Issue: Walls Float Above Foundation

**Symptoms**:
- Gap between foundation top (0.3) and wall bottom
- Wall Y center is not 1.8

**Cause**: Y-axis being snapped to grid

**How to Fix**:
```typescript
// Check useBuilderStore.ts snapPosition():
return [
  snapX(position.x),
  position.y,  // Must NOT be snapped!
  snapZ(position.z)
]
```

### Issue: Can't Stack Walls

**Symptoms**:
- Second wall places at same height as first
- Console shows "Found 0 blocks below"

**Cause**: Threshold too small for stacked detection

**How to Fix**:
```typescript
// Increase threshold and use <=
const threshold = 1.6
const isAtSameXZ = xDist <= threshold && zDist <= threshold
```

### Issue: Walls Snap to Centers

**Symptoms**:
- Wall X,Z positions are 1.5, 4.5, etc. (should be 0, 3, 6)
- Walls overlap foundations

**Cause**: Not checking block type before snapping

**How to Fix**:
```typescript
// In snapPosition():
if (blockType.includes('wall') || blockType.includes('doorway') || ...) {
  // Snap to edges
  return [snapToEdge(x), y, snapToCenter(z)]
} else {
  // Snap to centers
  return [snapToCenter(x), y, snapToCenter(z)]
}
```

---

## 📊 Debug Console Cheat Sheet

### Healthy Output (Floor Placement)
```
Placing floor-square at (1.5, 3.4, 1.5)
Found 4 blocks below with threshold 2.2
Floor detection: Found block wall-full at (0.0, 1.8, 1.5) distances: X=1.50, Z=0.00
Floor detection: Found block wall-full at (3.0, 1.8, 1.5) distances: X=1.50, Z=0.00
Floor detection: Found block wall-full at (1.5, 1.8, 0.0) distances: X=0.00, Z=1.50
Floor detection: Found block wall-full at (1.5, 1.8, 3.0) distances: X=0.00, Z=1.50
Highest block below: wall-full at Y=1.8, top at 3.3
Placing floor/roof on top at Y=3.4
```

### Unhealthy Output (Broken Detection)
```
Placing floor-square at (1.5, 3.4, 1.5)
Found 0 blocks below with threshold 1.5  ← WRONG!
No blocks found below, using default Y=3.4
```

### What to Look For:
1. **"Found X blocks below"**: Should be > 0 when blocks exist below
2. **Distances**: Should be ≤ threshold
3. **"Highest block below"**: Should be the tallest block in the area
4. **Final Y position**: Should be on top of highest block

---

## ✅ Success Criteria

Your building engine is working correctly if:

- [x] Foundations snap to grid centers (1.5, 4.5, 7.5...)
- [x] Walls snap to grid edges (0, 3, 6, 9...)
- [x] Walls auto-rotate based on edge placement
- [x] Walls sit flush on foundations (Y=1.8)
- [x] Floors detect walls below (threshold 2.2, operator <=)
- [x] Floors sit on top of walls (Y=3.4)
- [x] Can stack walls vertically (half + half = full)
- [x] Can build multi-story (2+ floors)
- [x] Roofs sit on top of highest floor
- [x] UI clicks don't place blocks
- [x] Negative coordinates work
- [x] Console logs show correct detection

---

## 🎮 Real-World Usage Test

### Build a 2-Story Base with Roof

**Time to complete**: ~2 minutes  
**Blocks needed**: 
- 4 foundations
- 12 ground floor walls
- 4 floor tiles
- 12 second floor walls  
- 4 roof tiles

**Steps**:
1. Layout 2×2 foundation grid
2. Build walls around perimeter (3 per side)
3. **TEST**: Place floor - should go on walls, not foundation
4. Build walls on second floor
5. **TEST**: Place roof - should go on second floor, not first
6. Rotate camera to verify no gaps
7. Check properties panel: heights should progress logically

**Expected Heights**:
- Foundation centers: 0.15
- Ground walls: 1.8
- First floor: 3.4
- Second walls: 5.0
- Second floor: 6.6
- Roof: 6.8

**Acceptance**: All pieces aligned with no gaps or overlaps

---

## 📈 Performance Test

### Stress Test: Large Base

**Goal**: Verify performance with many blocks

**Steps**:
1. Build 10×10 foundation grid (100 foundations)
2. Build perimeter walls (40 walls)
3. Add multiple floors
4. Check frame rate (should stay > 30fps)
5. Check placement responsiveness (preview should follow mouse smoothly)

**Benchmarks**:
- < 100 blocks: 60fps
- 100-500 blocks: 30-60fps
- 500-1000 blocks: 20-30fps
- \> 1000 blocks: May slow down (consider optimization)

---

## 🔍 Browser Console Tips

### Enable Verbose Logging
All placement operations log to console. Open dev tools (F12) to see:
- Block type being placed
- Calculated position
- Blocks detected below
- Final Y position

### Clear Console
Type `clear()` in console to remove clutter between tests

### Export Current Design
```javascript
copy(JSON.stringify(useBuilderStore.getState().blocks, null, 2))
```
Paste into a file to save your design

---

## 🚨 Report Issues

If tests fail, report with:
1. Which test failed
2. Expected vs actual result
3. Console output (copy/paste)
4. Screenshot if visual
5. Steps to reproduce

---

**Happy Building!** 🦀🏗️✨

Remember: The goal is to match Rust's building system as closely as possible. Every snap, rotation, and stack should feel natural to Rust players.

