# Textures

One folder per building tier, each with three 1K maps:

- `color.jpg` — base colour (sRGB)
- `normal.jpg` — OpenGL-convention normal map
- `arm.jpg` — packed ambient occlusion (R), roughness (G), metalness (B)

They are loaded by `render/materials.ts`, which also sets how many metres one
texture tile covers so each surface tiles at its real-world size.

## Sources

All maps are **CC0** photoscans from [Poly Haven](https://polyhaven.com), picked
to read like each tier in Rust, then recompressed:

| Tier    | Poly Haven asset                                                     | Authors                              |
| ------- | -------------------------------------------------------------------- | ------------------------------------ |
| twig    | [bark_willow_02](https://polyhaven.com/a/bark_willow_02)             | Charlotte Baglioni                   |
| wood    | [weathered_planks](https://polyhaven.com/a/weathered_planks)         | Dario Barresi, Dimitrios Savva       |
| stone   | [castle_wall_slates](https://polyhaven.com/a/castle_wall_slates)     | Rob Tuytel                           |
| metal   | [worn_corrugated_iron](https://polyhaven.com/a/worn_corrugated_iron) | Jenelle van Heerden, Dimitrios Savva |
| armored | [metal_plate_02](https://polyhaven.com/a/metal_plate_02)             | Rob Tuytel                           |

Do not add extracted game assets. This is a fan tool with no licence to
redistribute Facepunch's artwork.
