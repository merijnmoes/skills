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

test('big-review is a public review skill with its own command surface', async () => {
  const skill = await read('skills/big-review/SKILL.md');

  assert.match(skill, /^name: big-review$/m);
  assert.match(skill, /^description: Use when/m);
  assert.doesNotMatch(skill, /\/moes\b/);
  assert.doesNotMatch(skill, /temper/);

  for (const phrase of [
    '/big-review against <branch>',
    'Architecture Map',
    'Finding Set',
    'Verification Ledger',
    'Decision Packet',
    'advisory',
  ]) {
    assertIncludesIgnoringCase(skill, phrase);
  }
});

test('big-review shared-file references resolve inside this repo', async () => {
  const skill = await read('skills/big-review/SKILL.md');
  const delegation = await read('skills/big-review/references/delegation.md');
  const review = await read('skills/big-review/references/worker-templates/review.md');

  assertIncludesIgnoringCase(skill, 'references/delegation.md');
  assertIncludesIgnoringCase(skill, 'references/worker-templates/review.md');
  assertIncludesIgnoringCase(delegation, 'wave');
  assertIncludesIgnoringCase(review, 'Covered:');
});

test('big-review criticality counterweights hold', async () => {
  const lifecycle = await read('skills/big-review/references/findings-lifecycle.md');

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

  const designQuality = await read('skills/big-review/references/design-quality.md');
  const codebaseFit = await read('skills/big-review/references/codebase-fit.md');

  for (const phrase of [
    'Red-team presumption',
    'one steelman per unique mechanism',
    'never go through sharded verification',
    'steelmanOf',
  ]) {
    assertIncludesIgnoringCase(designQuality, phrase);
  }

  assertIncludesIgnoringCase(codebaseFit, 'Red-team presumption');

  const arch = await read('skills/big-review/references/architecture-review.md');

  for (const phrase of [
    'blocking exception',
    'if and only if the mechanism triple is present',
    'non-exhaustive examples',
  ]) {
    assertIncludesIgnoringCase(arch, phrase);
  }

  const temper = await read('skills/big-review/SKILL.md');

  for (const phrase of [
    'executor of the surprise pass',
    'Considered and dismissed',
    'blocking exception',
    'covers steelmans',
  ]) {
    assertIncludesIgnoringCase(temper, phrase);
  }

  const gate = await read('skills/big-review/references/validation-gate.md');
  const ledger = await read('skills/big-review/references/verification-ledger.md');
  const reporting = await read('skills/big-review/references/final-reporting.md');

  assertIncludesIgnoringCase(gate, 'why-no-more-risks');
  assertIncludesIgnoringCase(gate, 'stays reserved');
  assertIncludesIgnoringCase(ledger, 'surprise-pass target');
  assertIncludesIgnoringCase(reporting, 'Considered and dismissed');
});

test('big-review lane sharpness holds', async () => {
  const lifecycle = await read('skills/big-review/references/findings-lifecycle.md');
  const gate = await read('skills/big-review/references/validation-gate.md');
  const skillna = await read('skills/big-review/SKILL.md');

  for (const phrase of [
    'why-not',
    'Spot-check N/A claims',
    'converts to a `Plan` finding',
  ]) {
    assertIncludesIgnoringCase(skillna, phrase);
  }

  assertIncludesIgnoringCase(gate, 'contradicted why-not');
  assertIncludesIgnoringCase(gate, 'unconverted, unaccepted');

  const reporting = await read('skills/big-review/references/final-reporting.md');

  assertIncludesIgnoringCase(reporting, 'Plan follow-up');

  const security = await read('skills/big-review/references/security-review.md');
  const threat = await read('skills/big-review/references/threat-model-escalation.md');

  for (const phrase of [
    'requires quoting the guard',
    'keeps a verdict-affecting status',
  ]) {
    assertIncludesIgnoringCase(lifecycle, phrase);
  }

  assertIncludesIgnoringCase(security, 'memory is never evidence');
  assertIncludesIgnoringCase(threat, 'why-not note');
  assertIncludesIgnoringCase(gate, 'missing both');

  const hunt = await read('skills/big-review/references/bug-hunting.md');

  for (const phrase of [
    'double-run scenario sketched',
    'cheaper safeguard',
  ]) {
    assertIncludesIgnoringCase(hunt, phrase);
  }

  assertIncludesIgnoringCase(lifecycle, 'race-mechanism triple');
  assertIncludesIgnoringCase(gate, 'race-mechanism blockers');
});

test('big-review phase 6 execution discipline holds', async () => {
  const verify = await read('skills/big-review/references/verify.md');
  const ledger = await read('skills/big-review/references/verification-ledger.md');
  const skill = await read('skills/big-review/SKILL.md');
  const gate = await read('skills/big-review/references/validation-gate.md');
  const browser = await read('skills/big-review/references/browser-qa.md');
  const playwright = await read('skills/big-review/references/testing-playwright.md');

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

test('big-review regression guards hold', async () => {
  const skill = await read('skills/big-review/SKILL.md');
  const lifecycle = await read('skills/big-review/references/findings-lifecycle.md');
  const spec = await read('skills/big-review/references/spec-conformance.md');
  const context = await read('skills/big-review/references/project-context.md');

  for (const phrase of [
    'spec hierarchy',
    'feature-diff as protected',
    'Classify before you change',
    'Local workflow beats general knowledge',
    'Snapshot the review start',
    'Fix preview and post-fix guard',
  ]) {
    assertIncludesIgnoringCase(skill, phrase);
  }

  assertIncludesIgnoringCase(lifecycle, 'Classify first');
  assertIncludesIgnoringCase(spec, 'never treat existing feature-diff logic as removable');
  assertIncludesIgnoringCase(context, 'generated files are read-only');
});

test('big-review includes deep correctness and maintainability review passes', async () => {
  const skill = await read('skills/big-review/SKILL.md');
  const codeReview = await read('skills/big-review/references/code-review.md');
  const refactoring = await read('skills/big-review/references/refactoring.md');

  for (const phrase of [
    'C5 compatibility and gates',
    'Q4 deep maintainability',
    'fresh-context, read-only pass',
  ]) {
    assertIncludesIgnoringCase(skill, phrase);
  }

  for (const phrase of [
    'developer workflows',
    'feature-gated paths remain gated',
    'intended breakage',
    'review discussion',
  ]) {
    assertIncludesIgnoringCase(codeReview, phrase);
  }

  for (const phrase of [
    'Deep maintainability pass',
    'behavior-preserving',
    'below 1,000 lines to above 1,000',
    'unnecessarily sequential',
  ]) {
    assertIncludesIgnoringCase(refactoring, phrase);
  }
});

test('big-review records design quality separately from its verdict', async () => {
  const skill = await read('skills/big-review/SKILL.md');
  const finalReporting = await read('skills/big-review/references/final-reporting.md');
  const findingsLifecycle = await read('skills/big-review/references/findings-lifecycle.md');
  const designQuality = await read('skills/big-review/references/design-quality.md');

  assert.match(skill, /references\/design-quality\.md/);
  assert.match(skill, /\| 4 — Audit \|[^\n]*`Finding Set`, `Design Quality Notes`, specialty lane registry/);
  assert.match(skill, /\| 7 — Validation gate \|[^\n]*`Evidence Pack`, `Finding Set`, `Design Quality Notes`, `Verification Ledger`/);
  assertIncludesIgnoringCase(finalReporting, 'What went right');
  assertIncludesIgnoringCase(finalReporting, 'evidence-backed examples worth preserving');

  for (const document of [skill, finalReporting, findingsLifecycle, designQuality]) {
    assert.match(document, /Learning notes?/i);
    assert.match(document, /Design Quality Notes/i);
  }

  for (const phrase of [
    'why it matters',
    'trade-off',
    'drawback',
    'when not to apply',
    'alternative',
    'mechanism',
  ]) {
    assertIncludesIgnoringCase(finalReporting, phrase);
    assertIncludesIgnoringCase(findingsLifecycle, phrase);
  }
});

test('big-review audit fan-out includes coverage receipts and risk lanes', async () => {
  const skill = await read('skills/big-review/SKILL.md');

  for (const phrase of [
    'line-walk',
    'removed-behavior',
    'cross-file tracer',
    'language-pitfall',
    'compatibility and gates',
    'deep maintainability',
    'personas',
    'specialized finders',
    'Covered:',
    'territory',
    'effort',
  ]) {
    assertIncludesIgnoringCase(skill, phrase);
  }
});

test('big-review separates correctness, codebase fit, and maintainability lanes', async () => {
  const codeReview = await read('skills/big-review/references/code-review.md');
  const codebaseFit = await read('skills/big-review/references/codebase-fit.md');
  const designQuality = await read('skills/big-review/references/design-quality.md');
  const refactoring = await read('skills/big-review/references/refactoring.md');

  for (const phrase of [
    'C1 line-walk',
    'C2 removed-behavior',
    'C3 cross-file tracer',
    'C4 language-pitfall',
    'C5 compatibility and gates',
    'removed exports',
    'consumer direction',
    'producer direction',
    'Finding Set',
  ]) {
    assertIncludesIgnoringCase(codeReview, phrase);
  }

  for (const phrase of ['Q1 reuse', 'Q3 consistency']) {
    assertIncludesIgnoringCase(codebaseFit, phrase);
  }

  assertIncludesIgnoringCase(designQuality, 'Q2 altitude');
  assertIncludesIgnoringCase(refactoring, 'Deep maintainability pass');
});

test('big-review delegates review waves with bounded worker templates', async () => {
  const delegation = await read('skills/big-review/references/delegation.md');
  const review = await read('skills/big-review/references/worker-templates/review.md');

  for (const phrase of [
    'wave',
    'shared context packet',
    'coverage receipt',
    'throwaway worktree',
    'must not spawn its own workers',
  ]) {
    assertIncludesIgnoringCase(delegation, phrase);
  }

  assertIncludesIgnoringCase(review, 'Covered:');
  assertIncludesIgnoringCase(review, 'must not mutate');
});

test('big-review architecture lane builds an advisory map', async () => {
  const architecture = await read('skills/big-review/references/architecture-review.md');
  const pack = await read('skills/big-review/references/evidence-pack.md');
  const skill = await read('skills/big-review/SKILL.md');

  for (const phrase of [
    'Architecture Map',
    'advisory',
    'change amplification',
    'pattern shopping',
  ]) {
    assertIncludesIgnoringCase(architecture, phrase);
  }

  assertIncludesIgnoringCase(pack, 'Architecture Map');
  assertIncludesIgnoringCase(skill, 'architecture-review.md');
});

test('big-review findings require concrete scenarios and structured evidence', async () => {
  const lifecycle = await read('skills/big-review/references/findings-lifecycle.md');

  for (const phrase of [
    'failure scenario',
    'sharded verification',
    'reverse audit',
    'dry rounds',
    'shortSummary',
    'locations',
    'outcomes ledger',
    'Too speculative',
  ]) {
    assertIncludesIgnoringCase(lifecycle, phrase);
  }
});

test('big-review verification ledger and report carry the audit trail', async () => {
  const ledger = await read('skills/big-review/references/verification-ledger.md');
  const gate = await read('skills/big-review/references/validation-gate.md');
  const reporting = await read('skills/big-review/references/final-reporting.md');

  for (const phrase of ['verify shards', 'audit rounds', 'capped', 'converged']) {
    assertIncludesIgnoringCase(ledger, phrase);
  }

  assertIncludesIgnoringCase(gate, 'audit rounds');
  assertIncludesIgnoringCase(reporting, 'Architecture Map');
});

test('big-review dogfood safeguards remain wired into the workflow', async () => {
  const skill = await read('skills/big-review/SKILL.md');
  const lifecycle = await read('skills/big-review/references/findings-lifecycle.md');
  const pack = await read('skills/big-review/references/evidence-pack.md');
  const architecture = await read('skills/big-review/references/architecture-review.md');
  const reporting = await read('skills/big-review/references/final-reporting.md');

  for (const phrase of [
    'references/code-review.md',
    'after the reverse audit',
    'shared context packet',
    'pre-screen',
    'minimal Map sketch',
    'cross-module shape',
    'QA worker role',
  ]) {
    assertIncludesIgnoringCase(skill, phrase);
  }

  for (const phrase of [
    'trigger plus the wrong outcome',
    'maps to `deferred`',
    'maps to `dropped`',
    'Map digest',
  ]) {
    assertIncludesIgnoringCase(lifecycle, phrase);
  }

  assertIncludesIgnoringCase(pack, 'pending');
  assertIncludesIgnoringCase(architecture, 'not registered');
  assertIncludesIgnoringCase(reporting, 'Omit the Map embed');
});
