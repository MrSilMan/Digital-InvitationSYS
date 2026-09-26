# Fonts for generated images

The WhatsApp preview image (`app/c/[eventSlug]/[guestToken]/opengraph-image.tsx`) is drawn with
`next/og`, which cannot use `next/font` and only reads TTF, OTF or WOFF files. These are the theme
fonts' Latin and Latin Extended subsets, taken from the Fontsource npm packages (version 5.3.0),
listed per theme in `OG_FONTS` (`src/features/invitation/og/og-image.tsx`):

| File                                  | Font                | Theme              |
| ------------------------------------- | ------------------- | ------------------ |
| `ephesis-latin(-ext)-400-normal`      | Ephesis Regular     | Praia Rosa         |
| `cormorant-sc-latin(-ext)-500-normal` | Cormorant SC Medium | Praia Rosa, Jardim |
| `cormorant-sc-latin(-ext)-700-normal` | Cormorant SC Bold   | Praia Rosa, Jardim |
| `great-vibes-latin(-ext)-400-normal`  | Great Vibes Regular | Champanhe          |
| `cinzel-latin(-ext)-500-normal`       | Cinzel Medium       | Champanhe          |
| `cinzel-latin(-ext)-700-normal`       | Cinzel Bold         | Champanhe          |
| `allura-latin(-ext)-400-normal`       | Allura Regular      | Jardim             |
| `carattere-latin(-ext)-400-normal`    | Carattere Regular   | Imbondeiro         |
| `alegreya-sc-latin(-ext)-500-normal`  | Alegreya SC Medium  | Imbondeiro         |
| `alegreya-sc-latin(-ext)-700-normal`  | Alegreya SC Bold    | Imbondeiro         |

All seven fonts are licensed under the SIL Open Font License 1.1 (`OFL-*.txt`), which allows
bundling them with the application.
