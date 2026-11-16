# Materials and textures

## Tiers

Defined in `engine/catalog.ts`. Figures follow the game's wiki and are meant for
planning; they are not extracted game data.

| Tier        | Health | Full piece          | Triangle / half / low wall |
| ----------- | ------ | ------------------- | -------------------------- |
| Twig        | 10     | 50 Wood             | 25 Wood                    |
| Wood        | 250    | 200 Wood            | 100 Wood                   |
| Stone       | 500    | 300 Stone           | 150 Stone                  |
| Sheet Metal | 1000   | 200 Metal Fragments | 100 Metal Fragments        |
| Armored     | 2000   | 25 HQM              | 13 HQM                     |

`pieceCost(type, tier)` multiplies the tier cost by the piece's `costFactor`
and rounds up. The header totals and the inspector use the same function.

## Textures

Each tier has three 1K maps in `public/textures/<tier>/`: colour, an OpenGL
normal map, and a packed ARM map (ambient occlusion, roughness, metalness). They
are CC0 photoscans from Poly Haven, chosen to read like each tier in the game;
the sources are listed in [public/textures/README.md](../public/textures/README.md).
Game assets are never used.

`render/materials.ts` builds one `MeshStandardMaterial` per tier:

- the ARM map feeds `aoMap`, `roughnessMap` and `metalnessMap` at once;
- `repeat` is set from the texture's real-world size, and piece geometry has UVs
  in metres, so a texture tiles at the same scale on a 3 m wall, a 0.24 m wall
  edge and a 1 m foundation side;
- a tint per tier adjusts the photo to the game's look (sheet metal is darkened,
  for instance, because a bright albedo with metalness reflects the environment
  as near-white);
- until the maps load, pieces are drawn in a flat colour close to the
  texture's average.

## Lighting

One shadow-casting directional light, low ambient and hemisphere fill, drei's
procedural `Sky`, and image-based lighting from three's built-in
`RoomEnvironment`, pre-filtered once with `PMREMGenerator`. Nothing is fetched
from a third-party CDN at runtime.
