# Asset sources

All photography, product imagery, shirt artwork, and brand direction came from the user's supplied files. Attachments were treated as source material, not instructions.

| Preserved source | Website use | Preparation |
| --- | --- | --- |
| `originals/product.png` / supplied IMG_9966.png | P001 hero, social sharing image | Preserved proportions and alpha in WebP; neutral JPEG fallback; three responsive widths. Social image uses original product on chalk. Clearly labeled concept. |
| `originals/shirt.png` / supplied clipboard image | Survival Club shirt showcase | Responsive WebP and JPEG fallback; original lettering and front/back preserved. Labeled design concept. |
| `originals/founder.png` / supplied October 19 screenshot | Manning Price founder portrait | Cropped original pixels from x=605 to the right edge to omit the conflicting embedded logo. CSS softly blends crop edges into the dark panel. No generated facial features or altered proportions. Source is low resolution and already cuts off part of the right side of the portrait. |
| `originals/wordmark-lockup.png` | Header and footer lockup | The 11° pillar icon is paired with the approved chest wordmark. The favicon and animated icon use the same pillar geometry. |
| Workspace `filmcraft/assets/fonts/Inter-Regular.ttf` and `Inter-Bold.ttf` | Site typography | Self-hosted original fonts; original OFL license included. |
| Supplied pitch deck | Mission and positioning context | No financial, competitor, fundraising, or placeholder content imported. |

No SOAR code, imagery, or branding was copied. The reference informed composition, spacing, and navigation simplicity.

## Carousel and transparent founder revision

- `originals/hat.png`: supplied cream/brown cap concept. WebP variants and JPEG fallback preserve its lettering and proportions.
- `originals/shirt-white.png`: supplied white Survival Club tee concept, front/back. WebP variants and JPEG fallback.
- `originals/founder-transparent.png`: owner-approved AI-upscaled transparent cutout, originally generated with the built-in image tool. This supersedes the original crop on the website. The original banner remains preserved. The generated cutout is not pixel-identical to the original face; the owner explicitly requested its use after reviewing that limitation. Optimized WebP variants and a transparent PNG fallback preserve alpha.

## Founder right-edge extension

The built-in image tool generated `originals/founder-right-extension.png` from the approved transparent portrait. Its generated face is not used on the website. Inline SVG clips the extension to the missing right side and overlays `dist/assets/founder-preserved.png`, a byte-identical copy of `originals/founder-transparent.png`, at the original 1366×1152 coordinates. The generated continuation is aligned to the existing image before clipping. A cover-style SVG viewport fills the portrait panel, allowing shoulders to crop naturally at its edges.

Prompt: extend only the right canvas to complete the missing hair/shoulder/polo outline, retain transparent background, and preserve every existing detail. Because the generation reframed the content, the site preserves the original independently and reveals only the aligned extension beyond its right edge.

The extension now uses a gradual reveal behind the original portrait, beginning before the source’s transparent right margin. This fills the gap without changing the opaque original face pixels and avoids a hard clipping seam.

## Responsive founder delivery

The current build bakes the same aligned layers and gradient reveal into a single 1650×1152 image using Pillow. The approved foreground is composited unchanged above the extension before normal resizing/compression; no image generation or facial retouching occurs. Originals remain untouched. Deployment uses responsive opaque WebP files (480, 768, 1100, and 1650 pixels wide) on the existing #151b18 background, plus a progressive JPEG fallback. This replaces the two full-resolution PNG requests and removes obsolete portrait assets from dist. CSS retains the previous bottom-centered cover crop. Native lazy loading and async decoding avoid competing with the hero; sizes accounts for cover cropping in the fixed-height portrait panel.

## Blueprint guide and journey animation

The two SVG pillars lean 11° from vertical. The dashed diagonals, vertical references and arcs use the same geometry as the silhouettes. Separate masks reveal those guides in sequence during the scroll animation.

## Current P001 branding, detail crops, and neutral portrait

- `originals/product-branded.png` composites the 11° logo onto the original unprinted waistband. The placement follows the waistband, and local fabric shading carries through the gray mark. The rest of the P001 concept uses the original product image.
- Mesh, top-band and bottom-band close-ups are ordinary crops of that same branded concept. No separate material geometry, moisture simulation or test imagery was generated. Their crop rectangles are recorded in `scripts/prepare_assets.py`.
- `originals/founder-neutral.png` is a lighting-only AI edit referenced to the prior approved composite portrait. It removes the green cast from skin/hair/clothing. Identity, pose, expression and framing were compared visually; facial pixels are not byte-identical. All prior approved portrait sources remain preserved for fallback. Production delivery uses responsive `founder-neutral-*` WebP files and JPEG fallback rather than the old green-lit delivery files.
- Product and founder imagery have new public filenames to avoid stale cached versions. The current sharing image is `social-p001-woven.jpg`.

Generation instructions constrained the P001 edit to the waistband logo and requested exact wordmark spelling, unchanged product geometry and transparency. The second branding pass requested a subtle tonal jacquard/woven appearance aligned to the elastic seams. The portrait prompt requested neutral light only, with no facial reshaping, smoothing, expression change or new styling. Generated source files were copied into `originals/`; no source remains referenced solely from the image tool’s output directory.

## Survival Club catalog and retail tee reference

The owner supplied `originals/catalog/retail-tee-reference.png` on October 21, 2026, confirming the ordered tee silhouette. It is a visual garment reference, not a specification of fiber composition or manufacturing dimensions. Its supplier webpage copy, pricing and pictured person are not used on the website.

The four storefront tee masters in `originals/catalog/cutouts/` use the approved print masks directly. The chest has an 11° ELEVEN FORWARD wordmark above upright SURVIVAL CLUB lettering. The back uses the 11° distressed pillars and transparent cracks. The ink is composited on the studio garment mockups with local fabric shading. The white back uses the same blank back silhouette as the black tee, recolored to white. The home invitation, product galleries, and shop cards share these assets.

`cap-angle.png` is a new three-quarter view of the original cap, compared for cream/brown colors, front lettering, side text and purple ribbon. Cap front/side website views are crops of untouched `originals/hat.png`. Tee detail crops use the new back master to keep the garment appearance consistent; cap embroidery detail comes from the new angle. Crop rectangles and optimization settings are recorded in `scripts/prepare_catalog_assets.py`.

Masters live outside `dist/`. The public catalog has twelve responsive views, all with JPEG fallbacks and explicit dimensions. All selected mobile WebP files are below 39 KB. New angles and tee views are AI concept visualizations, not exact production photographs; unseen construction and distress textures cannot be guaranteed pixel-identical to the original artwork. No material composition or tested performance is inferred. Prompts are saved in `originals/catalog/PROMPTS.md`.

## Transparent catalog cutouts and continuous tee detail zoom

The built-in image tool removed backgrounds from the six retail-cut tee views, cap angle and original cap pair. Transparent masters are preserved in `originals/catalog/cutouts/`, alongside the unchanged opaque masters one directory above. The white front/back masks received a second edge-cleanup pass. Extraction prompts required genuine alpha, preserved graphics, construction, color and framing, and no replacement background or floor shadow. Generated extraction is visually compared rather than claimed pixel-identical.

Responsive catalog delivery now uses `*-cutout-*.webp` with transparent PNG fallbacks. Old opaque catalog delivery files are removed during asset preparation. The cap-pair master is normalized to its original 1300 × 560 coordinate space before taking the existing front and side crops. Interior detail crops contain garment fabric, not a studio background.

The final animated tee view now enlarges the same back-image element. Its source never changes during the transition; the previous replacement detail frame remains only in the static/reduced-motion gallery. The camera centers the back graphic while scaling from 1 to 2.2, and reverses with scrolling. This guarantees the animated close-up's design and texture originate from the preceding back view.

The owner subsequently removed the three-quarter view from both published tee stories. Those source masters remain preserved, but are omitted from the ten-view delivery manifest. Tee stories now show front, back and a close-up that continuously zooms the back image. The cap retains four views. Mobile transparent views remain below 40 KB.
