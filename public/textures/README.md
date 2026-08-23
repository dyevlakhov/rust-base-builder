# Textures

This directory is empty by design. Every material is generated procedurally at
runtime, so the app renders with surface detail without shipping any assets.

To use real PBR maps instead, drop files in here named
`{tier}_{category}_{map}.jpg`:

- **tiers** — `twig`, `wood`, `stone`, `metal`, `armored`
- **categories** — `foundation`, `wall`, `floor`
- **maps** — `diffuse`, `normal`, `roughness`, `metalness`

For example, `stone_wall_diffuse.jpg`.

Any file present is used; anything missing falls back to the generated version,
so a partial set is fine. Restart the dev server after adding files.

Full notes, including where to find CC0 sources, are in
[docs/MATERIALS.md](../../docs/MATERIALS.md).

Do not add extracted game assets. This is a fan tool with no licence to
redistribute Facepunch's artwork.
