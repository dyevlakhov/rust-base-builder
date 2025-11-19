# 🦀 Rust Base Builder

A 3D web application for planning and designing bases in the survival game **Rust**. Visualize your base layout with accurate building blocks, foundations, walls, and defenses before spending resources in-game!

![Next.js](https://img.shields.io/badge/Next.js-14.0-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![Three.js](https://img.shields.io/badge/Three.js-0.160-orange)
![React Three Fiber](https://img.shields.io/badge/R3F-8.15-purple)

## ✨ Features

- **Authentic Rust Building System**: All building blocks match the game's actual system
- **3x3 Foundation Grid**: Accurate grid matching Rust's building mechanics
- **All Building Tiers**: Twig, Wood, Stone, Sheet Metal, and Armored
- **Complete Block Library**: Foundations, walls, floors, roofs, stairs, and doors
- **Interactive 3D Preview**: Rotate, pan, and zoom to view your base from any angle
- **Building Piece Variants**: Full walls, half walls, low walls, doorways, windows, frames
- **Resource Calculator**: See total resources needed for your base
- **Multiple View Modes**: 3D, top-down, front, and side views
- **Export/Import**: Save and share your base designs

## 🎮 Rust Game Building Blocks

### Foundations
- **Square Foundation** 🟫 - Standard 3x3 foundation
- **Triangle Foundation** 🔺 - Triangular foundation for corners

### Walls
- **Full Wall** 🧱 - Standard full-height wall
- **Half Wall** 📦 - Half-height wall (mid-tier)
- **Low Wall** ▬ - Low wall for protection
- **Doorway** 🚪 - Wall with door frame
- **Window** 🪟 - Wall with window embrasure
- **Wall Frame** ▢ - Open wall frame

### Floors & Ceilings
- **Square Floor** 🟦 - Standard square floor
- **Triangle Floor** 🔷 - Triangular floor piece
- **Floor Frame** ⊞ - Floor grate (see-through)

### Roofs
- **Square Roof** 🔳 - Flat square roof
- **Triangle Roof** 🔼 - Sloped triangular roof

### Stairs
- **L-Shaped Stairs** 🪜 - L-shaped staircase
- **U-Shaped Stairs** ⛏️ - U-shaped staircase

### Doors
- **Wooden Door** 🚪 - Basic wooden door (200 HP)
- **Sheet Metal Door** 🔒 - Metal door (250 HP)
- **Armored Door** 🛡️ - Armored door (800 HP)
- **Garage Door** 🚧 - Large garage door

## 🏗️ Building Tiers

Each building piece can be upgraded through 5 tiers:

1. **Twig** (10 HP) - 100 Wood
2. **Wood** (250 HP) - 300 Wood
3. **Stone** (500 HP) - 300 Stone
4. **Sheet Metal** (1000 HP) - 200 Metal Frags + 25 HQM
5. **Armored** (2000 HP) - 25 HQM + 5 Gears

## 🚀 Getting Started

### Installation

```bash
# Clean old dependencies (if upgrading)
rm -rf node_modules package-lock.json

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🎯 How to Use

### Planning Your Base

1. **Select Building Tier**: Choose from Twig, Wood, Stone, Metal, or Armored in the left panel
2. **Add Building Pieces**: Click on blocks to add them to your base
3. **Position Accurately**: Blocks snap to the 3x3 grid (1 foundation = 3x3m)
4. **Build Vertically**: Stack floors to create multi-story bases
5. **Add Defenses**: Place walls, doorways, and windows strategically

### Building Workflow

1. Start with **foundations** - place square or triangle foundations
2. Add **walls** around the perimeter
3. Place **doorways** for entrances (remember to add actual doors!)
4. Add **windows** for shooting angles
5. Build **floors** for additional levels
6. Add **stairs** to connect levels
7. Top with **roofs** for protection
8. Upgrade tiers for better defense

### Controls

- **Left Click + Drag**: Rotate camera around your base
- **Right Click + Drag**: Pan the view
- **Mouse Wheel**: Zoom in/out
- **Click on Block**: Select to edit properties
- **Select Tier**: Choose building tier before placing

### Editing Blocks

Click any block to:
- Change building tier (upgrade/downgrade)
- Adjust position (3x3 grid units)
- Rotate (90° increments recommended)
- Duplicate for repeated patterns
- Demolish to remove

## 📐 Grid System

The grid follows Rust's building system:
- **1 Grid Square = 3x3 meters**
- **1 Foundation = 3x3 meters**
- **1 Wall Height = 3 meters**
- **Snap to Grid** ensures accurate placement

## 💡 Base Building Tips

### For Beginners
- Start with a 2x2 foundation layout (4 square foundations)
- Use airlock design (2 doors in sequence) for security
- Place TC (Tool Cupboard) in center, protected
- Add triangle foundations to fill gaps

### For Advanced Builders
- Plan loot room locations in core
- Calculate raid cost vs build cost
- Use honeycomb (external shell) for protection
- Consider roof access and drop-down defenses
- Plan for bunker design

### Resource Optimization
- Start with Wood, upgrade to Stone
- Prioritize TC area with Armored
- Use Metal for important rooms
- Honeycomb can stay lower tier (soaks raids)

## 📊 Resource Calculator

The app automatically calculates total resources needed:
- 🪵 **Wood**: Total wood required
- 🪨 **Stone**: Total stone required
- ⚙️ **Metal Fragments**: Total metal frags
- 💎 **HQM**: High Quality Metal required

## 🎨 View Modes

- **3D View**: Free rotation for overall design
- **Top View**: Bird's eye view for floor plans
- **Front View**: Check wall alignment
- **Side View**: Verify vertical structure

## 📁 Export & Import

### Export
Click "Export" to save your base design as JSON. Share with teammates or save for later!

### Import (Coming Soon)
Load previously saved designs to continue editing.

## 🎮 Use Cases

- **Pre-Wipe Planning**: Design your base before server wipe
- **Team Coordination**: Share base designs with teammates
- **Resource Planning**: Calculate exact resources needed
- **Raid Defense**: Plan choke points and defenses
- **Practice Building**: Learn building techniques offline

## 🛠️ Tech Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Three.js** - 3D graphics engine
- **React Three Fiber** - React renderer for Three.js
- **@react-three/drei** - 3D helpers
- **Zustand** - State management
- **Tailwind CSS** - Styling

## 📝 Roadmap

- [ ] Import saved designs
- [ ] Pre-built base templates
- [ ] Raid cost calculator
- [ ] Deployables (furnaces, boxes, etc.)
- [ ] Electricity components
- [ ] Auto-turret placement
- [ ] Line of sight visualization
- [ ] Share designs online
- [ ] Mobile support

## 🤝 Contributing

Contributions welcome! This tool is for the Rust community.

Ideas for contributions:
- More building block types
- Trap designs
- Base templates
- Raid path visualization
- Building cost optimizer

## ⚠️ Disclaimer

This is a fan-made tool and is not affiliated with Facepunch Studios or the game Rust. Building dimensions and mechanics are approximated for planning purposes.

## 📄 License

MIT License - Free to use for the Rust community!

## 🙏 Acknowledgments

- **Facepunch Studios** for creating Rust
- **Rust Community** for building strategies and feedback
- Built with love for Rust players 🦀

---

**Plan smarter. Build better. Survive longer.** 🏗️🦀
