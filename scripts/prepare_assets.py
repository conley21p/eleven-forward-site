from pathlib import Path
from PIL import Image, ImageChops
import shutil
ROOT=Path(__file__).resolve().parents[1]
assets=ROOT/'dist/assets'
sources={name:ROOT/'originals'/f'{name}.png' for name in ['product','shirt','shirt-white','hat','brand','founder']}
for name,source in sources.items():
 original=ROOT/'originals'/f'{name}.png'
 if not original.exists(): raise FileNotFoundError(f'Missing source artwork: {original}')
 if name in ['brand','founder']:continue
 im=Image.open(ROOT/'originals/founder-transparent.png' if name=='founder' else original).convert('RGBA')
 if name=='founder':im=im.crop(im.getbbox())
 for width in ([640,1100,1672] if name=='product' else [480,900,1192] if name in ['shirt','shirt-white','hat'] else [640,1000]):
  size=(min(width,im.width),round(im.height*min(width,im.width)/im.width))
  out=im.resize(size,Image.Resampling.LANCZOS)
  out.save(assets/f'{name}-{width}.webp',quality=88,method=6)
  if width==([640,1100,1672] if name=='product' else [480,900,1192] if name in ['shirt','shirt-white','hat'] else [640,1000])[-1]:
   if name=='founder':out.save(assets/'founder-transparent.png')
   bg=Image.new('RGB',out.size,'#f5f5f0' if name!='founder' else '#101112');bg.paste(out,mask=out.getchannel('A'));bg.save(assets/f'{name}.jpg',quality=90)
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
product=Image.open(ROOT/'originals/product.png').convert('RGBA');product.thumbnail((1080,550),Image.Resampling.LANCZOS)
share=Image.new('RGB',(1200,630),'#F5F5F0');share.paste(product,((1200-product.width)//2,(630-product.height)//2),product);share.save(assets/'social-preview.jpg',quality=90)

# Bake the existing SVG composition once, rather than downloading two full PNGs.
# Original portrait stays on top; only the aligned right continuation is revealed.
portrait=Image.open(ROOT/'originals/founder-transparent.png').convert('RGBA')
extension=Image.open(ROOT/'originals/founder-right-extension.png').convert('RGBA')
size=(1650,1152)
scale=2046.92/extension.width
continuation=extension.transform(size,Image.Transform.AFFINE,
 (1/scale,0,(360-295.04)/scale,0,extension.height/1152,-6.12*extension.height/1152),
 resample=Image.Resampling.BICUBIC)
reveal=Image.new('L',size)
reveal.putdata([round(255*max(0,min(1,(x+360-1220)/105))) for y in range(size[1]) for x in range(size[0])])
continuation.putalpha(ImageChops.multiply(continuation.getchannel('A'),reveal))
canvas=Image.new('RGBA',size,'#151b18')
canvas.alpha_composite(continuation)
canvas.alpha_composite(portrait,(-360,0))
canvas=canvas.convert('RGB')
# Remove superseded deployed portraits; untouched sources remain in originals/.
for old in assets.glob('founder*'):
 old.unlink()
for width in [480,768,1100,1650]:
 image=canvas.resize((width,round(size[1]*width/size[0])),Image.Resampling.LANCZOS)
 image.save(assets/f'founder-portrait-{width}.webp',quality=90,method=6)
canvas.save(assets/'founder-portrait.jpg',quality=90,optimize=True,progressive=True)
