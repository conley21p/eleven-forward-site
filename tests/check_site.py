from pathlib import Path
from html.parser import HTMLParser
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
 asset=ROOT/f'dist/assets/founder-portrait-{width}.webp'
 assert asset.exists() and asset.stat().st_size<250_000
 assert f'{asset.name} {width}w' in html
assert (ROOT/'dist/assets/founder-portrait-768.webp').stat().st_size<100_000
assert '<figcaption>'not in html
clubhtml=(ROOT/'dist/survival-club/index.html').read_text()
assert 'id="survival-club"' not in html and 'class="carousel"' not in html
assert 'href="/survival-club/"' in html
assert '<h1 id="club-title">Survival Club.</h1>' in clubhtml
assert 'class="carousel-current"' in clubhtml
assert 'id="interest-dialog"' in clubhtml and 'data-interest="current"' in clubhtml
assert 'id="updates-form"' in clubhtml
assert f'/survival-club/</loc>' in (ROOT/'dist/sitemap.xml').read_text()
print('PASS: responsive optimized founder portrait, product label in paging row.')
