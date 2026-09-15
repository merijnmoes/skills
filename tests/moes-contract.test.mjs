import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);

async function read(path) {
  return readFile(new URL(path, root), 'utf8');
}

function assertIncludesIgnoringCase(actual, expected) {
  assert.ok(
    actual.toLowerCase().includes(expected.toLowerCase()),
    `Expected text to include ${expected}`,
  );
}

test('moes is a public review skill with its own command surface', async () => {
  const skill = await read('skills/moes/SKILL.md');

  assert.match(skill, /^name: moes$/m);
  assert.match(skill, /^description: Use when/m);
  assert.doesNotMatch(skill, /\/forge:review/);
  assert.doesNotMatch(skill, /temper/);

  for (const phrase of [
    '/moes against <branch>',
    'Architecture Map',
    'Finding Set',
    'Verification Ledger',
    'Decision Packet',
    'advisory',
  ]) {
    assertIncludesIgnoringCase(skill, phrase);
  }
});

test('moes shared-file references resolve inside this repo', async () => {
  const skill = await read('skills/moes/SKILL.md');
  const delegation = await read('skills/forge/references/delegation.md');
  const review = await read('skills/forge/references/worker-templates/review.md');

  assertIncludesIgnoringCase(skill, '../forge/references/delegation.md');
  assertIncludesIgnoringCase(skill, '../forge/references/worker-templates/review.md');
  assertIncludesIgnoringCase(delegation, 'wave');
  assertIncludesIgnoringCase(review, 'Covered:');
});

test('moes criticality counterweights hold', async () => {
  const lifecycle = await read('skills/moes/references/findings-lifecycle.md');

  for (const phrase of [
    'mechanism gate',
    'why-no-more-risks',
    'surprise pass',
    'belowBarReason',
    'The low tier is exempt',
    'dismissedLedger',
    'executor of the surprise pass',
    'gap-hunting mode',
    'doubles as the gap-hunt',
    'with a converged audit',
  ]) {
    assertIncludesIgnoringCase(lifecycle, phrase);
  }

  const designQuality = await read('skills/moes/references/design-quality.md');
  const codebaseFit = await read('skills/moes/references/codebase-fit.md');

  for (const phrase of [
    'Red-team presumption',
    'one steelman per unique mechanism',
    'never go through sharded verification',
    'steelmanOf',
  ]) {
    assertIncludesIgnoringCase(designQuality, phrase);
  }

  assertIncludesIgnoringCase(codebaseFit, 'Red-team presumption');

  const arch = await read('skills/moes/references/architecture-review.md');

  for (const phrase of [
    'blocking exception',
    'if and only if the mechanism triple is present',
    'non-exhaustive examples',
  ]) {
    assertIncludesIgnoringCase(arch, phrase);
  }

  const temper = await read('skills/moes/SKILL.md');

  for (const phrase of [
    'executor of the surprise pass',
    'Considered and dismissed',
    'blocking exception',
    'covers steelmans',
  ]) {
    assertIncludesIgnoringCase(temper, phrase);
  }

  const gate = await read('skills/moes/references/validation-gate.md');
  const ledger = await read('skills/moes/references/verification-ledger.md');
  const reporting = await read('skills/moes/references/final-reporting.md');

  assertIncludesIgnoringCase(gate, 'why-no-more-risks');
  assertIncludesIgnoringCase(gate, 'stays reserved');
  assertIncludesIgnoringCase(ledger, 'surprise-pass target');
  assertIncludesIgnoringCase(reporting, 'Considered and dismissed');
});

test('moes lane sharpness holds', async () => {
  const lifecycle = await read('skills/moes/references/findings-lifecycle.md');
  const gate = await read('skills/moes/references/validation-gate.md');
  const skillna = await read('skills/moes/SKILL.md');

  for (const phrase of [
    'why-not',
    'Spot-check N/A claims',
    'converts to a `Plan` finding',
  ]) {
    assertIncludesIgnoringCase(skillna, phrase);
  }

  assertIncludesIgnoringCase(gate, 'contradicted why-not');
  assertIncludesIgnoringCase(gate, 'unconverted, unaccepted');

  const reporting = await read('skills/moes/references/final-reporting.md');

  assertIncludesIgnoringCase(reporting, 'Plan follow-up');

  const security = await read('skills/moes/references/security-review.md');
  const threat = await read('skills/moes/references/threat-model-escalation.md');

  for (const phrase of [
    'requires quoting the guard',
    'keeps a verdict-affecting status',
  ]) {
    assertIncludesIgnoringCase(lifecycle, phrase);
  }

  assertIncludesIgnoringCase(security, 'memory is never evidence');
  assertIncludesIgnoringCase(threat, 'why-not note');
  assertIncludesIgnoringCase(gate, 'missing both');

  const hunt = await read('skills/moes/references/bug-hunting.md');

  for (const phrase of [
    'double-run scenario sketched',
    'cheaper safeguard',
  ]) {
    assertIncludesIgnoringCase(hunt, phrase);
  }

  assertIncludesIgnoringCase(lifecycle, 'race-mechanism triple');
  assertIncludesIgnoringCase(gate, 'race-mechanism blockers');
});

test('moes phase 6 execution discipline holds', async () => {
  const verify = await read('skills/moes/references/verify.md');
  const ledger = await read('skills/moes/references/verification-ledger.md');
  const skill = await read('skills/moes/SKILL.md');
  const gate = await read('skills/moes/references/validation-gate.md');
  const browser = await read('skills/moes/references/browser-qa.md');
  const playwright = await read('skills/moes/references/testing-playwright.md');

  for (const phrase of [
    'Self-first',
    'Discovery is not proof',
    'Timeout with progress',
    'Capability + reachability first',
  ]) {
    assertIncludesIgnoringCase(verify, phrase);
  }

  for (const phrase of ['discovery-only', '~2x timeout', 'actual pass/fail result']) {
    assertIncludesIgnoringCase(ledger, phrase);
  }

  for (const phrase of [
    'Run checks yourself',
    'capability inventory',
    'Discovery runs',
  ]) {
    assertIncludesIgnoringCase(skill, phrase);
  }

  for (const phrase of ['were listed', 'user can run']) {
    assertIncludesIgnoringCase(gate, phrase);
  }

  assertIncludesIgnoringCase(browser, 'run it yourself');
  assertIncludesIgnoringCase(playwright, '--list');
  assertIncludesIgnoringCase(playwright, 'discovery only');
});
