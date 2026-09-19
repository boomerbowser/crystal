/* What a published @crystal/core may and may not contain.
 *
 * Both failure modes here are silent. A package publishes, the registry accepts
 * it, every test stays green, and the damage shows up in somebody else's
 * repository days later.
 *
 * **No `file:` or `link:` dependency.** A manifest published carrying one ships
 * a dependency that resolves to a directory on nobody else's machine. `npm
 * install` then either fails or — worse — succeeds against whatever happens to
 * be at that path.
 *
 * **No website.** `design-system/` is the library *and* the documentation site,
 * and 46% of what the package contained before this gate was the site. That is
 * not only weight. `assets/controls.css` is the preview's own stylesheet, it
 * styles bare elements, and it shaped the appearance that got blessed while the
 * exported token said something else — D-9. It was exported once before, and a
 * 32px chip rendered 50px tall in Crystal React because of it. A preview-only
 * stylesheet cannot shape a blessed appearance if it cannot leave the
 * repository, and this is what stops it leaving.
 *
 * **Every export entry point is actually in the tarball.** The third silent
 * failure: `exports` can name a file `files` does not ship, and the error a
 * consumer gets is `ERR_PACKAGE_PATH_NOT_EXPORTED` at *their* build time.
 *
 *   node tools/verify-package.cjs
 */
const { execFileSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');

const root = resolve(__dirname, '..');
const manifest = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));

/* Named patterns rather than one regex, so a failure says which rule it broke
   and a reader can see what the rule is protecting. */
const FORBIDDEN = [
  [/\.html$/, 'a documentation page'],
  [/(^|\/)site\.(css|js)$/, "the preview site's own stylesheet and script"],
  [/(^|\/)controls\.(css|js)$/, 'the preview control layer, which is D-9 and was exported once before'],
  [/(^|\/)(menu|docs)\.js$/, "the preview's navigation"],
  [/(^|\/)motion-(suite|preview|catalog|interactions|shaders)\./, "the preview's motion demonstrations"],
  [/(^|\/)vendor\//, 'a vendored preview dependency'],
  [/(^|\/)(tools|tests|validation)\//, 'build or verification machinery'],
];

const failures = [];

for (const [name, range] of Object.entries({
  ...(manifest.dependencies ?? {}),
  ...(manifest.peerDependencies ?? {}),
  ...(manifest.optionalDependencies ?? {}),
})) {
  if (/^(file|link):/.test(range)) {
    failures.push(
      `dependency "${name}": "${range}" is a path on one machine. A published `
      + 'package carrying it resolves to a directory nobody else has.',
    );
  }
}

const packed = JSON.parse(
  execFileSync('npm', ['pack', '--dry-run', '--json'], { cwd: root, encoding: 'utf8' }),
);
const files = (Array.isArray(packed) ? packed[0] : Object.values(packed)[0]).files
  .map((entry) => entry.path);

for (const path of files) {
  for (const [pattern, what] of FORBIDDEN) {
    if (pattern.test(path)) failures.push(`${path} is ${what}, and the library does not ship it`);
  }
}

const present = new Set(files);
for (const [name, target] of Object.entries(manifest.exports ?? {})) {
  const targets = typeof target === 'string' ? [target] : Object.values(target);
  for (const each of targets) {
    const rel = each.replace(/^\.\//, '');
    const ok = rel.endsWith('/')
      ? files.some((path) => path.startsWith(rel))
      : present.has(rel);
    if (!ok) {
      failures.push(
        `exports["${name}"] points at ${each}, which "files" does not ship — a `
        + 'consumer gets ERR_PACKAGE_PATH_NOT_EXPORTED at their build time',
      );
    }
  }
}

console.log(JSON.stringify({
  suite: 'what the package may contain',
  name: manifest.name,
  version: manifest.version,
  entries: files.length,
  exports: Object.keys(manifest.exports ?? {}).length,
  failures,
}, null, 2));

if (failures.length) {
  console.error('\nThis package would ship something that is not the library.');
  process.exit(1);
}
