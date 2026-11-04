"""Package maintained theme source; retain saved store settings on rebuild.
Pass --settings-file with settings_data.json downloaded from the destination store.
"""
from pathlib import Path
import argparse,json,re,shutil,zipfile
ROOT=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--settings-file',type=Path);args=p.parse_args()
source,output=ROOT/'shopify-src',ROOT/'shopify-theme'
saved=output/'config/settings_data.json'
settings=args.settings_file.read_text() if args.settings_file else saved.read_text() if saved.exists() else (source/'config/settings_data.json').read_text()
# Shopify prepends an auto-generated block comment to downloaded settings.
# Validate the JSON body while retaining the original file byte-for-byte.
json.loads(re.sub(r'\A\s*/\*.*?\*/\s*', '', settings, count=1, flags=re.S))
if output.exists():shutil.rmtree(output)
shutil.copytree(source,output)
(output/'config/settings_data.json').write_text(settings)
archive=ROOT/'Eleven-Forward-Shop-v0.2.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as bundle:
 for path in sorted(output.rglob('*')):
  if path.is_file():bundle.write(path,path.relative_to(output))
print(f'Created {archive.name}: {archive.stat().st_size/1024/1024:.1f} MB; settings preserved.')
