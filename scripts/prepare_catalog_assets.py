"""Optimize catalog masters and record exact responsive dimensions for the builder."""
from pathlib import Path
from PIL import Image
import json
ROOT=Path(__file__).resolve().parents[1]
masters=ROOT/'originals/catalog'
assets=ROOT/'dist/assets'
assets.mkdir(parents=True,exist_ok=True)
manifest={}
def export(name,image):
 image=image.convert('RGB')
 widths=sorted(set(min(w,image.width) for w in [480,800,1200]))
 for width in widths:
  image.resize((width,round(image.height*width/image.width)),Image.Resampling.LANCZOS).save(assets/f'{name}-{width}.webp',quality=86,method=6)
 fallback=image.copy();fallback.thumbnail((1200,1200),Image.Resampling.LANCZOS)
 fallback.save(assets/f'{name}.jpg',quality=88,optimize=True,progressive=True)
 manifest[name]={'width':image.width,'height':image.height,'widths':widths}
for color in ['black','white']:
 for view in ['front','angle','back']:
  export(f'club-{color}-{view}',Image.open(masters/f'{color}-{view}.png'))
 export(f'club-{color}-detail',Image.open(masters/f'{color}-back.png').crop((365,200,925,760)))
cap=Image.open(ROOT/'originals/hat.png')
export('club-cap-front',cap.crop((0,30,535,535)))
export('club-cap-side',cap.crop((535,40,1300,535)))
export('club-cap-angle',Image.open(masters/'cap-angle.png'))
export('club-cap-detail',Image.open(masters/'cap-angle.png').crop((290,330,800,730)))
(assets/'catalog-assets.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(f'Prepared {len(manifest)} catalog views; mobile maximum: {max((assets/f"{name}-{min(data["widths"])}.webp").stat().st_size for name,data in manifest.items()):,} bytes')
