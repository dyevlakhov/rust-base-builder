# Materials and textures

## Tiers

Five tiers, defined once in `types/building-blocks.ts`. Health and cost are
approximations for planning, not extracted game data.

| Tier        | Health | Cost per piece               |
| ----------- | ------ | ---------------------------- |
| Twig        | 10     | 100 Wood                     |
| Wood        | 250    | 300 Wood                     |
| Stone       | 500    | 300 Stone                    |
| Sheet Metal | 1000   | 200 Metal Fragments + 25 HQM |
| Armored     | 2000   | 25 HQM + 5 Gears             |

Cost is structured data (`{ wood, stone, metalFragments, hqm, gears }`), not a
string. The header totals and the per-piece cost shown in the inspector are
computed from the same field, so they cannot disagree — earlier they were a
hardcoded `switch` next to a hand-written label, and the switch had quietly
dropped gears.

## Colours are albedo

Tier colours are **surface albedo**, sampled through sRGB decoding. They read
lighter than the flat colours you would pick for a UI swatch, because a lit
render darkens them again.

This is worth stating because the original palette was calibrated the other way
round. Its diffuse texture was left untagged, so three treated it as linear and
brightened it, and the colours had been chosen dark to compensate. Tagging the
map as sRGB — which is correct — made every piece nearly black, and the palette
had to be re-derived.

## Procedural textures

There are no texture assets in the repository. `utils/textureLoader.ts` looks for
files under `public/textures/` and generates a stand-in for anything missing, so
a fresh clone renders with material detail and no download step.

Each tier gets a hand-written pattern — bundled sticks, plank grain and growth
rings, concrete aggregate, corrugated sheet, riveted plate — plus matching
normal, roughness and metalness maps.

The generated diffuse applies its pattern **multiplicatively** around the tier
colour, within ±16%. Applying it as a large additive offset, as the first version
did, dragged the mean far below the tier colour and clipped whole regions to
black.

Generation walks 512 × 512 pixels four times, so it is cached per
tier/category pair. Before that cache existed it ran again for every single
block placed.

A material that gains a map after it was first compiled has to be flagged
`needsUpdate`, or three keeps the shader it already built and the texture is
silently never drawn. `BuildingBlockMesh` does this in an effect.

## Using real textures

Drop files into `public/textures/` named `{tier}_{category}_{map}.jpg`:

- tiers: `twig`, `wood`, `stone`, `metal`, `armored`
- categories: `foundation`, `wall`, `floor`
- maps: `diffuse`, `normal`, `roughness`, `metalness`

For example `stone_wall_diffuse.jpg`. Any file present is used; anything absent
falls back to the generated version, so partial sets are fine. Restart the dev
server after adding files.

Good CC0 sources: [Poly Haven](https://polyhaven.com/textures),
[ambientCG](https://ambientcg.com/), [FreePBR](https://freepbr.com/).

Do not ship extracted game assets. This is a fan tool and has no licence to
redistribute Facepunch's artwork.

## Lighting

`components/scene/SceneEnvironment.tsx` holds the whole rig: a key directional
light that casts shadows, low ambient and hemisphere fill, drei's procedural
`Sky`, and an environment map pre-filtered from three's `RoomEnvironment`.

Two constraints that are easy to trip over:

- `Sky` builds a dome at its `distance`, which must stay inside the camera's far
  plane. At the default 450000 with a far plane of 500 the sky is clipped away
  entirely and the background silently turns flat grey.
- `RoomEnvironment` is a bright studio box. Materials set `envMapIntensity` well
  below 1; at full strength its diffuse contribution washes every tier colour out
  to white.

Both of these are pure appearance, invisible to the test suite. See
[VISUAL_QA.md](./VISUAL_QA.md).
