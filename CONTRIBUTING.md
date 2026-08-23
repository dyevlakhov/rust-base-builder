# Contributing

Contributions are welcome. This is a small project, so the process is short.

## Getting set up

Requires Node 20.9 or newer.

```bash
git clone https://github.com/<your-fork>/rust-base-builder.git
cd rust-base-builder
npm install
npm run dev
```

## Before you open a pull request

Run what CI runs:

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```

If you touched anything in `components/scene/`, `utils/geometry.ts`,
`utils/textureLoader.ts` or the lighting, also work through
[docs/VISUAL_QA.md](./docs/VISUAL_QA.md). The test suite cannot see the render,
and the rendering bugs this project has had all built and typechecked cleanly.

## What to test

Grid maths, placement rules and store behaviour are pure functions and belong in
`tests/`. Rendering does not: a test asserting that a mesh exists proves nothing
useful. Put that coverage in the visual checklist instead.

## Style

- Prettier and ESLint are the arbiters; run `npm run format`.
- Prefer deriving values over restating them. Block dimensions live in exactly
  one place, `types/building-blocks.ts`, and everything else reads from there —
  the two tables that used to exist had already drifted apart by 5 cm.
- Classify block types by their template's `category`, never by matching a
  substring of the type name.
- Keep the placement rules inside `resolvePlacement`. The preview, the click
  handler and the store must not each work out placement for themselves.

## Ideas

- Importing an exported design
- Undo / redo
- Roofs, stairs and doors
- Base templates
- A raid-cost calculator

## Reporting a bug

Say what you did, what you expected and what happened. For anything visual, a
screenshot is worth far more than a description, and please include your browser
and GPU — several past issues were specific to one WebGL implementation.
