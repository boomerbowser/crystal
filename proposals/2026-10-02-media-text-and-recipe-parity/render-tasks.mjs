#!/usr/bin/env node
/* Render tasks.json and rulings.json into tasks.md and examples/tasks.html.
 *
 * tasks.json holds the tasks and the decisions; rulings.json holds every
 * ruling made on them. The statuses rendered are the effective ones
 * (rulings-lib.mjs), so a ruling unblocks or drops tasks here without anyone
 * editing a status by hand. The Markdown is for reading in a repository and
 * in review; the HTML is a board the team can filter, and where they record a
 * ruling (through examples/serve.cjs). Node only, no dependencies.
 *
 *   node proposals/2026-10-02-media-text-and-recipe-parity/render-tasks.mjs
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { HERE, describeEffects, effective, load } from './rulings-lib.mjs';

const REPO = { core: 'Crystal (`@crystal-ui/core`)', react: 'Crystal React', preview: 'crystal-preview' };
const STATUS_WORD = { done: 'Done', ready: 'Ready', blocked: 'Blocked', ruling: 'Needs a ruling', dropped: 'Dropped' };
const DECISION_WORD = { open: 'Needs a ruling', ruled: 'Ruled', waiting: 'Waits', moot: 'Not needed' };

export function render() {
  const { data, record } = load();
  const { tasks, decisions } = effective(data, record);
  const optionText = (decision, id) => decision.options.find((o) => o.id === id);

  /* ----------------------------------------------------------- Markdown */
  const count = (pick) => tasks.reduce((acc, task) => ({ ...acc, [pick(task)]: (acc[pick(task)] ?? 0) + 1 }), {});
  const byStatus = count((task) => task.status);
  const md = [];
  md.push('# Tasks: media, text and recipe parity', '');
  md.push(`Rendered from \`tasks.json\` and \`rulings.json\` by \`render-tasks.mjs\`. Edit the JSON, or record a ruling on the board, not this file.`);
  md.push('The proposal is [`../2026-10-02-media-text-and-recipe-parity.md`](../2026-10-02-media-text-and-recipe-parity.md); the board is [`examples/tasks.html`](examples/tasks.html); the rulings are recorded in [`../2026-10-02-rulings.md`](../2026-10-02-rulings.md).', '');
  md.push(`${tasks.length} tasks: ${Object.entries(STATUS_WORD).map(([key, word]) => `${byStatus[key] ?? 0} ${word.toLowerCase()}`).join(', ')}.`, '');
  md.push('IDs: `C-` is Crystal core (R release, S surfaces and recipes, M motion, I icons, D docs, T text), `R-` is Crystal React (M media, T text, A audit, motion and materials, Q documentation). Crystal React\'s implementation plan carries the `R-` tasks as Slice R.', '');
  md.push('| Status | Meaning |', '|---|---|');
  for (const [key, meaning] of Object.entries(data.statuses)) md.push(`| ${STATUS_WORD[key]} | ${meaning} |`);
  md.push('', '| Priority | Meaning |', '|---|---|');
  for (const [key, meaning] of Object.entries(data.priorities)) md.push(`| ${key} | ${meaning} |`);
  md.push('');

  md.push('## Decisions', '');
  md.push('Each is Meridian\'s to make. Record a ruling on the board, served by `examples/serve.cjs`, or with `node apply-rulings.mjs ruling.json`; either writes the ruling to `rulings.json`, `../2026-10-02-rulings.md` and `../open-issues.md`, and re-renders this list.', '');
  md.push('| Decision | Task | State | Ruling |', '|---|---|---|---|');
  for (const decision of decisions) {
    const ruled = decision.state === 'ruled' ? `(${decision.ruling.option}) ${optionText(decision, decision.ruling.option).label}, by ${decision.ruling.ruledBy} on ${decision.ruling.date}` : '–';
    const state = decision.state === 'waiting' ? `Waits on ${decision.on.join(', ')}` : decision.state === 'moot' ? `Not needed after ${decision.by}` : DECISION_WORD[decision.state];
    md.push(`| ${decision.id} · ${decision.title} | ${decision.task ?? '–'} | ${state} | ${ruled} |`);
  }
  md.push('');

  for (const repo of ['core', 'preview', 'react']) {
    const list = tasks.filter((task) => task.repo === repo);
    if (!list.length) continue;
    md.push(`## ${REPO[repo]}`, '');
    md.push('| ID | Priority | Status | Task | Depends on |', '|---|---|---|---|---|');
    for (const task of list) {
      md.push(`| [${task.id}](#${task.id.toLowerCase()}) | ${task.priority} | ${STATUS_WORD[task.status]} | ${task.title} | ${task.depends.join(', ') || '–'} |`);
    }
    md.push('');
    for (const task of list) {
      md.push(`### ${task.id}`, '');
      md.push(`**${task.title}.** ${task.area}, ${task.priority}, ${STATUS_WORD[task.status].toLowerCase()}${task.ruledBy ? `, by the ruling on ${task.ruledBy.decision}` : ''}.`, '');
      md.push(`Target: ${task.target}`, '');
      md.push('Done when:', '');
      for (const line of task.acceptance) md.push(`- [${task.status === 'done' ? 'x' : ' '}] ${line}`);
      md.push('', `Where: \`${task.where}\`${task.depends.length ? `. Depends on ${task.depends.join(', ')}.` : '.'}`, '');
    }
  }
  writeFileSync(join(HERE, 'tasks.md'), md.join('\n'));

  /* --------------------------------------------------------------- HTML */
  const page = {
    statuses: data.statuses,
    tasks,
    decisions: decisions.map((decision) => ({
      ...decision,
      options: decision.options.map((option) => ({
        id: option.id, label: option.label, recommended: option.recommended === true,
        effects: describeEffects(decision, option, data),
      })),
    })),
  };
  const json = JSON.stringify(page).replace(/</g, '\\u003c');
  writeFileSync(join(HERE, 'examples/tasks.html'), html(tasks.length, json));
  return { tasks: tasks.length, decisions: decisions.length };
}

function html(total, json) {
  return `<!doctype html>
<html lang="en" data-crystal-mode="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Crystal parity tasks</title>
<!-- Rendered by ../render-tasks.mjs from ../tasks.json and ../rulings.json. Edit the JSON, or record a ruling here. -->
<link rel="stylesheet" href="../../../core/assets/crystal-theme.css">
<link rel="stylesheet" href="../../../core/assets/crystal.css">
<link rel="stylesheet" href="examples.css">
<style>
  /* Layout only, for the decisions. The chosen option is carried by label
     weight, as Crystal carries selection everywhere; the radio is the
     control's own state. */
  .decisions { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 520px), 1fr)); gap: 16px; margin-bottom: 8px; }
  .decision { display: grid; gap: 10px; align-content: start; padding: var(--cr-space); }
  .decision header { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
  .decision h3 { margin: 0; font-size: 18px; letter-spacing: -.02em; }
  .decision p { margin: 0; font-size: 13.5px; line-height: 1.55; }
  .decision fieldset { border: 0; margin: 0; padding: 0; display: grid; gap: 6px; }
  .decision legend { font-size: 12px; font-weight: 800; color: var(--cr-muted); margin-bottom: 4px; }
  .option { display: grid; grid-template-columns: auto 1fr; gap: 4px 10px; align-items: start; padding: 10px 12px; border-radius: calc(var(--cr-radius) - 12px); background: var(--cr-surface-alt); cursor: pointer; font-size: 14px; font-weight: 500; }
  .option:has(input:checked) { font-weight: 800; }
  .option .effects { grid-column: 2; font-size: 12.5px; font-weight: 500; color: var(--cr-muted); }
  .option .rec { font-size: 12px; font-weight: 800; color: var(--cr-primary); }
  .fields { display: grid; grid-template-columns: 1fr; gap: 8px; }
  .fields label { display: grid; gap: 4px; font-size: 12px; font-weight: 800; color: var(--cr-muted); }
  .fields textarea { min-height: 64px; resize: vertical; font: inherit; }
  .actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
  .ruling { padding: 12px 14px; border-radius: calc(var(--cr-radius) - 12px); background: var(--cr-success-surface); color: var(--cr-success-ink); font-size: 13.5px; }
  .ruling p { color: inherit; }
  .history { font-size: 12.5px; color: var(--cr-muted); }
  .fallback { white-space: pre-wrap; font-size: 12px; }
</style>
</head>
<body class="cr-plastic">
<main class="sheet">
  <header class="sheet-head">
    <div>
      <p class="eyebrow"><a href="index.html">Media, text and recipe parity</a></p>
      <h1>Tasks and targets</h1>
      <p>${total} tasks across Crystal, crystal-preview and Crystal React, each with a target, the checks that say it is done, and what it waits on, and the decisions they wait on. A ruling recorded here is written to <code>rulings.json</code>, the rulings record <code>proposals/2026-10-02-rulings.md</code> and <code>proposals/open-issues.md</code>, and the tasks it unblocks change status. Serve the repository with <code>examples/serve.cjs</code> to record one.</p>
    </div>
    <div class="controls"><button type="button" class="cr-button" id="mode" aria-pressed="false">Dark mode</button></div>
  </header>

  <h2>Decisions <small id="decisions-note"></small></h2>
  <div class="decisions" id="decisions"></div>

  <h2>Tasks</h2>
  <section class="summary" aria-label="Totals" id="totals"></section>

  <form class="filters cr-haze" aria-label="Filter the tasks">
    <fieldset><legend>Repository</legend><div class="cr-dock"><div class="cr-dock-inner" id="f-repo"></div></div></fieldset>
    <fieldset><legend>Status</legend><div class="cr-dock"><div class="cr-dock-inner" id="f-status"></div></div></fieldset>
    <fieldset><legend>Priority</legend><div class="cr-dock"><div class="cr-dock-inner" id="f-priority"></div></div></fieldset>
    <label class="search">Search <span class="cr-field-shell"><input class="cr-input" type="search" id="f-text" placeholder="ID, title or path"></span></label>
  </form>

  <p class="muted" role="status" id="shown"></p>
  <div class="board" id="board"></div>
</main>
<script type="application/json" id="data">${json}</script>
<script>
  const data = JSON.parse(document.getElementById('data').textContent);
  const STATUS = { done: ['Done', 'success'], ready: ['Ready', 'info'], blocked: ['Blocked', 'attention'], ruling: ['Needs a ruling', 'attention'], dropped: ['Dropped', 'info'] };
  const DECISION = { open: ['Needs a ruling', 'attention'], ruled: ['Ruled', 'success'], waiting: ['Waits', 'info'], moot: ['Not needed', 'info'] };
  const REPO = { core: 'Crystal core', preview: 'crystal-preview', react: 'Crystal React' };
  const state = { repo: 'all', status: 'all', priority: 'all', text: '' };
  /* Every value is escaped, attributes included, although all of it is this
     folder's own JSON. */
  const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  /* Options are lettered "A." here, not "(a)": Manrope draws "(c)" as a
     copyright sign. The Markdown records keep the house "(c)". */
  const letter = (id) => esc(String(id).toUpperCase()) + '.';

  /* ------------------------------------------------------------ decisions */
  const open = data.decisions.filter((d) => d.state === 'open').length;
  document.getElementById('decisions-note').textContent = open + ' of ' + data.decisions.length + ' need a ruling';

  function decisionCard(d) {
    const [word, tone] = DECISION[d.state];
    const label = d.state === 'waiting' ? 'Waits on ' + d.on.join(', ') : d.state === 'moot' ? 'Not needed after ' + d.by : word;
    const chosen = d.state === 'ruled' ? d.options.find((o) => o.id === d.ruling.option) : null;
    let body = '<p>' + esc(d.summary) + '</p>';
    if (chosen) {
      body += '<div class="ruling"><p><b>Ruled: ' + letter(chosen.id) + ' ' + esc(chosen.label) + '.</b></p>'
        + '<p>By ' + esc(d.ruling.ruledBy) + ' on ' + esc(d.ruling.date) + '. ' + esc(chosen.effects) + '.</p>'
        + (d.ruling.note ? '<p>' + esc(d.ruling.note) + '</p>' : '') + '</div>';
      if (d.history.length > 1) body += '<p class="history">Supersedes ' + (d.history.length - 1) + ' earlier ruling' + (d.history.length > 2 ? 's' : '') + ', kept in the record.</p>';
    }
    if (d.state === 'moot') body += '<p class="history">The ruling on ' + esc(d.by) + ' made this question unnecessary.</p>';
    const decidable = d.state === 'open' || d.state === 'ruled';
    if (decidable) {
      const form = '<form class="rule" data-decision="' + esc(d.id) + '"' + (chosen ? ' hidden' : '') + '>'
        + '<fieldset><legend>Options</legend>'
        + d.options.map((o) => '<label class="option"><input type="radio" name="option-' + esc(d.id) + '" value="' + esc(o.id) + '" required>'
          + '<span>' + letter(o.id) + ' ' + esc(o.label) + (o.recommended ? ' <span class="rec">Recommended</span>' : '') + '</span>'
          + '<span class="effects">' + esc(o.effects) + '.</span></label>').join('')
        + '</fieldset>'
        + '<div class="fields"><label>Ruled by<span class="cr-field-shell"><input class="cr-input" name="ruledBy" required maxlength="80" autocomplete="name"></span></label>'
        + '<label>Note (optional; D-33 option B needs one)<span class="cr-field-shell"><textarea class="cr-input" name="note" maxlength="2000"></textarea></span></label></div>'
        + '<div class="actions"><button type="submit" class="cr-button primary">Record ruling</button>'
        + (chosen ? '<button type="button" class="cr-button quiet" data-cancel>Cancel</button>' : '') + '</div></form>';
      body += form + (chosen ? '<div class="actions"><button type="button" class="cr-button quiet" data-again aria-expanded="false">Rule again</button></div>' : '');
    }
    body += '<p class="muted" role="status" aria-live="polite" data-said></p>';
    return '<article class="decision cr-haze" id="' + esc(d.id) + '" aria-labelledby="dh-' + esc(d.id) + '">'
      + '<header><span class="cr-resin-haze count">' + esc(d.id) + '</span>' + (d.task ? '<span class="cr-resin-haze count">' + esc(d.task) + '</span>' : '')
      + '<span class="cr-status" data-status="' + tone + '">' + esc(label) + '</span></header>'
      + '<h3 id="dh-' + esc(d.id) + '">' + esc(d.title) + '</h3>' + body + '</article>';
  }
  const host = document.getElementById('decisions');
  host.innerHTML = data.decisions.map(decisionCard).join('');

  host.addEventListener('click', (event) => {
    const card = event.target.closest('.decision');
    if (!card) return;
    const form = card.querySelector('form.rule');
    if (event.target.closest('[data-again]')) {
      form.hidden = false;
      event.target.closest('[data-again]').setAttribute('aria-expanded', 'true');
      form.querySelector('input').focus();
    }
    if (event.target.closest('[data-cancel]')) {
      form.hidden = true;
      card.querySelector('[data-again]')?.setAttribute('aria-expanded', 'false');
    }
  });

  /* Recording a ruling: POST to the loopback server, which validates it,
     appends it to rulings.json and applies it. Without the server (a page
     opened from disk) the ruling is offered as a file and a command instead,
     so nothing is lost and nothing is written behind anyone's back. */
  host.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.target;
    const card = form.closest('.decision');
    const said = card.querySelector('[data-said]');
    const entry = {
      decision: form.dataset.decision,
      option: new FormData(form).get('option-' + form.dataset.decision),
      ruledBy: form.elements.ruledBy.value.trim(),
    };
    const note = form.elements.note.value.trim();
    if (note) entry.note = note;
    form.querySelector('[type=submit]').disabled = true;
    said.textContent = 'Recording the ruling on ' + entry.decision + '…';
    try {
      const response = await fetch('/api/rulings', {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(entry),
      });
      const result = await response.json().catch(() => ({}));
      if (response.ok && result.ok) {
        said.textContent = 'Recorded. ' + result.summary + ' Reloading.';
        setTimeout(() => location.reload(), 900);
        return;
      }
      if (response.status === 400) {
        said.textContent = 'Not recorded: ' + (result.problems || ['the server refused it']).join('; ') + '.';
        form.querySelector('[type=submit]').disabled = false;
        return;
      }
      throw new Error('no server');
    } catch {
      const blob = new Blob([JSON.stringify(entry, null, 2) + '\\n'], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'ruling-' + entry.decision + '.json';
      link.textContent = 'Download ' + link.download;
      said.textContent = 'No server to record it. Download the ruling and run, from the repository root: node proposals/2026-10-02-media-text-and-recipe-parity/apply-rulings.mjs ' + link.download;
      said.append(document.createElement('br'), link);
      form.querySelector('[type=submit]').disabled = false;
    }
  });

  /* ---------------------------------------------------------------- tasks */
  /* A dock of radio labels: selection is the checked radio, shown by weight and
     the selected fill (Crystal's .cr-dock), never by a mark. */
  function dock(id, name, options) {
    const hostEl = document.getElementById(id);
    hostEl.innerHTML = options.map(([value, label]) =>
      '<label><input type="radio" name="' + name + '" value="' + value + '"' + (value === 'all' ? ' checked' : '') + '>' + esc(label) + '</label>').join('');
    hostEl.addEventListener('change', (event) => { state[name] = event.target.value; render(); });
  }
  dock('f-repo', 'repo', [['all', 'All'], ['core', 'Core'], ['preview', 'Preview'], ['react', 'React']]);
  dock('f-status', 'status', [['all', 'All'], ['done', 'Done'], ['ready', 'Ready'], ['blocked', 'Blocked'], ['ruling', 'Ruling'], ['dropped', 'Dropped']]);
  dock('f-priority', 'priority', [['all', 'All'], ['P0', 'P0'], ['P1', 'P1'], ['P2', 'P2'], ['P3', 'P3']]);
  document.getElementById('f-text').addEventListener('input', (event) => { state.text = event.target.value.toLowerCase(); render(); });

  const totals = document.getElementById('totals');
  totals.innerHTML = Object.entries(STATUS).map(([key, [word, tone]]) => {
    const n = data.tasks.filter((t) => t.status === key).length;
    return '<div class="total cr-haze"><span class="cr-status" data-status="' + tone + '">' + esc(word) + '</span><strong>' + n + '</strong></div>';
  }).join('');

  function render() {
    const shown = data.tasks.filter((t) => (state.repo === 'all' || t.repo === state.repo)
      && (state.status === 'all' || t.status === state.status)
      && (state.priority === 'all' || t.priority === state.priority)
      && (!state.text || (t.id + ' ' + t.title + ' ' + t.where + ' ' + t.area).toLowerCase().includes(state.text)));
    document.getElementById('shown').textContent = shown.length + ' of ' + data.tasks.length + ' tasks shown';
    document.getElementById('board').innerHTML = shown.map((t) => {
      const [word, tone] = STATUS[t.status];
      return '<article class="task cr-haze" id="' + esc(t.id) + '" aria-labelledby="h-' + esc(t.id) + '">'
        + '<header><span class="cr-resin-haze count">' + esc(t.id) + '</span><span class="cr-resin-haze count">' + esc(t.priority) + '</span>'
        + '<span class="cr-status" data-status="' + tone + '">' + esc(word) + '</span></header>'
        + '<h2 id="h-' + esc(t.id) + '">' + esc(t.title) + '</h2>'
        + '<p class="meta">' + esc(REPO[t.repo]) + ' · ' + esc(t.area) + (t.depends.length ? ' · waits on ' + t.depends.map(esc).join(', ') : '')
        + (t.ruledBy ? ' · by the ruling on <a href="#' + esc(t.ruledBy.decision) + '">' + esc(t.ruledBy.decision) + '</a>' : '') + '</p>'
        + '<p><b>Target.</b> ' + esc(t.target) + '</p>'
        + '<p class="done-when"><b>Done when</b></p><ul>' + t.acceptance.map((a) => '<li>' + esc(a) + '</li>').join('') + '</ul>'
        + '<p class="where"><code>' + esc(t.where) + '</code></p></article>';
    }).join('');
  }
  render();

  const root = document.documentElement;
  const mode = document.getElementById('mode');
  mode.addEventListener('click', () => {
    const dark = root.dataset.crystalMode !== 'dark';
    root.dataset.crystalMode = dark ? 'dark' : 'light';
    mode.setAttribute('aria-pressed', String(dark));
    mode.textContent = dark ? 'Light mode' : 'Dark mode';
  });
</script>
</body>
</html>
`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = render();
  console.log(`tasks.md and examples/tasks.html written: ${result.tasks} tasks, ${result.decisions} decisions.`);
}
