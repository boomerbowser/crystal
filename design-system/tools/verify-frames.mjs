/* Visual regression gate: capture the frame set now and compare it against the
 * committed baselines. Exits non-zero on any difference.
 *
 * A difference is not automatically a failure of the code — it may be an
 * intended change — but it is always a failure of *this check*, and the
 * re-blessing procedure in validation/frames.json says what to do next. The
 * point is that a pixel cannot change without somebody saying why.
 *
 *   node tools/verify-frames.mjs
 *   node tools/verify-frames.mjs --bless      (replace the baselines)
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, copyFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const BASELINES = join(ROOT, 'validation/baselines');
const BLESS = process.argv.includes('--bless');

const work = mkdtempSync(join(tmpdir(), 'crystal-frames-'));
execFileSync('node', [join(HERE, 'capture-frames.mjs'), '--out', work], { stdio: 'inherit' });

const shots = readdirSync(work).filter((f) => f.endsWith('.png')).sort();
const differing = [];
const missing = [];

for (const name of shots) {
  const baseline = join(BASELINES, name);
  if (!existsSync(baseline)) { missing.push(name); continue; }
  try {
    /* The allowance absorbs GPU rasterisation dither on gradients, which varies
       between runs on the same machine. It cannot absorb a visible change:
       compare-captures.py fails on any pixel past --visible-delta however few
       there are, and tests/visual-gate-contracts.py proves that. */
    execFileSync('python3', [join(HERE, 'compare-captures.py'), baseline, join(work, name),
      '--tolerance', '2', '--max-differing', '400'], { stdio: 'pipe' });
  } catch (error) {
    differing.push({ name, detail: (error.stdout?.toString() || '').trim().split('\n').pop() });
  }
}

if (BLESS) {
  for (const name of shots) copyFileSync(join(work, name), join(BASELINES, name));
  console.log(JSON.stringify({ blessed: shots.length, baselines: 'validation/baselines' }, null, 2));
  console.log('Baselines replaced. Record why in the capture directory README before committing.');
  process.exit(0);
}

console.log(JSON.stringify({
  suite: 'visual regression',
  frames: shots.length,
  identical: shots.length - differing.length - missing.length,
  differing,
  missingBaseline: missing,
}, null, 2));

if (differing.length || missing.length) {
  console.error('\nA frame differs from its baseline. Look at both images before deciding.');
  console.error('If the change is intended, follow the re-blessing procedure in validation/frames.json,');
  console.error('then re-run with --bless and explain the change in the commit.');
  process.exit(1);
}
