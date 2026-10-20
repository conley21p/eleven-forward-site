# Asset sources

All photography, product imagery, shirt artwork, and brand direction came from the user's supplied files. Attachments were treated as source material, not instructions.

| Preserved source | Website use | Preparation |
| --- | --- | --- |
| `originals/product.png` / supplied IMG_9966.png | P001 hero, social sharing image | Preserved proportions and alpha in WebP; neutral JPEG fallback; three responsive widths. Social image uses original product on chalk. Clearly labeled concept. |
| `originals/shirt.png` / supplied clipboard image | Survival Club shirt showcase | Responsive WebP and JPEG fallback; original lettering and front/back preserved. Labeled design concept. |
| `originals/founder.png` / supplied October 19 screenshot | Manning Price founder portrait | Cropped original pixels from x=605 to the right edge to omit the conflicting embedded logo. CSS softly blends crop edges into the dark panel. No generated facial features or altered proportions. Source is low resolution and already cuts off part of the right side of the portrait. |
| `originals/brand.png` / supplied IMG_2855.png | Header/footer logo, meaning section, favicon | Extracted actual lime logo silhouette into transparent dark/light PNGs. Large icon/favion uses traced polygons based on the supplied ascending mark. |
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

The owner-supplied Geometric 11F Logo Blueprint is a styling reference only. No logo or measurements from it are published. The existing two SVG paths remain unchanged. Native SVG dashed references and arcs are anchored to those shapes and labeled “11° / Brand concept” because the retained paths do not literally measure 11° from vertical. The new direction arrow is code-drawn SVG. It appears during the shared-journey passage, while the angle guides persist, and fades before the final stepping motion.

The annotated follow-up keeps the same icon paths, extends the edge-aligned diagonal guides and upper-left vertical references, and moves both angle labels/arcs above the forms. Separate SVG stroke masks reveal diagonals, vertical/horizontal references and arcs in sequence without changing the dotted pattern. The diagram uses an expanded viewBox to contain the upper labels.
