import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync, unlinkSync, openSync, closeSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createTask, recordGate, recordDefect, transition, outputContract, assess, evidenceFromFile } from './task-engine.mjs';

// Inputs are JSON files, avoiding shell interpolation of user requests and secrets.
const [command, statePathArg, inputPath] = process.argv.slice(2);
const statePath = statePathArg && resolve(statePathArg);
const read = path => JSON.parse(readFileSync(path, 'utf8'));
try {
  if (!statePath) throw new Error('Usage: node scripts/autonomous/task-cli.mjs <create|gate|defect|transition|status|output|evidence> <state.json|evidence-file> [input.json]');
  if (command === 'evidence') { console.log(JSON.stringify(evidenceFromFile(statePath, inputPath), null, 2)); }
  else if (['status', 'output'].includes(command)) {
    const task = read(statePath);
    console.log(JSON.stringify(command === 'status' ? { state: task.state, ...assess(task) } : outputContract(task), null, 2));
    if (command === 'status' && assess(task).status !== 'PASS') process.exitCode = 2;
  } else {
    if (!inputPath) throw new Error('Input JSON required');
    const input = read(inputPath);
    mkdirSync(dirname(statePath), { recursive: true });
    let lock;
    try {
      lock = openSync(`${statePath}.lock`, 'wx');
      let next;
      if (command === 'create') {
        next = createTask(input.spec, input.actor);
        if (existsSync(statePath)) {
          const prior = read(statePath);
          if (prior.intakeKey !== next.intakeKey || prior.intakeHash !== next.intakeHash) throw new Error('Existing task intake differs; refusing overwrite');
          next = prior; // Idempotent retry preserves the original ID and execution history.
        }
      } else {
        const current = read(statePath);
        if (command === 'gate') next = recordGate(current, input.gate, input.actor);
        else if (command === 'defect') next = recordDefect(current, input.defect, input.actor);
        else if (command === 'transition') next = transition(current, input.to, input.actor, input.evidence, input.options);
        else throw new Error(`Unknown command: ${command}`);
      }
      writeFileSync(`${statePath}.tmp`, `${JSON.stringify(next, null, 2)}\n`, { flag: 'w' });
      renameSync(`${statePath}.tmp`, statePath);
      console.log(JSON.stringify({ taskId: next.taskId, state: next.state, candidateSha: next.candidateSha }));
    } finally { if (lock !== undefined) { closeSync(lock); unlinkSync(`${statePath}.lock`); } }
  }
} catch (error) { console.error(error.message); process.exitCode = 1; }
