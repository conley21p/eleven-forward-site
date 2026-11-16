"""Optimize catalog masters and record exact responsive dimensions for the builder."""
from pathlib import Path
from PIL import Image
import json
ROOT=Path(__file__).resolve().parents[1]
masters=ROOT/'originals/catalog/cutouts'
assets=ROOT/'dist/assets'
assets.mkdir(parents=True,exist_ok=True)
manifest={}
# Replace superseded opaque delivery files; source masters stay untouched.
for old in assets.glob('club-*'):
 if old.is_file(): old.unlink()
def export(name,image):
 image=image.convert('RGBA')
 filebase=name+'-cutout'
 widths=[480,800] if name.endswith('front-detail') else sorted(set(min(w,image.width) for w in [480,800,1200]))
 for width in widths:
  image.resize((width,round(image.height*width/image.width)),Image.Resampling.LANCZOS).save(assets/f'{filebase}-{width}.webp',quality=86,method=6)
 fallback=image.copy();fallback.thumbnail((1200,1200),Image.Resampling.LANCZOS)
 fallback.save(assets/f'{filebase}.png',optimize=True)
 manifest[name]={'filebase':filebase,'width':image.width,'height':image.height,'widths':widths}
# Center the square detail crops on the outer bounds of the printed artwork.
back_detail_boxes={'black':(346,111,906,671),'white':(365,200,925,760)}
black_chest_detail_box=(618,181,938,501)
for color in ['black','white']:
 for view in ['front','back']:
  export(f'club-{color}-{view}',Image.open(masters/f'{color}-{view}.png'))
 export(f'club-{color}-detail',Image.open(masters/f'{color}-back.png').crop(back_detail_boxes[color]))
black_chest_detail=Image.open(masters/'black-front.png').crop(black_chest_detail_box)
export('club-black-front-detail',black_chest_detail)
cap=Image.open(masters/'cap-pair.png').resize((1300,560),Image.Resampling.LANCZOS)
export('club-cap-front',cap.crop((0,30,535,535)))
export('club-cap-side',cap.crop((535,40,1300,535)))
export('club-cap-angle',Image.open(masters/'cap-angle.png'))
export('club-cap-detail',Image.open(masters/'cap-angle.png').crop((290,330,800,730)))
(assets/'catalog-assets.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(f'Prepared {len(manifest)} catalog views; mobile maximum: {max((assets/f"{data["filebase"]}-{min(data["widths"])}.webp").stat().st_size for name,data in manifest.items()):,} bytes')
