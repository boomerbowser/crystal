/* What a published @crystal-ui/core may and may not contain.
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
 * **Every export entry point resolves, and is in the tarball.** The third
 * silent failure: `exports` can name a file `files` does not ship, and the
 * error a consumer gets is `ERR_PACKAGE_PATH_NOT_EXPORTED` at *their* build
 * time. Presence alone is not enough to prevent it — an export whose files all
 * ship can still be unresolvable, which is how `./shaders/` stayed broken
 * under a green gate — so the subpath is resolved the way a consumer resolves
 * it.
 *
 *   node tools/verify-package.cjs
 */
const { execFileSync } = require('node:child_process');
const { readFileSync, mkdtempSync, mkdirSync, symlinkSync, rmSync } = require('node:fs');
const { resolve, join, relative } = require('node:path');
const { createRequire } = require('node:module');
const { tmpdir } = require('node:os');

/* The package is `core/`, not the repository. Since the split those are two
   different manifests: `core/package.json` is @crystal-ui/core and is published,
   and the one beside `tools/` is private machinery that runs the build. Pointing
   this at the wrong one would check a manifest nobody installs. */
const root = resolve(__dirname, '..', 'core');
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

/* A wildcard target names a family rather than a file. Pick a real shipped
   member of it, so both checks below have something concrete to ask about. */
const member = (target) => {
  const [prefix, suffix = ''] = target.replace(/^\.\//, '').split('*');
  const hit = files.find((path) => path.startsWith(prefix) && path.endsWith(suffix) && path.length > prefix.length + suffix.length);
  return hit ? hit.slice(prefix.length, hit.length - suffix.length) : null;
};

for (const [name, target] of Object.entries(manifest.exports ?? {})) {
  const targets = typeof target === 'string' ? [target] : Object.values(target);
  for (const each of targets) {
    const rel = each.replace(/^\.\//, '');
    let ok;
    if (rel.includes('*')) ok = member(each) !== null;
    else if (rel.endsWith('/')) ok = files.some((path) => path.startsWith(rel));
    else ok = present.has(rel);
    if (!ok) {
      failures.push(
        `exports["${name}"] points at ${each}, which "files" does not ship — a `
        + 'consumer gets ERR_PACKAGE_PATH_NOT_EXPORTED at their build time',
      );
    }
  }
}

/* Shipping the file is not the same as exporting it, and the difference is
   invisible from inside the repository. `"./shaders/": "./assets/shaders/"`
   shipped every shader, satisfied the loop above, and still answered
   ERR_PACKAGE_PATH_NOT_EXPORTED for every path beneath it: trailing-slash
   export targets were deprecated and then removed from Node, and the
   replacement is the `*` pattern. The check that would have caught it is the
   one a consumer performs — ask Node to resolve the subpath. So do that, from
   a sandbox where the package sits at its published name. */
const sandbox = mkdtempSync(join(tmpdir(), 'crystal-exports-'));
try {
  const [scope, bare] = manifest.name.split('/');
  mkdirSync(join(sandbox, 'node_modules', scope), { recursive: true });
  symlinkSync(root, join(sandbox, 'node_modules', scope, bare), 'dir');
  const from = createRequire(join(sandbox, 'probe.cjs'));

  for (const [name, target] of Object.entries(manifest.exports ?? {})) {
    const first = typeof target === 'string' ? target : Object.values(target)[0];
    let subpath = name;
    if (name.includes('*')) {
      const star = member(first);
      if (star === null) continue;   // already reported as unshipped above
      subpath = name.replace('*', star);
    }
    const specifier = subpath === '.' ? manifest.name : `${manifest.name}/${subpath.slice(2)}`;
    let resolved;
    try {
      resolved = from.resolve(specifier);
    } catch (error) {
      failures.push(
        `exports["${name}"] does not resolve: \`require("${specifier}")\` fails with `
        + `${error.code ?? error.message}. The files may all be present — Node still `
        + 'refuses the subpath, and so will every consumer.',
      );
      continue;
    }
    const rel = relative(root, resolved).split(/[\\/]/).join('/');
    if (!present.has(rel)) {
      failures.push(
        `exports["${name}"] resolves to ${rel}, which "files" does not ship`,
      );
    }
  }
} finally {
  rmSync(sandbox, { recursive: true, force: true });
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
