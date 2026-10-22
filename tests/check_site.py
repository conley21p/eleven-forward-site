from pathlib import Path
from html.parser import HTMLParser
from html import unescape
import json,re,subprocess,sys,tempfile
ROOT=Path(__file__).resolve().parents[1]
class Page(HTMLParser):
 def __init__(self):super().__init__();self.refs=[];self.ids=[];self.tags=[]
 def handle_starttag(self,tag,attrs):
  attrs=dict(attrs);self.tags.append((tag,attrs))
  if 'id'in attrs:self.ids.append(attrs['id'])
  for key in ['href','src']:
   if key in attrs:self.refs.append(attrs[key])
for file in (ROOT/'dist').rglob('*.html'):
 p=Page();p.feed(file.read_text());assert len(p.ids)==len(set(p.ids)),f'Duplicate IDs: {file}'
 for ref in p.refs:
  if ref.startswith('/') and not ref.startswith('//'):
   path,_,anchor=ref.partition('#');target=ROOT/'dist'/path.lstrip('/');target=target/'index.html' if target.is_dir() else target
   assert target.exists(),f'Broken local link {ref} in {file}'
   if anchor:
    linked=Page();linked.feed(target.read_text());assert anchor in linked.ids,f'Missing anchor {ref}'
main=Page();main.feed((ROOT/'dist/index.html').read_text())
inputs={attrs.get('name'):attrs for tag,attrs in main.tags if tag=='input'}
assert inputs['email']['type']=='email' and 'required'in inputs['email']
assert 'required'in inputs['marketing_consent'] and 'checked'not in inputs['marketing_consent']
assert any(tag=='fieldset' and 'disabled'in attrs for tag,attrs in main.tags)
assert 'noindex' in (ROOT/'dist/index.html').read_text()
assert not json.loads((ROOT/'src/config.json').read_text())['signupEnabled']
assert 'Disallow: /'in(ROOT/'dist/robots.txt').read_text()
with tempfile.TemporaryDirectory() as temp:
 c=json.loads((ROOT/'src/config.json').read_text());c['signupEnabled']=True
 config=Path(temp)/'bad.json';config.write_text(json.dumps(c))
 result=subprocess.run([sys.executable,str(ROOT/'scripts/build.py'),'--config',str(config),'--out',str(Path(temp)/'site')],capture_output=True,text=True)
 assert result.returncode!=0 and 'Launch blocked' in result.stderr
print('PASS: all local links, anchors, unique IDs, review safeguards, required consent, and launch guard.')

html=(ROOT/'dist/index.html').read_text()
for form_id in ['updates-form','interest-form']:
 match=re.search(r'<form id="'+form_id+r'".*?</form>',html,re.S)
 parsed=Page();parsed.feed(match.group(0))
 choices=[a['value'] for t,a in parsed.tags if t=='input' and a.get('name')=='product_choices']
 assert choices==['p001','shirt-black','shirt-white','hat']
 assert any(t=='input' and a.get('name')=='product_interests' for t,a in parsed.tags)
for tag,attrs in main.tags:
 if tag=='a' and attrs.get('href','').endswith('#updates'):assert 'data-interest'in attrs
assert re.search(r'/assets/styles\.[a-f0-9]{12}\.css',html)
assert re.search(r'/assets/app\.[a-f0-9]{12}\.js',html)
print('PASS: both product forms, all signup-link modal bindings, and versioned assets.')

assert 'founder-preserved.png' not in html and 'founder-right-extension.png' not in html
portrait=next(a for t,a in main.tags if t=='img' and a.get('class')=='founder-image')
assert portrait['loading']=='lazy' and portrait['decoding']=='async'
assert portrait['width']=='1650' and portrait['height']=='1152'
for width in [480,768,1100,1650]:
 asset=ROOT/f'dist/assets/founder-neutral-{width}.webp'
 assert asset.exists() and asset.stat().st_size<250_000
 assert f'{asset.name} {width}w' in html
assert (ROOT/'dist/assets/founder-neutral-768.webp').stat().st_size<100_000
assert '<figcaption>'not in html
clubhtml=(ROOT/'dist/survival-club/index.html').read_text()
assert 'id="survival-club"' not in html and 'class="carousel"' not in html
assert 'href="/survival-club/"' in html
assert '<h1>Survival Club.</h1>' in clubhtml
assert 'carousel' not in clubhtml
assert 'id="interest-dialog"' in clubhtml
for pid in ['shirt-black','shirt-white']:
 assert f'id="{pid}"' in clubhtml and f'data-interest="{pid}"' in clubhtml
assert clubhtml.count('data-catalog-view')==6
assert clubhtml.count('data-catalog-step')==8
assert clubhtml.count('View 2: Front logo')==2
assert clubhtml.count('270vw')==2
assert 'catalog-index' not in clubhtml
assert 'id="hat"' not in clubhtml and 'value="hat"' not in clubhtml
assert 'Bad Day to Be a Colon Cap' not in clubhtml
for form_id in ['updates-form','interest-form']:
 match=re.search(r'<form id="'+form_id+r'".*?</form>',clubhtml,re.S)
 parsed=Page();parsed.feed(match.group(0))
 assert [a['value'] for t,a in parsed.tags if t=='input' and a.get('name')=='product_choices']==['p001','shirt-black','shirt-white']
assert html.index('invitation-title')<html.index('id="updates"')
assert 'data-product-story' not in html
assert 'id="updates-form"' in clubhtml
assert f'/survival-club/</loc>' in (ROOT/'dist/sitemap.xml').read_text()
print('PASS: responsive portrait, homepage invitation, two tee catalog stories and explicit product signup links.')

for file in (ROOT/'dist').rglob('*'):
 if file.suffix in ['.html','.js','.css','.svg','.xml']:
  assert '\u2014' not in unescape(unescape(file.read_text())),f'Em dash in deployed content: {file}'
assert len(re.findall(r'<li><span class="number">',html))==4
assert html.index('Better things ahead')<html.index('Always Next Step Forward')
assert '11° / Brand concept' in html
small=next(a for t,a in main.tags if t=='path' and 'data-mark-small' in a)
tall=next(a for t,a in main.tags if t=='path' and 'data-mark-tall' in a)
assert small['d']=='M0 95 19 37H66L47 95Z' and tall['d']=='M57 95 88 0H141L110 95Z'
print('PASS: four story panels, original icon geometry and no em dashes in deployed content.')


assert len([a for t,a in main.tags if 'data-product-moment' in a])==0
assert len([a for t,a in main.tags if 'data-product-image' in a])==0
for tag,attrs in main.tags:
 if tag=='source' and 'srcset' in attrs:
  candidates=[c.strip().split() for c in attrs['srcset'].split(',')]
  descriptors=[c[1] for c in candidates]
  assert len(descriptors)==len(set(descriptors)),f'Duplicate image candidates: {attrs}'
  for candidate,_ in candidates:assert (ROOT/'dist'/candidate.lstrip('/')).is_file()
assert (ROOT/'dist/assets/product-woven-640.webp').stat().st_size<250_000
for name in ['mesh','top','bottom']:
 assert (ROOT/f'dist/assets/product-{name}-480.webp').stat().st_size<150_000
print('PASS: product story frames, unique responsive image candidates and mobile asset budgets.')

assets=json.loads((ROOT/'dist/assets/catalog-assets.json').read_text())
assert len(assets)==10
for name,asset in assets.items():
 assert (ROOT/f'dist/assets/{asset["filebase"]}-{min(asset["widths"])}.webp').stat().st_size<180_000
 assert (ROOT/f'dist/assets/{asset["filebase"]}.png').exists()
parsed=Page();parsed.feed(clubhtml)
for tag,a in parsed.tags:
 if tag=='source' and 'srcset' in a:
  refs=[candidate.strip().split() for candidate in a['srcset'].split(',')]
  assert len({ref[1] for ref in refs})==len(refs)
  for ref,_ in refs:assert (ROOT/'dist'/ref.lstrip('/')).is_file()
print('PASS: all catalog responsive assets, unique candidates, and mobile image budgets.')
