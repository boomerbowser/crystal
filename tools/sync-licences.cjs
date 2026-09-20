/* Copy the motion engines' licence files into the library, so it ships them.
 *
 * `@crystal-ui/core` declares gsap and motion as runtime dependencies and
 * `core/licenses/` carries their notices, because a consumer who installs the
 * library is redistributing them. The licence in the package must therefore be
 * the licence of the version the manifest declares — which is what
 * `validate-motion.cjs` checks, by requiring this workspace's devDependency,
 * the library's dependency and the lockfile to agree.
 *
 * This was the tail of `build-motion.cjs`, whose other half bundled the engines
 * into a script for the browser. That is a website asset and it is built in
 * crystal-preview now. Copying the notices is the library's own business and
 * stayed.
 *
 *   node tools/sync-licences.cjs
 */
const fs = require('node:fs');

const copied = [];
for (const name of ['motion', 'motion-dom', 'motion-utils', 'framer-motion', 'tslib']) {
  const file = ['LICENSE.md', 'LICENSE.txt'].find((f) => fs.existsSync(`node_modules/${name}/${f}`));
  if (!file) continue;
  fs.copyFileSync(`node_modules/${name}/${file}`, `core/licenses/${name}-LICENSE.txt`);
  copied.push(name);
}

console.log(JSON.stringify({ suite: 'engine licences', copied }, null, 2));
