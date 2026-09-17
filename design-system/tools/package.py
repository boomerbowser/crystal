"""Package the self-contained system without dependencies or recursively adding its ZIP."""
from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED
ROOT=Path(__file__).resolve().parents[1]
archive=ROOT/'crystal-design-system.zip'
with ZipFile(archive,'w',ZIP_DEFLATED) as z:
    for p in sorted(ROOT.rglob('*')):
        if p.is_file() and p!=archive and not any(x in p.parts for x in ('.venv','__pycache__','node_modules','.git','.playwright-mcp','.remember')):
            z.write(p,Path('crystal-design-system')/p.relative_to(ROOT))
with ZipFile(archive) as z:
    assert z.testzip() is None
    print(f'Packaged and CRC-checked {len(z.namelist())} files: {archive.name}')
