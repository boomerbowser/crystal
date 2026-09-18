#!/usr/bin/env node
/* Ambient amplitude audit.
 *
 * Crystal's materials move at rest. That is a specification, not a flourish, and
 * like every other material figure it needs a number that can fail.
 *
 * The regression this tool exists to prevent shipped in 021e0a0: the Resin rest
 * shader was handed `progress: 1` — not a rest state at all but the peak of a
 * press — so every Resin surface wore a permanent lens band a fifth of the panel
 * deep, with its own dark inner shade. It read as a hard emboss around each
 * control and bled through anything laid over it. Three separate gates were green
 * the whole time:
 *
 *   - verify:visual captures every frame with `data-ambient=off`, so no reference
 *     frame has ever contained an ambient surface;
 *   - the reference frames are 1280x900 viewport shots, and the material specimens
 *     sit below the fold;
 *   - validate-motion checks that recipes move, which a shader is not.
 *
 * So this measures the thing itself: the same surface photographed still and at
 * rest, differenced per channel. Three bounds, because there are three ways to be
 * wrong and the previous work fell into two of them.
 *
 *   interior mean  — the interior must stay neutral. This is the shader's own
 *                    claim about itself, and it is what a panel geometry measured
 *                    in 0..1 uv breaks: on a wide control the lens band stretches
 *                    until it reaches the middle of the surface. As shipped, with
 *                    that fault present, this measured 9.35.
 *   rim mean       — the rim carries the effect, but a rest state is low
 *                    amplitude. A lens pinned at full press deformation measures
 *                    11 to 23 here against a limit of 8.
 *   rim max        — and it must actually be visible. A first attempt at the fix
 *                    overshot into the opposite failure and measured 2, which
 *                    passes every ceiling and is invisible to a person.
 *
 * Each bound has been shown to fail on demand by reintroducing the fault it
 * describes; none of them is decoration.
 *
 * Run: npm run audit:ambient   (needs the preview server on 4321)
 */
import { chromium } from 'playwright';

const ORIGIN = process.env.CRYSTAL_ORIGIN || 'http://localhost:4321';

/* Specimens are addressed by selector rather than by page region, because the
   material studies live below the fold of every reference frame. */
const SURFACES = [
  { label: 'Resin control plane', page: 'playground.html', selector: '.material-sample.cr-resin', tier: 'shader' },
  { label: 'Resin floating dock', page: 'playground.html', selector: '.study-floating.cr-resin', tier: 'shader' },
  { label: 'Resin stage dock', page: 'playground.html', selector: '.stage .cr-dock', tier: 'shader' },
  { label: 'Frost study pane', page: 'playground.html', selector: '.study-pane.cr-frost', tier: 'shader' },
  /* The animation tier, which is the floor every platform must reach, and which
     was until recently declared but never started. Its largest specimen is here
     on purpose: haze-settle is a 1.8% scale, so its travel grows with the box. */
  { label: 'Haze content fill', page: 'playground.html', selector: '.component-box.cr-haze' },
  { label: 'Stone label backing', page: 'playground.html', selector: '.protected.cr-stone' },
];

/* Chosen to sit an order of magnitude away from both observed failures rather
   than snugly around the current numbers, so ordinary drift does not trip them
   and a material regression cannot slip through. */
const LIMITS = { interiorMean: 2.0, rimMean: 8.0, rimMaxFloor: 6, travelFloor: 4 };

/* Two fixed instants on the ambient clock, not one.
 *
 * A single instant makes the measurement phase-dependent, and for a looping
 * recipe that can be the one phase where nothing is happening: stone-settle runs
 * 1600ms alternating, so a 3200ms cycle puts t=6.5s just 100ms in, sitting at
 * identity. Measured there the recipe looked invisible at every amplitude,
 * including amplitudes that were plainly wrong. Presence is therefore the better
 * of two well-separated phases, and the motion between them is reported too —
 * for the animation tier that is the more direct question, since what has to
 * move is an edge. */
const CLOCKS = ['6.5', '7.3'];

function prepare(mode, clock, surface) {
  /* The attribute must be re-applied on DOMContentLoaded. An init script runs
     against the initial empty document, whose documentElement is then replaced
     by the parsed one, so setting it once succeeds and silently does nothing —
     the same fault that once left the right-to-left reference frames identical
     to their left-to-right twins. */
  return [mode, clock, surface.tier === 'shader', surface.selector];
}

async function capture(browser, surface, mode, clock) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 1 });
  await context.addInitScript(([m, clock, isolate, selector]) => {
    const apply = () => {
      if (!document.documentElement) return;
      if (m === 'still') document.documentElement.dataset.ambient = 'off';
      else {
        document.documentElement.dataset.ambientClock = clock;
        document.documentElement.style.setProperty('--cr-ambient-clock', clock + 's');
      }
    };
    apply();
    document.addEventListener('DOMContentLoaded', () => {
      apply();
      /* Measure one tier at a time. A Resin panel usually has a Haze or Stone fill
         sitting on it, and that fill now breathes too — differencing the panel against
         a still capture would then attribute the label's movement to the panel's
         shader, which is how this surface's interior reading flapped between 0.02 and
         2.37 across runs. `data-cr-motion="manual"` is the existing opt-out that
         ambientAll honours, so marking the subtree isolates the optical layer. Init
         scripts run before page scripts, so this listener precedes ambientAll's. */
      if (isolate) for (const el of document.querySelectorAll(selector)) el.dataset.crMotion = 'manual';
    });
  }, prepare(mode, clock, surface));
  const page = await context.newPage();
  await page.goto(`${ORIGIN}/${surface.page}`);
  const element = await page.waitForSelector(surface.selector, { timeout: 10000 });
  await element.scrollIntoViewIfNeeded();
  /* Long enough for the IntersectionObserver to attach a context and for the
     shader to have drawn at the pinned clock. */
  await page.waitForTimeout(900);
  const shot = (await element.screenshot()).toString('base64');
  await context.close();
  return shot;
}

/* Decoding happens in the browser: the project deliberately carries no image
   library, and a page already has one. */
async function difference(decoder, still, rest) {
  return decoder.evaluate(async ([a, b]) => {
    const pixels = async (data) => {
      const bitmap = await createImageBitmap(await (await fetch(`data:image/png;base64,${data}`)).blob());
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(bitmap, 0, 0);
      return { d: ctx.getImageData(0, 0, bitmap.width, bitmap.height).data, w: bitmap.width, h: bitmap.height };
    };
    const A = await pixels(a);
    const B = await pixels(b);
    if (A.w !== B.w || A.h !== B.h) return { error: 'the two captures are different sizes' };
    let rimMax = 0, rimSum = 0, rimN = 0, interiorSum = 0, interiorN = 0;
    for (let y = 0; y < A.h; y += 1) {
      for (let x = 0; x < A.w; x += 1) {
        const i = (y * A.w + x) * 4;
        const delta = Math.max(
          Math.abs(A.d[i] - B.d[i]), Math.abs(A.d[i + 1] - B.d[i + 1]), Math.abs(A.d[i + 2] - B.d[i + 2]),
        );
        const fx = Math.min(x, A.w - 1 - x) / A.w;
        const fy = Math.min(y, A.h - 1 - y) / A.h;
        /* The rim is the outer eighth; the interior is the central 55%, leaving
           a deliberate gap between them so a soft falloff belongs to neither. */
        if (Math.min(fx, fy) < 0.12) { rimMax = Math.max(rimMax, delta); rimSum += delta; rimN += 1; }
        else if (fx > 0.225 && fy > 0.225) { interiorSum += delta; interiorN += 1; }
      }
    }
    return {
      rimMax,
      rimMean: +(rimSum / Math.max(rimN, 1)).toFixed(2),
      interiorMean: +(interiorSum / Math.max(interiorN, 1)).toFixed(2),
    };
  }, [still, rest]);
}

const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const decoder = await (await browser.newContext()).newPage();
const failures = [];

for (const surface of SURFACES) {
  let phases, travel;
  try {
    const still = await capture(browser, surface, 'still');
    const rests = [];
    for (const clock of CLOCKS) rests.push(await capture(browser, surface, 'rest', clock));
    phases = [];
    for (const rest of rests) phases.push(await difference(decoder, still, rest));
    travel = await difference(decoder, rests[0], rests[1]);
  } catch (error) {
    failures.push(`${surface.label}: could not be captured — ${error.message}`);
    continue;
  }
  const broken = phases.find((p) => p.error) || (travel.error ? travel : null);
  if (broken) { failures.push(`${surface.label}: ${broken.error}`); continue; }

  const problems = [];
  const worstInterior = Math.max(...phases.map((p) => p.interiorMean));
  const worstRimMean = Math.max(...phases.map((p) => p.rimMean));
  /* Presence is the BEST phase: one of them may legitimately sit at rest. */
  const bestRimMax = Math.max(...phases.map((p) => p.rimMax));

  if (worstInterior > LIMITS.interiorMean)
    problems.push(`interior is being painted (mean ${worstInterior} > ${LIMITS.interiorMean})`);
  if (worstRimMean > LIMITS.rimMean)
    problems.push(`rim amplitude is not a rest state (mean ${worstRimMean} > ${LIMITS.rimMean})`);
  if (bestRimMax < LIMITS.rimMaxFloor)
    problems.push(`rest state is invisible (max ${bestRimMax} < ${LIMITS.rimMaxFloor})`);
  if (travel.rimMax < LIMITS.travelFloor)
    problems.push(`rest state does not move between phases (max ${travel.rimMax} < ${LIMITS.travelFloor})`);

  const line = `rim max ${bestRimMax}, rim mean ${worstRimMean}, interior mean ${worstInterior}, travel ${travel.rimMax}`;
  if (problems.length) failures.push(`${surface.label}: ${problems.join('; ')} — ${line}`);
  else console.log(`  ok  ${surface.label} — ${line}`);
}

await browser.close();

if (failures.length) {
  console.error(`\n${failures.length} ambient surface(s) outside the rest-state contract:`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}
console.log(`\n${SURFACES.length} ambient surfaces within the rest-state contract.`);
