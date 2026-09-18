"""Rebuild the standalone reference from its own canonical sources.

Every page on the site — the overview, the playground, the motion studies and
the ten specification pages — is generated here and wrapped by `shell.py`. The
hand-authored parts are the markdown under `docs/` and the body fragments under
`src/pages/`. Nothing else is edited by hand.
"""
from pathlib import Path
import json, re, subprocess, sys
import markdown
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
import shell

subprocess.run(['node', 'tools/build-tokens.cjs'], cwd=ROOT, check=True)
subprocess.run(['node', 'tools/build-catalogue.cjs'], cwd=ROOT, check=True)
subprocess.run(['node', 'tools/build-reference.cjs'], cwd=ROOT, check=True)
data = json.loads((ROOT / 'tokens/crystal.json').read_text())
(ROOT / 'assets/tokens.js').write_text(
    'window.CRYSTAL_TOKENS = ' + json.dumps(data, separators=(',', ':')) + ';\n')
subprocess.run(['node', '-e', "const f=require('fs'),v=require('vm');const c={window:{}};v.createContext(c);for(const p of ['assets/tokens.js','assets/crystal.js'])v.runInContext(f.readFileSync(p,'utf8'),c);f.writeFileSync('assets/crystal-theme.css',c.window.Crystal.exportCSS());"],
               cwd=ROOT, check=True)

# Assets the interactive pages need on top of the shared base. These lists are the
# whole definition of what each page loads, so they are kept beside each other: a page
# that silently loses one renders without error and simply stops working. `validate.py`
# fails on any asset under `assets/` that no page references, which is what catches a
# dropped entry here.
INTERACTIVE = ['assets/vendor/crystal-engines.js?v=modal-cleanup-1', 'assets/motion-catalog.js',
               # The shared preset module must load before motion.js, which reads it.
               'assets/core/presets.js', 'assets/motion.js', 'assets/motion-interactions.js']
PAGE_ASSETS = {
    'playground': {'styles': ['assets/motion.css'],
                   'scripts': INTERACTIVE + ['assets/site.js']},
    # The motion studies page is the suite: its own layout, the preview player and the
    # suite chrome. Without these three the page renders as unstyled, unplayable markup.
    'motion': {'styles': ['assets/motion.css', 'assets/motion-suite.css'],
               'scripts': INTERACTIVE + ['assets/motion-preview.js',
                                         'assets/motion-suite.js?v=pill-focus-2']},
}


def fragment(name):
    p = ROOT / 'src/pages' / name
    return p.read_text().strip() if p.exists() else ''


def render_markdown(path):
    """Markdown to HTML, with tables wrapped so wide ones scroll rather than
    overflow the page. `md_in_html` lets a live specimen be written as plain
    HTML in the markdown source and still contain formatted prose."""
    text = path.read_text()
    title = text.splitlines()[0].removeprefix('# ')
    body = markdown.markdown(text, extensions=['tables', 'fenced_code', 'toc', 'md_in_html'])
    # Only wrap real document tables — a table inside an example belongs to the
    # example, and wrapping it would change what the example demonstrates.
    body = re.sub(r'<table>(?!</table>)', '<div class="cr-table-scroll"><table class="cr-table">', body)
    body = body.replace('</table>', '</table></div>')
    return title, body


built = []

# 1. The specification pages.
for p in sorted((ROOT / 'docs').glob('*.md')):
    title, content = render_markdown(p)
    (ROOT / 'docs' / f'{p.stem}.html').write_text(shell.document(
        title=title, path=f'docs/{p.stem}.html', content=content,
        styles=['assets/motion.css'], scripts=['assets/docs.js'],
        skip='Skip to specification',
        footer_note='Crystal 2.0 · Editable specification',
        footer_link=(p.name, 'Markdown source')))
    built.append(f'docs/{p.stem}.html')

# 2. The overview, which is the site's index page.
title, content = render_markdown(ROOT / 'src/overview.md')
(ROOT / 'index.html').write_text(shell.document(
    title=title, path='index.html', content=content,
    styles=['assets/motion.css'], scripts=['assets/docs.js'],
    # Fragments never reach the server, so an inbound link to the old
    # index.html#playground anchor can only be forwarded in the page.
    head_extra='<script>if(location.hash&&/^#(playground|workbench|palettes|foundations|content-blending|supporting-materials|components|accessibility|motion|adoption|specification)$/.test(location.hash))'
               'location.replace("playground.html"+location.hash);</script>',
    footer_note='Crystal 2.0 · Meridian Digital, Inc.',
    footer_link=('validation/report.html', 'Verification')))
built.append('index.html')

# 3. The interactive pages, from hand-authored body fragments.
for name, title in [('playground', 'Playground'), ('motion', 'Motion studies')]:
    (ROOT / f'{name}.html').write_text(shell.document(
        title=title, path=f'{name}.html', content=fragment(f'{name}.html'),
        styles=PAGE_ASSETS[name]['styles'], scripts=PAGE_ASSETS[name]['scripts'],
        main_class='site-main', tail=fragment(f'{name}.tail.html'),
        footer_note='Crystal 2.0 · Meridian Digital, Inc.',
        footer_link=('validation/report.html', 'Verification')))
    built.append(f'{name}.html')

print(f'Built token data, default CSS and {len(built)} pages through one shell.')
