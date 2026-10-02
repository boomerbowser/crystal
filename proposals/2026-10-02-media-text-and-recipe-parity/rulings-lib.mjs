/* Decisions, rulings and what they do to the tasks.
 *
 * tasks.json holds the tasks as they stand with no ruling made, and the
 * decisions with each option's effects. rulings.json holds every ruling ever
 * recorded, oldest first. Nothing writes a ruling's consequence into
 * tasks.json: the effective state is computed here, every time, from the two.
 * That is what lets a decision be ruled again (the newer ruling supersedes,
 * and the older one's effects simply stop applying) and what makes applying
 * twice the same as applying once.
 *
 * An option's effects are declarative, so this file holds no decision logic
 * of its own:
 *   task   status, and optionally a new target, for the decision's own task
 *   tasks  the same for other tasks, by id
 *   add    follow-up tasks the ruling creates
 *   moots  decisions this ruling makes unnecessary
 * A decision with `after` cannot be ruled until those decisions are, and a
 * task that depends on a decision id waits until that decision is ruled.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HERE = dirname(fileURLToPath(import.meta.url));

export function load() {
  return {
    data: JSON.parse(readFileSync(join(HERE, 'tasks.json'), 'utf8')),
    record: JSON.parse(readFileSync(join(HERE, 'rulings.json'), 'utf8')),
  };
}

/** The ruling in force for each decision: the newest one recorded. */
export function inForce(record) {
  const current = new Map();
  for (const ruling of record.rulings) current.set(ruling.decision, ruling);
  return current;
}

/** Whether a decision can be ruled now, and if not, why. */
export function decisionState(decision, current, mooted) {
  if (mooted.has(decision.id)) return { state: 'moot', by: mooted.get(decision.id) };
  if (current.has(decision.id)) return { state: 'ruled', ruling: current.get(decision.id) };
  const waiting = decision.after.filter((id) => !current.has(id));
  if (waiting.length) return { state: 'waiting', on: waiting };
  return { state: 'open' };
}

/** The tasks and decisions as they stand once the rulings in force apply. */
export function effective(data, record) {
  const current = inForce(record);
  const options = new Map(data.decisions.map((d) => [d.id, new Map(d.options.map((o) => [o.id, o]))]));

  /* Moots first, because a mooted decision's own ruling no longer applies. */
  const mooted = new Map();
  for (const [id, ruling] of current) {
    for (const target of options.get(id)?.get(ruling.option)?.effects?.moots ?? []) mooted.set(target, id);
  }

  const tasks = data.tasks.map((task) => ({ ...task, depends: [...task.depends] }));
  const byId = new Map(tasks.map((task) => [task.id, task]));
  const apply = (task, change, ruling) => {
    if (!task) return;
    /* A ruling makes a task ready; building it makes it done, and a ruling
       already in force does not undo that. */
    if (change.status && task.status !== 'done') task.status = change.status;
    if (change.target) task.target = change.target;
    task.ruledBy = { decision: ruling.decision, option: ruling.option };
  };

  for (const decision of data.decisions) {
    const state = decisionState(decision, current, mooted);
    if (state.state !== 'ruled') continue;
    const option = options.get(decision.id).get(state.ruling.option);
    const effects = option?.effects ?? {};
    if (decision.task && effects.task) apply(byId.get(decision.task), effects.task, state.ruling);
    for (const [id, change] of Object.entries(effects.tasks ?? {})) apply(byId.get(id), change, state.ruling);
    for (const added of effects.add ?? []) {
      if (byId.has(added.id)) continue;
      const task = { ...added, depends: [...added.depends], ruledBy: { decision: decision.id, option: option.id } };
      tasks.push(task);
      byId.set(task.id, task);
    }
  }
  /* A decision's own task with no effect for the chosen option (D-33 has none)
     keeps its status; a mooted decision's task is dropped. */
  for (const decision of data.decisions) {
    if (decision.task && mooted.has(decision.id)) {
      const task = byId.get(decision.task);
      if (task) task.status = 'dropped';
    }
  }
  /* A task blocked only on decisions is ready once they are all ruled. */
  for (const task of tasks) {
    const onDecisions = task.depends.filter((id) => id.startsWith('D-'));
    if (task.status === 'blocked' && onDecisions.length && onDecisions.every((id) => current.has(id) || mooted.has(id))
      && task.depends.every((id) => id.startsWith('D-'))) task.status = 'ready';
  }

  const decisions = data.decisions.map((decision) => ({
    ...decision, ...decisionState(decision, current, mooted),
    history: record.rulings.filter((ruling) => ruling.decision === decision.id),
  }));
  return { tasks, decisions, current, mooted };
}

/** A sentence saying what an option does, for the page and the record. */
export function describeEffects(decision, option, data) {
  const effects = option.effects ?? {};
  const parts = [];
  const word = { ready: 'becomes ready', done: 'is done', dropped: 'is dropped', blocked: 'stays blocked' };
  if (decision.task && effects.task) parts.push(`${decision.task} ${word[effects.task.status] ?? effects.task.status}`);
  for (const [id, change] of Object.entries(effects.tasks ?? {})) parts.push(`${id} ${word[change.status] ?? change.status}`);
  for (const added of effects.add ?? []) parts.push(`adds ${added.id}, ${added.title.replace(/ \(D-\d+\)$/, '')}`);
  for (const id of effects.moots ?? []) parts.push(`${id} no longer needs a ruling`);
  const waiting = data.tasks.filter((task) => task.depends.includes(decision.id)).map((task) => task.id);
  if (waiting.length && !(effects.tasks && waiting.every((id) => effects.tasks[id]))) parts.push(`unblocks ${waiting.join(', ')}`);
  return parts.length ? parts.join('; ') : 'records the answer; no task changes';
}

/** Check a ruling before it is recorded. Returns a list of problems. */
export function validate(entry, data, record) {
  const problems = [];
  const allowed = new Set(['decision', 'option', 'ruledBy', 'note']);
  for (const key of Object.keys(entry ?? {})) if (!allowed.has(key)) problems.push(`unexpected field "${key}"`);
  const decision = data.decisions.find((d) => d.id === entry?.decision);
  if (!decision) { problems.push(`no decision "${entry?.decision}"`); return problems; }
  if (!decision.options.some((o) => o.id === entry.option)) problems.push(`${decision.id} has no option "${entry.option}"`);
  if (typeof entry.ruledBy !== 'string' || !entry.ruledBy.trim()) problems.push('a ruling must say who made it');
  else if (entry.ruledBy.length > 80) problems.push('ruledBy is longer than 80 characters');
  if (entry.note !== undefined && (typeof entry.note !== 'string' || entry.note.length > 2000)) problems.push('note must be text of at most 2000 characters');
  if (decision.id === 'D-33' && entry.option === 'b' && !entry.note?.trim()) problems.push('D-33 (b) needs the note to say what was meant');
  const { decisions } = effective(data, record);
  const state = decisions.find((d) => d.id === decision.id);
  /* Recording the ruling already in force again would only add noise to the
     record; a change of mind is a different option or a different note. */
  if (state.state === 'ruled' && state.ruling.option === entry.option && (state.ruling.note ?? '') === (entry.note?.trim() ?? '')) {
    problems.push(`${decision.id} (${entry.option}) is already the ruling in force`);
  }
  if (state.state === 'waiting') problems.push(`${decision.id} waits on ${state.on.join(', ')}`);
  if (state.state === 'moot') problems.push(`${decision.id} was made unnecessary by ${state.by}`);
  return problems;
}

/** Today, as the record writes dates. */
export function today() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
