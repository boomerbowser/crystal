"""Check local HTML links/assets, semantic references and preserved source copies."""
from pathlib import Path
from urllib.parse import urlsplit,unquote
import hashlib,json,re
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[1]
errors=[];links=0;pages=list(ROOT.glob('*.html'))+list((ROOT/'docs').glob('*.html'))+list((ROOT/'validation').glob('*.html'))+list((ROOT/'tests').glob('*.html'))
for p in pages:
    soup=BeautifulSoup(p.read_text(),'html.parser');ids=[x['id'] for x in soup.select('[id]')]
    if len(set(ids))!=len(ids):errors.append(f'{p.name}: duplicate IDs')
    if not soup.html or not soup.html.get('lang'):errors.append(f'{p.name}: no document language')
    if not soup.find('title') or not soup.find('main'):errors.append(f'{p.name}: missing title/main')
    for el in soup.select('[href],[src]'):
        for attr in ('href','src'):
            raw=el.get(attr)
            if not raw:continue
            url=urlsplit(raw)
            if url.scheme or url.netloc:continue
            target=(p.parent/unquote(url.path)).resolve() if url.path else p
            if not target.exists():errors.append(f'{p.relative_to(ROOT)}: missing {raw}');continue
            if url.fragment and target.suffix=='.html':
                linked=soup if target==p else BeautifulSoup(target.read_text(),'html.parser')
                if not linked.find(id=unquote(url.fragment)):errors.append(f'{p.name}: missing anchor {raw}')
            links+=1
    for el in soup.select('[aria-labelledby],[aria-describedby]'):
        for attr in ('aria-labelledby','aria-describedby'):
            for ident in el.get(attr,'').split():
                if ident not in ids:errors.append(f'{p.name}: missing ARIA target {ident}')
for css in (ROOT/'assets').glob('*.css'):
    if re.search(r'(?im)^\s*<(?:!doctype|html\b)',css.read_text()):errors.append(f'{css.name}: HTML in stylesheet')
    for raw in re.findall(r'url\([\'"]?([^\)\'\"]+)',css.read_text()):
        if raw.startswith('data:'):continue
        if not (css.parent/raw).exists():errors.append(f'{css.name}: missing {raw}')
manifest=json.loads((ROOT/'reference/provenance.json').read_text())
for item in manifest['files']:
    if hashlib.sha256((ROOT/item['copy']).read_bytes()).hexdigest()!=item['sha256']:errors.append('Changed source copy: '+item['copy'])
report={'scope':'Static artifact integrity; not product or complete WCAG validation','htmlPages':len(pages),'localLinksAndAssets':links,'preservedSourceCopies':len(manifest['files']),'errors':errors}
(ROOT/'validation/artifact-checks.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
raise SystemExit(bool(errors))
