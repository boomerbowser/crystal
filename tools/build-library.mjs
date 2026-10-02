/* Build everything @crystal-ui/core ships that is generated rather than written.
 *
 * This builds the library only. The website is `crystal-preview` and renders
 * the library it installs. Nothing here needs Python, so this repository does
 * not either.
 *
 * The order is dependency order. The DTCG source produces the flat token file;
 * the flat file produces `tokens.js`; `tokens.js` and `crystal.js` together
 * produce the exported theme; and the reference sections in `core/docs/` quote
 * values from all of them, so they are generated last.
 *
 *   node tools/build-library.mjs
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createContext, runInContext } from 'node:vm';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const run = (script) =>
  execFileSync('node', [`tools/${script}`], { cwd: ROOT, encoding: 'utf8', stdio: 'inherit' });

run('build-tokens.cjs');
run('build-catalogue.cjs');

/* The browser reads the tokens as a script rather than fetching JSON, so the
   flat file is wrapped. It is generated rather than committed by hand because
   it is the flat file with eleven characters in front of it. */
const flat = readFileSync(resolve(ROOT, 'core/tokens/crystal.json'), 'utf8');
writeFileSync(
  resolve(ROOT, 'core/assets/tokens.js'),
  `window.CRYSTAL_TOKENS = ${JSON.stringify(JSON.parse(flat))};\n`,
);

/* The exported theme is the resolver's own output, produced by running the
   resolver. Writing it by any other means would be a second implementation of
   alias resolution, which is the divergence the token pipeline exists to
   prevent. */
const context = createContext({ window: {} });
for (const asset of ['core/assets/tokens.js', 'core/assets/crystal.js']) {
  runInContext(readFileSync(resolve(ROOT, asset), 'utf8'), context);
}
writeFileSync(resolve(ROOT, 'core/assets/crystal-theme.css'), context.window.Crystal.exportCSS());

run('build-reference.cjs');

console.log('Built the token data, the exported theme and the reference sections.');
