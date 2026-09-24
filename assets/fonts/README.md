# Fonts for generated images

The WhatsApp preview image (`app/c/[eventSlug]/[guestToken]/opengraph-image.tsx`) is drawn with
`next/og`, which cannot use `next/font` and only reads TTF, OTF or WOFF files. These are the theme
fonts' Latin and Latin Extended subsets, taken from the Fontsource npm packages (version 5.3.0):

| File                                  | Font                |
| ------------------------------------- | ------------------- |
| `ephesis-latin(-ext)-400-normal`      | Ephesis Regular     |
| `cormorant-sc-latin(-ext)-500-normal` | Cormorant SC Medium |
| `cormorant-sc-latin(-ext)-700-normal` | Cormorant SC Bold   |

Both fonts are licensed under the SIL Open Font License 1.1 (`OFL-*.txt`), which allows bundling
them with the application.
