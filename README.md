# Rust Base Builder

A 3D planner for bases in the survival game **Rust**. Lay out foundations, walls
and floors on the game's 3 m building grid and see what the design costs before
you spend anything in-game.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![Three.js](https://img.shields.io/badge/Three.js-0.185-orange)
![React Three Fiber](https://img.shields.io/badge/R3F-9-purple)
![License](https://img.shields.io/badge/license-MIT-green)

## What it does

- **Eleven building pieces** — square and triangle foundations, four wall
  variants plus doorway, window and wall frame, square and triangle floors, and
  a floor frame.
- **Grid snapping that mirrors the game.** Foundations and floors snap to cell
  centres, walls to cell edges and auto-rotate to run along them, triangles
  attach outwards from the edge of a square piece.
- **Automatic stacking.** Pieces rest on whatever is underneath, so walls sit on
  foundations and floors sit on walls without any height fiddling.
- **Collision checking**, previewed live: the ghost turns red where a piece will
  not fit.
- **Five tiers** — Twig, Wood, Stone, Sheet Metal, Armored — each with its own
  material, health and cost, switchable per piece after placing.
- **Running resource cost** for the whole base, in the header.
- **Four camera presets** — 3D, top, front and side.
- **Your design is saved** in the browser and restored on reload.
- **Export to JSON.**

## Getting started

Requires Node 20 or newer.

```bash
npm install
npm run dev
```

Then open <http://localhost:3000>.

```bash
npm run build       # production build
npm test            # unit tests
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm run format      # prettier --write
```

## Using it

1. Pick a **tier** at the top of the left panel. New pieces are placed at that tier.
2. Pick a **piece** from the palette. The cursor turns into a crosshair and a
   ghost follows it.
3. **Click the ground** to place. Red means it will not fit there.
4. **Escape** cancels placement.
5. **Click a piece** to select it — the right panel shows its stats and lets you
   change its tier, nudge its position, duplicate it or demolish it.
6. **Delete** demolishes the selected piece.

| Input              | Action                      |
| ------------------ | --------------------------- |
| Left drag          | Orbit                       |
| Right drag         | Pan                         |
| Scroll             | Zoom                        |
| Arrow keys         | Move the camera             |
| Page Up / Down     | Raise / lower the camera    |
| Escape             | Cancel placement            |
| Delete / Backspace | Demolish the selected piece |

## Grid

One cell is 3 × 3 m, matching a square foundation. A full wall is 3 m tall. The
exact numbers and the rules built on them are in
[docs/BUILDING_ENGINE.md](./docs/BUILDING_ENGINE.md).

## Textures

No texture assets ship with the repository — every material is generated
procedurally at runtime, so a fresh clone renders with surface detail and no
download step. Real PBR maps can be dropped into `public/textures/` and are
picked up automatically; see [docs/MATERIALS.md](./docs/MATERIALS.md).

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Three.js · React Three Fiber 9 ·
drei · Zustand · Tailwind CSS 4 · Vitest

## Documentation

- [Architecture](./docs/ARCHITECTURE.md) — layout, data flow, state, rendering
- [Building engine](./docs/BUILDING_ENGINE.md) — dimensions, snapping, stacking, collision
- [Materials](./docs/MATERIALS.md) — tiers, procedural textures, lighting
- [Visual QA](./docs/VISUAL_QA.md) — the manual checklist for anything the tests cannot see

## Not implemented

Listed here rather than in a features section, because the two are easy to
confuse:

- Importing an exported design
- Undo / redo
- Roofs, stairs, doors and deployables
- Any damage or raid simulation — health is a tier property, nothing reduces it

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Disclaimer

A fan-made planning tool, not affiliated with Facepunch Studios. Dimensions,
health values and costs are approximations for planning and are not extracted
game data.

## License

[MIT](./LICENSE)
