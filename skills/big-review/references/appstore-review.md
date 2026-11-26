# App Store review

Phase 4, Phase 5, and Phase 8 support for `big-review`, conditional. Apply when
the diff touches iOS metadata, entitlements, privacy manifests, purchase flows,
account rules that affect App Store policy, or reviewer-facing setup/submission
surfaces.

This lane is about reviewability and obvious rejection-risk surfaces only. It
is not a generic iOS UX pass and not a replacement for the main security or
policy review lanes.

## What to check

- **`Info.plist`, entitlements, and privacy manifest accuracy** — usage
  strings, declared capabilities, associated domains, background modes,
  entitlements, and privacy-manifest declarations match what the changed code
  actually does. Look for stale declarations, newly required reasons that were
  not added, or metadata that now promises behavior the app no longer exposes.
- **In-app purchase and restore clarity** — purchase entry points, product
  descriptions, restore-purchases access, and any reviewer/demo instructions are
  clear enough that a reviewer can complete and re-test the flow without hidden
  setup or guesswork.
- **Sign in with Apple and account-deletion implications** — if the diff
  changes account creation, login providers, subscription/account coupling, or
  delete-account behavior, check whether Sign in with Apple expectations or
  in-app account-deletion expectations changed and whether reviewer notes or
  setup instructions now need to call that out.
- **Reviewer notes, demo data, and test-account readiness** — reviewer-facing
  notes, seeded/demo content, feature flags, region/device prerequisites,
  sandbox purchase accounts, and any required credentials are complete and
  current for the changed flow.
- **Obvious reviewer friction** — the changed path does not depend on hidden
  gestures, unavailable hardware, production-only credentials, broken first-run
  state, or an unexplained paywall/setup dependency that would block review.

## Concrete prompts

- Which changed `Info.plist`, entitlement, or privacy-manifest declaration
  would now be inaccurate if a reviewer exercised the feature?
- If a reviewer starts from a fresh install, exactly how do they purchase,
  restore, and reach the changed paid surface?
- Did the diff change any account rule that makes Sign in with Apple or
  account-deletion expectations newly relevant?
- What reviewer note, test account, sandbox credential, or setup step would a
  human reviewer need to avoid getting stuck?

## Common blockers

- Privacy manifest or usage description no longer matches the app's actual data
  access or device capability usage.
- Purchase path exists but restore is missing, hidden, or impossible for a
  reviewer to trigger reliably.
- Account changes introduce Sign in with Apple or account-deletion expectations
  that are undocumented or untestable.
- Reviewer notes omit required credentials, seed steps, feature-flag state, or
  hardware/region limitations for the changed journey.

## Mutability

- Mutability mode: `report-first`
- Do not auto-fix reviewer-facing submission metadata, reviewer notes, policy
  interpretations, account-rule changes, or substantial submission-note
  rewrites without explicit scope.

## Output

Use this lane for reviewer-friction findings, submission-facing doc/update
requirements, and residual rejection-risk notes tied to the changed iOS surface
only.
