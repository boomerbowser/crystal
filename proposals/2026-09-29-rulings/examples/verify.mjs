/* What the rulings of 29 September 2026 look like, measured in a browser.
 *
 * Fourteen checks on the specimen sheet beside this file: each 2.3.0 recipe on
 * the element a consumer actually writes, against the reference it must match —
 * a tab, a radio label and a link against a dock button; a group's corners and
 * hairline; the recessed overlay's edge; a count's circle; the field glyphs on
 * a `div` shell; the dialog's scrolling body, its centring and its position on
 * a non-dialog host; and D-21's hover, which must not change.
 *
 * Serve the repository (`node proposals/2026-09-28-component-recipes/examples/
 * serve.cjs 4331`) and run this from a checkout that installs Playwright —
 * crystal-preview or crystal-react — e.g. `node ../crystal-design-system/
 * proposals/2026-09-29-rulings/examples/verify.mjs`.
 *
 * RED=1 BEFORE=<an older crystal.css> serves that stylesheet in place of the
 * current one, so each check can be watched failing. Against 2.2's, eleven
 * fail; the three that pass are the ones that must not change (a primary
 * child's ink, D-21's hover, a closed dialog staying hidden).
 */
import { createRequire } from 'node:module';
/* Playwright from wherever this is run: this repository does not install it. */
const playwright = await import(createRequire(`${process.cwd()}/`).resolve('playwright'));
const chromium = playwright.chromium ?? playwright.default.chromium;
import { readFileSync } from 'node:fs';
const RED = process.env.RED === '1';
const URL = 'http://127.0.0.1:4331/proposals/2026-09-29-rulings/examples/';
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
if (RED) await p.route('**/core/assets/crystal.css', (r) => r.fulfill({ contentType: 'text/css', body: readFileSync(process.env.BEFORE, 'utf8') }));
await p.goto(URL, { waitUntil: 'networkidle' });
const out = [];
const rec = (name, ok, detail) => out.push({ name, ok, detail });
const cs = (sel, prop, pseudo) => p.evaluate(([s, pr, ps]) => { const e = document.querySelector(s); return e ? getComputedStyle(e, ps || null)[pr] : null; }, [sel, prop, pseudo]);

const ref = { bg: await cs('#dock-buttons button[aria-pressed=true]', 'backgroundColor'), h: await cs('#dock-buttons button[aria-pressed=true]', 'height'), w: await cs('#dock-buttons button[aria-pressed=true]', 'fontWeight') };
for (const [id, sel, unsel] of [['tabs', '#dock-tabs [aria-selected=true]', '#dock-tabs [aria-selected=false]'], ['radios', '#dock-radios label:has(:checked)', '#dock-radios label:not(:has(:checked))'], ['links', '#dock-links [aria-current]', '#dock-links a:not([aria-current])']]) {
  const s = { bg: await cs(sel, 'backgroundColor'), h: await cs(sel, 'height'), r: await cs(sel, 'borderTopLeftRadius'), w: await cs(sel, 'fontWeight') };
  const u = await cs(unsel, 'backgroundColor');
  rec(`dock ${id}: selected takes the dock button's primary fill, height and weight; unselected is clear`, s.bg === ref.bg && s.h === ref.h && s.w === ref.w && s.w === '800' && u === 'rgba(0, 0, 0, 0)' && s.r === '999px', JSON.stringify({ s, u, ref }));
}
await p.focus('#dock-tabs [aria-selected=true]');
await p.keyboard.press('Tab');
rec('dock radios: the focused radio draws its ring on the label', (await cs('#dock-radios label:has(input:focus-visible)', 'outlineStyle')) === 'solid', await cs('#dock-radios label:has(input:focus-visible)', 'outlineStyle'));

const g = await p.evaluate(() => [...document.querySelectorAll('#group-row .cr-group > button')].map((e) => { const c = getComputedStyle(e); return { tl: c.borderTopLeftRadius, tr: c.borderTopRightRadius, bl: c.borderInlineStartWidth + ' ' + c.borderInlineStartColor, shadow: c.boxShadow }; }));
const edge = await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--cr-edge').trim());
rec('group: pill outside, square inside, no shadow of their own, a hairline between',
  g.length === 3 && g[0].tl === '999px' && g[0].tr === '0px' && g[1].tl === '0px' && g[1].tr === '0px' && g[2].tr === '999px' && g[2].tl === '0px' && g.every((x) => x.shadow === 'none') && g[1].bl.startsWith('1px'),
  JSON.stringify({ g, edge }));
rec('group: the plane has the rim', (await cs('#group-row .cr-group', 'borderTopWidth')) === '1px', await cs('#group-row .cr-group', 'borderTopWidth'));
const split = await cs('#group-split .cr-group > button', 'color');
rec('group: a primary child keeps its ink (on-primary)', split === (await cs('#dock-buttons button[aria-pressed=true]', 'color')), split);

rec('recessed overlay: an edge and the content shadow, no feather', (await cs('#overlay .overlay', 'borderTopWidth')) === '1px' && (await cs('#overlay .overlay', 'boxShadow')) !== 'none' && (await cs('#overlay .overlay', 'display', '::before')) === 'none',
  JSON.stringify([await cs('#overlay .overlay', 'borderTopWidth'), await cs('#overlay .overlay', 'boxShadow'), await cs('#overlay .overlay', 'display', '::before')]));

const counts = await p.evaluate(() => [...document.querySelectorAll('#counts .count')].map((e) => { const r = e.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height), getComputedStyle(e, '::before').inset]; }));
rec('count: 20px circle for one digit, a pill for more, filled to its edge', counts[0][0] === 20 && counts[0][1] === 20 && counts[2][0] > 20 && counts[2][1] === 20 && counts.every((c) => c[2] === '0px'), JSON.stringify(counts));

const glyphs = await p.evaluate(() => [...document.querySelectorAll('#glyphs .cr-indicator')].map((e) => getComputedStyle(e, '::after').content));
rec('field glyphs reach a div shell: * required, ! invalid', glyphs[0] === '"*"' && glyphs[1] === '"!"', JSON.stringify(glyphs));

await p.hover('#group-row button:first-child'); await p.waitForTimeout(100);
rec('D-21: a hovered button is not brightened', (await p.evaluate(() => getComputedStyle(document.querySelector('#open-dialog')).filter)) === 'none', 'filter');

await p.click('#open-dialog'); await p.waitForTimeout(300);
const d = await p.evaluate(() => { const dlg = document.getElementById('dialog'); const body = dlg.querySelector('.cr-dialog-body'); const r = dlg.getBoundingClientRect(); const c = getComputedStyle(dlg); return { overflow: c.overflowY, pos: c.position, cx: Math.round(r.left + r.width / 2), cy: Math.round(r.top + r.height / 2), scrolls: body.scrollHeight > body.clientHeight, bodyOverflow: getComputedStyle(body).overflowY }; });
await p.evaluate(() => { document.querySelector('.cr-dialog-body').scrollTop = 99999; });
const title = await p.evaluate(() => { const t = document.getElementById('dialog-title').getBoundingClientRect(); const dl = document.getElementById('dialog').getBoundingClientRect(); return t.top >= dl.top && t.bottom <= dl.bottom; });
rec('dialog: the body scrolls, the surface does not, the title stays in view, and a native dialog is centred', d.overflow === 'visible' && d.scrolls && d.bodyOverflow === 'auto' && title && d.pos === 'fixed' && Math.abs(d.cx - 640) <= 2 && Math.abs(d.cy - 450) <= 2, JSON.stringify({ ...d, title }));
await p.keyboard.press('Escape'); await p.waitForTimeout(200);
rec('dialog: a closed native dialog stays hidden', (await cs('#dialog', 'display')) === 'none', await cs('#dialog', 'display'));
await p.evaluate(() => { const s = document.createElement('section'); s.className = 'cr-dialog'; s.id = 'plain'; document.body.append(s); });
rec('dialog: the class on a non-dialog element is not fixed (the host positions it)', (await cs('#plain', 'position')) !== 'fixed', await cs('#plain', 'position'));

if (process.env.SHOT) { await p.click('#open-dialog'); await p.waitForTimeout(300); await p.screenshot({ path: process.env.SHOT + '-dialog.png' }); await p.keyboard.press('Escape'); await p.screenshot({ path: process.env.SHOT + '-sheet.png', fullPage: true }); }
await b.close();
for (const o of out) console.log(o.ok ? 'PASS' : 'FAIL', o.name, o.ok ? '' : '\n     ' + o.detail);
console.log(out.filter((o) => !o.ok).length, 'failing of', out.length);
