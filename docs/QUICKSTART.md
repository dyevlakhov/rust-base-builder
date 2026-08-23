# Quick Start Guide - Rust Base Builder

Plan your Rust base in 3D before you build in-game!

## Installation

```bash
# Install dependencies
npm install

# Start the app
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🦀 Your First Rust Base

### Step 1: Choose Your Building Tier

In the left panel, you'll see 5 building tiers:

- **Twig** (brown) - 10 HP, cheap but weak
- **Wood** (dark brown) - 250 HP, early game
- **Stone** (gray) - 500 HP, solid mid-game
- **Metal** (blue) - 1000 HP, expensive but strong
- **Armored** (dark) - 2000 HP, highest protection

**Start with Wood** for planning!

### Step 2: Place Your First Foundation

1. Make sure "Snap to Grid (3x3)" is enabled
2. Expand "Foundations" category
3. Click "Square Foundation" 🟫
4. Your cursor changes to crosshair - you're in placement mode!
5. Click anywhere on the grid to place your foundation
6. The block snaps to the center of a grid cell

### Step 3: Build a 2x2 Base

1. With "Square Foundation" still selected, click 3 more times on the grid
2. Place them adjacent to the first foundation:
   - Click next to first (right side)
   - Click above first
   - Click diagonal
3. Blocks automatically snap to grid centers!
4. Press **ESC** or click "Cancel" to exit placement mode

You now have a 2x2 base (4 foundations in a square)!

### Step 4: Add Walls

1. Expand "Walls" category
2. Click "Wall" 🧱 to enter placement mode
3. Click around the perimeter of your foundations to place walls
4. **Tip**: Walls automatically position on edges
5. Press **ESC** when done placing walls

### Step 5: Add a Doorway

1. Click "Doorway" 🚪 to enter placement mode
2. Click where you want the entrance
3. Then select "Wooden Door" 🚪 and place it in the doorway

### Step 6: Add Second Floor

1. Click "Square Floor" 🟦 to enter placement mode
2. Click on the grid where your foundations are (it places above)
3. Place 4 floor pieces matching your foundation layout
4. Add walls and stairs to second floor!

### Step 7: Add a Roof

1. Click "Square Roof" 🔳
2. Click on top of your base to place roof pieces
3. Press **ESC** to exit placement mode

**Congrats!** You've built your first Rust base! 🎉

## New Click-to-Place System

The builder now uses a **click-to-place** system:

1. Click a block type in the left panel
2. Your cursor becomes a crosshair
3. A ghost preview shows where the block will appear
4. Click on the grid to place
5. Stay in placement mode to place multiple blocks
6. Press **ESC** to exit placement mode

## 5-Minute Tutorial: Secure Starter Base

### Minute 1: Foundation Layout (2x1 with Airlock)

1. Place 2 Square Foundations in a line
2. Place 1 Square Foundation in front for airlock
3. Position: (0,0,0), (3,0,0), (0,0,3)

### Minute 2: Main Walls

1. Set tier to **Stone** (better protection)
2. Add Full Walls around the perimeter
3. Leave two spots for doorways

### Minute 3: Airlock System

1. Add 2 Doorways (one outer, one inner)
2. This creates a double-door security system
3. If raiders get through one door, they still need the second!

### Minute 4: Interior & TC

1. Add Floor pieces for second level
2. Plan Tool Cupboard location (center of main room)
3. Add Stairs to access second floor

### Minute 5: Defenses

1. Add Windows for shooting angles
2. Add Roof for protection from above
3. **Upgrade to Metal** for TC room (select blocks, change tier)

## Understanding the Grid

**Rust uses a 3x3 meter grid system:**

- 1 Foundation = 3×3 meters = 1 grid square
- 1 Wall height = 3 meters
- Position X=3 = move 1 foundation right
- Position Z=3 = move 1 foundation forward
- Position Y=3 = move 1 floor up

## Building Tiers & Health

| Tier    | HP   | Cost               | When to Use             |
| ------- | ---- | ------------------ | ----------------------- |
| Twig    | 10   | 100 Wood           | Planning only           |
| Wood    | 250  | 300 Wood           | Early game, inner walls |
| Stone   | 500  | 300 Stone          | Main base structure     |
| Metal   | 1000 | 200 Metal + 25 HQM | Important rooms         |
| Armored | 2000 | 25 HQM + 5 Gears   | TC room, loot rooms     |

## Common Base Designs

### 2x2 Starter

- 4 Square Foundations
- Walls around perimeter
- One airlock entrance
- TC in center
- **Cost**: ~6,000 stone

### 2x2 with Honeycomb

- Inner 2x2
- Outer layer of triangle foundations
- External walls (honeycomb)
- Much harder to raid!
- **Cost**: ~15,000 stone

### 2x3 Main Base

- 6 Square Foundations
- Multiple rooms
- Separate loot room
- Double airlock
- Second floor with roof access

## Pro Tips

### Security

✅ **DO:**

- Use airlock (double doors)
- Place TC in center, protected
- Use triangle foundations to fill gaps
- Honeycomb high-value areas
- Upgrade TC room to Armored

❌ **DON'T:**

- Use single door entrance
- Place TC near outer walls
- Leave foundation gaps
- Make base all Twig/Wood
- Forget roof protection

### Resource Efficiency

1. **Start with Wood** tier for testing
2. **Upgrade to Stone** for main structure
3. **Use Metal** for key rooms only
4. **Armored** only for TC and loot
5. **Honeycomb** can stay Stone (just adds layers)

### Building Smart

- Plan raid paths (where raiders will go)
- Calculate resources before server wipe
- Share design with team
- Test multiple layouts
- Consider bunker designs (advanced)

## Controls Reference

### Camera

- **Left Click + Drag**: Rotate view
- **Right Click + Drag**: Pan camera
- **Mouse Wheel**: Zoom in/out

### Building

- **Click Block Type**: Add to base
- **Click 3D Block**: Select for editing
- **Position Inputs**: Move in 3m increments
- **Rotation**: Use 90° for walls

### View Modes

- **3D**: Default design view
- **TOP**: Floor plan view
- **FRONT**: Elevation view
- **SIDE**: Side profile

## Resource Calculator

Watch the header bar for real-time costs:

- 🪵 Wood total
- 🪨 Stone total
- ⚙️ Metal Fragments total
- 💎 HQM (High Quality Metal) total

## Common Questions

### How do I upgrade a block's tier?

1. Click the block in 3D scene
2. Right panel appears
3. Click on tier buttons (Twig → Wood → Stone → Metal → Armored)
4. Or click green arrow to upgrade one tier

### How do I place walls exactly?

- Enable "Snap to Grid (3x3)"
- Position walls in increments of 3
- For edges: X or Z at 0, 3, 6, 9, etc.
- Wall thickness is auto-set to 0.15m

### How do I rotate walls?

1. Select the wall
2. In right panel, find "Rotation"
3. Set Y rotation to 90° for perpendicular walls
4. 0° = facing Z direction, 90° = facing X direction

### Can I save my design?

Yes! Click "Export" button (top right) to save as JSON file.
Import feature coming soon!

## Next Steps

1. **Practice basic layouts** (2x1, 2x2, 2x3)
2. **Try honeycomb design** (add external layer)
3. **Build multi-story** (3+ floors)
4. **Experiment with bunkers** (advanced)
5. **Calculate raid cost** vs build cost
6. **Share with teammates** before wipe!

## Rust Base Building Resources

- [r/playrust](https://reddit.com/r/playrust) - Community tips
- YouTube: Search "Rust base building guide"
- Practice on build servers before wipe
- Test designs with teammates

## Keyboard Shortcuts (Coming Soon)

- `Delete` - Remove selected block
- `Ctrl+D` - Duplicate block
- `Ctrl+Z` - Undo
- `T` - Toggle tier selector
- Number keys `1-5` - Quick tier select

## Troubleshooting

### Blocks not snapping to grid

- Make sure "Snap to Grid (3x3)" is enabled
- Use position values in multiples of 3

### Can't see my base

- Zoom out with mouse wheel
- Switch to TOP view mode
- Check blocks aren't stacked exactly

### Walls not aligning

- Check Y rotation (0° or 90° usually)
- Ensure position matches grid (X,Z in multiples of 3)
- Wall thickness should be 0.15m

## Ready to Build!

You're now ready to plan epic Rust bases!

**Remember:**

- Start simple, expand later
- Security > Size
- Plan before you build in-game
- Share with your team
- Have fun! 🦀

---

**Good luck on your next wipe!** 🏗️💪
