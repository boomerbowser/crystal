#!/usr/bin/env node
/* Record a ruling and write it where the project keeps rulings.
 *
 *   node proposals/2026-10-02-media-text-and-recipe-parity/apply-rulings.mjs ruling.json
 *   node proposals/2026-10-02-media-text-and-recipe-parity/apply-rulings.mjs
 *
 * With a file (one ruling, or a list of them: `{ decision, option, ruledBy,
 * note? }`), each is validated and appended to rulings.json with today's date.
 * Then, with or without one, everything a ruling touches is regenerated:
 *
 *   - proposals/2026-10-02-rulings.md, the record in the form of the rulings of
 *     29 September: the question, the options with the recommended one marked,
 *     and the answer, who gave it and when.
 *   - proposals/open-issues.md, between `<!-- ruling:D-xx -->` markers at the
 *     end of each entry, and the count at the top. An entry stays open until the
 *     work it decided is built, as every earlier ruling's did.
 *   - tasks.md and examples/tasks.html, whose statuses follow the rulings.
 *
 * Nothing outside proposals/ is written. Crystal React's Slice R is
 * regenerated from the same data by `pnpm run sync:slice-r` in that repository.
 * Applying with nothing new changes nothing, so it is safe to run at any time.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { HERE, describeEffects, effective, load, today, validate } from './rulings-lib.mjs';
import { render } from './render-tasks.mjs';

const PROPOSALS = resolve(HERE, '..');
const RECORD = join(PROPOSALS, '2026-10-02-rulings.md');
const ISSUES = join(PROPOSALS, 'open-issues.md');
const RULINGS = join(HERE, 'rulings.json');

const NUMBER = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];

/** Validate and append rulings. Throws with the problems if any is refused. */
export function record(entries) {
  const { data, record: log } = load();
  for (const entry of entries) {
    const problems = validate(entry, data, log);
    if (problems.length) {
      const error = new Error(`${entry?.decision ?? 'ruling'}: ${problems.join('; ')}`);
      error.problems = problems;
      throw error;
    }
    log.rulings.push({
      decision: entry.decision, option: entry.option, ruledBy: entry.ruledBy.trim(), date: today(),
      ...(entry.note?.trim() ? { note: entry.note.trim() } : {}),
    });
  }
  writeFileSync(RULINGS, JSON.stringify(log, null, 2) + '\n');
}

function writeRecord(data, decisions) {
  const lines = ['# Rulings of October 2026', ''];
  lines.push('Meridian\'s answers to the decisions the proposal of 2 October 2026 left open',
    '([`2026-10-02-media-text-and-recipe-parity.md`](2026-10-02-media-text-and-recipe-parity.md)).',
    'Each question offered its options with their consequences and a recommendation.',
    'This file records the question, the options and the answer, so that the work',
    'built from each can be read against what was decided.', '');
  lines.push('It is generated from `2026-10-02-media-text-and-recipe-parity/rulings.json` by',
    '`apply-rulings.mjs`, which the tasks page calls when a ruling is recorded there.',
    'Edit neither by hand: record a new ruling, which supersedes the old one and',
    'leaves it in the record.', '');
  lines.push('The recommended option is marked **(rec.)**. Every answer below is Meridian\'s,',
    'given by the person named.', '');
  for (const decision of decisions) {
    lines.push(`### ${decision.id} · ${decision.title}`, '');
    lines.push(decision.summary, '');
    for (const option of decision.options) {
      lines.push(`- (${option.id}) ${option.label}${option.recommended ? ' **(rec.)**' : ''}. ${capital(describeEffects(decision, option, data))}.`);
    }
    lines.push('');
    if (decision.state === 'ruled') {
      const option = decision.options.find((o) => o.id === decision.ruling.option);
      lines.push(`**Ruled: (${option.id}) ${option.label}.** By ${decision.ruling.ruledBy}, ${decision.ruling.date}.`);
      if (decision.ruling.note) lines.push('', decision.ruling.note);
      const earlier = decision.history.slice(0, -1);
      if (earlier.length) {
        lines.push('', `Supersedes ${earlier.map((r) => `(${r.option}) by ${r.ruledBy}, ${r.date}`).join('; ')}.`);
      }
    } else if (decision.state === 'moot') {
      lines.push(`**Not needed.** The ruling on ${decision.by} made this question unnecessary.`);
    } else if (decision.state === 'waiting') {
      lines.push(`Not yet ruled. It waits on ${decision.on.join(', ')}.`);
    } else {
      lines.push('Not yet ruled.');
    }
    lines.push('');
  }
  writeFileSync(RECORD, lines.join('\n'));
}

function capital(text) { return text[0].toUpperCase() + text.slice(1); }

function block(id, body) {
  return `<!-- ruling:${id} -->${body ? `\n${body}\n` : ''}<!-- /ruling:${id} -->`;
}

function writeIssues(data, decisions) {
  let text = readFileSync(ISSUES, 'utf8');
  const original = text;

  /* The count at the top, which the first ruling would otherwise leave stale.
     With nothing ruled it is the sentence written by hand on 2 October. */
  const waiting = decisions.filter((d) => d.state === 'open' || d.state === 'waiting').length;
  const ruled = decisions.filter((d) => d.state === 'ruled').length;
  const moot = decisions.filter((d) => d.state === 'moot').length;
  const counted = ruled || moot
    ? `${NUMBER[waiting]} wait${waiting === 1 ? 's' : ''} on a ruling by Meridian; ${NUMBER[ruled].toLowerCase()} ${ruled === 1 ? 'is' : 'are'} ruled ([\`2026-10-02-rulings.md\`](2026-10-02-rulings.md)) and open until built${moot ? `; ${NUMBER[moot].toLowerCase()} ${moot === 1 ? 'is' : 'are'} no longer needed` : ''};\nD-36 is a small defect with a fix specified. Every`
    : `${NUMBER[waiting]} wait on a ruling by Meridian; D-36 is a small defect with a fix specified. Every`;
  /* How many entries are open, and their range, read from the file itself, so
     an entry filed later (D-37) is counted without editing this script. */
  const filed = [...text.matchAll(/^## D-(\d+) · /gm)].map((m) => Number(m[1]));
  const open = `**${NUMBER[filed.length]} entries are open**, D-${Math.min(...filed)} to D-${Math.max(...filed)}`;
  const summary = `${open}, all from the media, text and recipe work of 2 October
2026 ([\`2026-10-02-media-text-and-recipe-parity.md\`](2026-10-02-media-text-and-recipe-parity.md)).
${counted}
decision left on 29 September 2026 was ruled on
([\`2026-09-29-rulings.md\`](2026-09-29-rulings.md)) and is built.`;
  const summaryBlock = `<!-- rulings-summary -->\n${summary}\n<!-- /rulings-summary -->`;
  if (text.includes('<!-- rulings-summary -->')) {
    text = text.replace(/<!-- rulings-summary -->[\s\S]*?<!-- \/rulings-summary -->/, summaryBlock);
  } else {
    const start = text.search(/\*\*\w+ entries are open\*\*/);
    const end = text.indexOf('and is built.', start) + 'and is built.'.length;
    if (start === -1 || end < start) throw new Error('open-issues.md: the summary paragraph is not where it was');
    text = text.slice(0, start) + summaryBlock + text.slice(end);
  }

  for (const decision of decisions) {
    let body = '';
    if (decision.state === 'ruled') {
      const option = decision.options.find((o) => o.id === decision.ruling.option);
      body = `**Ruled on ${decision.ruling.date} by ${decision.ruling.ruledBy}: (${option.id}) ${option.label}.** `
        + `${capital(describeEffects(decision, option, data))}. Recorded in [\`2026-10-02-rulings.md\`](2026-10-02-rulings.md). `
        + (decision.task ? `The entry stays open until the work is built (task ${decision.task}).` : 'Nothing is left to build; the entry closes with the next tracker review.');
      if (decision.history.length > 1) body += ` It supersedes ${decision.history.length - 1} earlier ruling${decision.history.length > 2 ? 's' : ''}.`;
    } else if (decision.state === 'moot') {
      body = `**Not needed.** The ruling on ${decision.by} made this question unnecessary; it closes with ${decision.by}'s work.`;
    }
    const marker = new RegExp(`<!-- ruling:${decision.id} -->[\\s\\S]*?<!-- /ruling:${decision.id} -->`);
    if (marker.test(text)) {
      text = text.replace(marker, block(decision.id, body));
    } else {
      /* First run: the block goes at the end of the entry, before the next one. */
      const heading = text.indexOf(`## ${decision.id} · `);
      if (heading === -1) throw new Error(`open-issues.md has no entry for ${decision.id}`);
      const next = text.indexOf('\n## ', heading + 1);
      const at = next === -1 ? text.length : next + 1;
      text = text.slice(0, at).replace(/\n*$/, '\n\n') + block(decision.id, body) + '\n\n' + text.slice(at);
    }
  }
  if (text !== original) writeFileSync(ISSUES, text);
}

/** Regenerate everything a ruling touches. */
export function apply() {
  const { data, record: log } = load();
  const { decisions } = effective(data, log);
  writeRecord(data, decisions);
  writeIssues(data, decisions);
  render();
  const ruled = decisions.filter((d) => d.state === 'ruled').length;
  return {
    summary: `${ruled} of ${decisions.length} decisions ruled. Written: rulings.json, proposals/2026-10-02-rulings.md, proposals/open-issues.md, tasks.md, examples/tasks.html. In crystal-react, run pnpm run sync:slice-r to update Slice R.`,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const file = process.argv[2];
  try {
    if (file) {
      const parsed = JSON.parse(readFileSync(resolve(file), 'utf8'));
      record(Array.isArray(parsed) ? parsed : [parsed]);
    }
    console.log(apply().summary);
  } catch (error) {
    console.error(`Not recorded. ${error.message}`);
    process.exit(1);
  }
}
