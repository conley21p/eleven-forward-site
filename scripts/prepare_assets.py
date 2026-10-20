from pathlib import Path
from PIL import Image
import shutil
ROOT=Path(__file__).resolve().parents[1]
assets=ROOT/'dist/assets'
sources={name:ROOT/'originals'/f'{name}.png' for name in ['product','shirt','shirt-white','hat','brand','founder']}
for name,source in sources.items():
 original=ROOT/'originals'/('product-branded.png' if name=='product' else f'{name}.png')
 if not original.exists(): raise FileNotFoundError(f'Missing source artwork: {original}')
 if name in ['brand','founder']:continue
 im=Image.open(ROOT/'originals/founder-transparent.png' if name=='founder' else original).convert('RGBA')
 if name=='founder':im=im.crop(im.getbbox())
 for width in ([640,1100,1672] if name=='product' else [480,900,1192] if name in ['shirt','shirt-white','hat'] else [640,1000]):
  size=(min(width,im.width),round(im.height*min(width,im.width)/im.width))
  out=im.resize(size,Image.Resampling.LANCZOS)
  out.save(assets/f"{'product-woven' if name=='product' else name}-{width}.webp",quality=88,method=6)
  if width==([640,1100,1672] if name=='product' else [480,900,1192] if name in ['shirt','shirt-white','hat'] else [640,1000])[-1]:
   if name=='founder':out.save(assets/'founder-transparent.png')
   bg=Image.new('RGB',out.size,'#f5f5f0' if name!='founder' else '#101112');bg.paste(out,mask=out.getchannel('A'));bg.save(assets/f"{'product-woven' if name=='product' else name}.jpg",quality=90)
# Extract the actual supplied logo silhouette; preserve lettering and proportions.
im=Image.open(ROOT/'originals/brand.png').convert('RGB').crop((30,184,619,289))
for name,color in [('logo-dark',(16,17,18)),('logo-light',(245,245,240))]:
 out=Image.new('RGBA',im.size)
 out.putdata([(*color,255 if g>155 and r>110 and b<140 and g>b*1.4 else 0) for r,g,b in im.getdata()])
 bbox=out.getbbox();out=out.crop(bbox);out.save(assets/f'{name}.png')
fontdir=ROOT/'originals/fonts'
for weight in ['Regular','Bold']:
 shutil.copy2(fontdir/f'Inter-{weight}.ttf',assets/'fonts'/f'Inter-{weight}.ttf')
shutil.copy2(fontdir/'OFL-Inter.txt',assets/'fonts/LICENSE.txt')
# Product share image uses supplied artwork and brand background.
product=Image.open(ROOT/'originals/product-branded.png').convert('RGBA');product.thumbnail((1080,550),Image.Resampling.LANCZOS)
share=Image.new('RGB',(1200,630),'#F5F5F0');share.paste(product,((1200-product.width)//2,(630-product.height)//2),product);share.save(assets/'social-p001-woven.jpg',quality=90)

# The neutral edit retains the approved framing; original portrait sources are preserved.
size=(1650,1152)
canvas=Image.open(ROOT/'originals/founder-neutral.png').convert('RGB').resize(size,Image.Resampling.LANCZOS)
# Remove superseded deployed portraits; untouched sources remain in originals/.
for old in assets.glob('founder*'):
 old.unlink()
for width in [480,768,1100,1650]:
 image=canvas.resize((width,round(size[1]*width/size[0])),Image.Resampling.LANCZOS)
 image.save(assets/f'founder-neutral-{width}.webp',quality=90,method=6)
canvas.save(assets/'founder-neutral.jpg',quality=90,optimize=True,progressive=True)

# Detail crops are taken from the same branded concept, preserving construction.
product=Image.open(ROOT/'originals/product-branded.png').convert('RGBA')
for name,box in {
 'product-mesh':(1080,275,1580,675),
 'product-top':(280,100,1180,445),
 'product-bottom':(1000,565,1660,865)
}.items():
 image=product.crop(box)
 for width in [480,800,1100]:
  actual=min(width,image.width)
  variant=image.resize((actual,round(image.height*actual/image.width)),Image.Resampling.LANCZOS)
  variant.save(assets/f'{name}-{width}.webp',quality=88,method=6)
 bg=Image.new('RGB',image.size,'#f5f5f0');bg.paste(image,mask=image.getchannel('A'));bg.save(assets/f"{'product-woven' if name=='product' else name}.jpg",quality=88,optimize=True,progressive=True)
