/* Copy the motion engines' licence files into the library, so it ships them.
 *
 * `@crystal-ui/core` declares gsap and motion as runtime dependencies and
 * `core/licenses/` carries their notices, because a consumer who installs the
 * library is redistributing them. The licence in the package must therefore be
 * the licence of the version the manifest declares. `validate-motion.cjs`
 * checks this by requiring this workspace's devDependency, the library's
 * dependency and the lockfile to agree.
 *
 * This was the tail of `build-motion.cjs`. The browser engine bundle is a
 * website asset, built in crystal-preview. Copying the notices belongs to the
 * library.
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
