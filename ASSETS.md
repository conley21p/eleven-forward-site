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
