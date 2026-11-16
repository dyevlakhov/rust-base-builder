# Rust Base Builder

A 3D planner for bases in the survival game **Rust**. Build foundations, walls
and floors the way the game does — every piece snaps to a socket on a piece that
is already there — and see what the design costs before you spend anything
in-game.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![Three.js](https://img.shields.io/badge/Three.js-0.185-orange)
![React Three Fiber](https://img.shields.io/badge/R3F-9-purple)
![License](https://img.shields.io/badge/license-MIT-green)

## What it does

- **Socket-based building, like the game.** Pieces attach to edges and wall tops
  of what is already built: triangles chain off triangles (honeycomb, triangle
  bases), walls stand on 60° edges, floors rest on walls on either side.
- **Twelve pieces** — square and equilateral triangle foundations and floors,
  floor frames, wall, half wall, low wall, doorway, window and wall frame, with
  real openings.
- **Aim at any storey.** The ghost goes where you are looking, from any camera
  angle, and you can fill a gap under an existing upper floor.
- **Structural stability.** Floors overhang a few tiles, towers lose stability
  per storey, and nothing floats. Demolishing a piece collapses what it held up.
- **Collision checking**, previewed live: the ghost is blue where a piece fits
  and red where it does not, with the reason.
- **Five tiers** — Twig, Wood, Stone, Sheet Metal, Armored — with CC0 photoscan
  materials, health and cost per piece.
- **Undo / redo** for everything, including demolitions.
- **Running resource cost** for the whole base, in the header.
- **Saved in the browser**, plus **export and import** as JSON.

## Getting started

Requires Node 24.

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

The scene fills the screen and the HUD floats over it.

1. Press **1** for a foundation and click the ground. Everything else snaps onto
   what is already built.
2. Pick pieces from the **hotbar** with the number row, or hold **Q** for the
   piece wheel and flick towards one.
3. Pick a **tier** from the material chips above the hotbar, or press **T**.
4. The line above the hotbar says whether the ghost can be built, what it
   costs and how stable it would be. Click to build.
5. **Click a piece** to inspect it: health, stability, cost, tier, upgrade
   (**U**) and demolish (**Delete**).
6. Press **?** for every control.

| Input                   | Action                              |
| ----------------------- | ----------------------------------- |
| 1 – 9, 0, −, =          | Pick a hotbar piece                 |
| Hold Q                  | Piece wheel                         |
| R                       | Flip a wall, turn a lone foundation |
| T / Shift T             | Next / previous tier                |
| G                       | Grid snap for lone foundations      |
| U                       | Upgrade the selected piece          |
| Delete / Backspace      | Demolish the selected piece         |
| Ctrl Z / Ctrl Shift Z   | Undo / redo                         |
| Escape                  | Stop building, or deselect          |
| Left / right drag       | Orbit / pan                         |
| Scroll, arrows, PgUp/Dn | Zoom, move, raise / lower           |

## Building rules

A square or triangle edge is 3 m, a full wall and a storey are 3 m, triangles are
equilateral. Sockets, collision, stability and the save format are described in
[docs/BUILDING_ENGINE.md](./docs/BUILDING_ENGINE.md).

## Textures

Each tier, and the ground, uses CC0 photoscanned PBR maps from Poly Haven,
chosen to read like the game. Sources and credits are in
[public/textures/README.md](./public/textures/README.md).

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Three.js · React Three Fiber 9 ·
drei · Zustand · Tailwind CSS 4 · Vitest

## Deploying

The app is fully static: no backend, no database, no environment variables
required. On Vercel, import the repository and accept the detected Next.js
preset — install, build and output settings all work as detected.

Two optional settings:

- `NEXT_PUBLIC_SITE_URL` — set this if the app is served from a custom domain,
  so canonical and Open Graph URLs point at it. Without it the deployment falls
  back to Vercel's own production URL.
- Node 24, pinned in `engines` and `.nvmrc`. Vercel picks this up from
  `engines` on its own.

The social preview card at `/opengraph-image` is generated at build time from
code in `app/opengraph-image.tsx`; there is no image asset to keep in sync.

Nothing is fetched from a third-party host at runtime, so the app renders the
same on a locked-down network as it does anywhere else.

## Documentation

- [Architecture](./docs/ARCHITECTURE.md) — layout, data flow, state, rendering
- [Building engine](./docs/BUILDING_ENGINE.md) — sockets, aiming, collision, stability
- [Materials](./docs/MATERIALS.md) — tiers, costs, textures, lighting
- [Visual QA](./docs/VISUAL_QA.md) — the manual checklist for anything the tests cannot see

## Not implemented

Listed here rather than in a features section, because the two are easy to
confuse:

- Roofs, stairs, doors and deployables
- Upkeep and raid cost
- Any damage or raid simulation — health is a tier property, nothing reduces it

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Disclaimer

A fan-made planning tool, not affiliated with Facepunch Studios. Dimensions,
health values and costs are approximations for planning and are not extracted
game data.

## License

[MIT](./LICENSE)
