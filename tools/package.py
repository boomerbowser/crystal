"""Package the self-contained system without dependencies or recursively adding its ZIP.

The library and the website are separate folders, and both belong in the
archive: someone who opens it should be able to read the specification pages and
find the library they describe. `website/vendor/` is a copy of `core/` made by
`tools/assemble-site.mjs` and is deliberately included, because the pages
address the library through it and an archive whose pages do not render is not a
reference. Run the build first, or the archive ships a site with no library in
it."""
from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED
ROOT=Path(__file__).resolve().parents[1]
archive=ROOT/'crystal-design-system.zip'
with ZipFile(archive,'w',ZIP_DEFLATED) as z:
    PARTS=('core','website','tools','tests','validation','reference')
    for part in PARTS:
        for p in sorted((ROOT/part).rglob('*')):
            if not p.is_file() or any(x in p.parts for x in ('.venv','__pycache__','node_modules','.git','.playwright-mcp','.remember')):
                continue
            z.write(p,Path('crystal-design-system')/p.relative_to(ROOT))
    for p in sorted(ROOT.glob('*')):
        if p.is_file() and p!=archive and p.suffix in ('.json','.md'):
            z.write(p,Path('crystal-design-system')/p.relative_to(ROOT))
with ZipFile(archive) as z:
    assert z.testzip() is None
    print(f'Packaged and CRC-checked {len(z.namelist())} files: {archive.name}')
