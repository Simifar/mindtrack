# MindTrack: audit regression checklist

## Baseline

- Date: 2026-09-18
- Branch: `codex/mindtrack-audit-stage-0`
- Runtime: Bun 1.3.14, Next.js 16.1.3
- Scope: static export, local browser storage, no backend or account model

| Check | Result | Notes |
| --- | --- | --- |
| `bun install --frozen-lockfile` | PASS | Lockfile unchanged |
| `bun run lint` | PASS | ESLint completed without findings |
| `bun run typecheck` | PASS | TypeScript completed without errors |
| `bun test` | PASS | 15 tests, 44 assertions |
| `bun run build` | PASS | Static routes generated successfully |
| `bun audit` | FAIL (known baseline) | 72 vulnerabilities: 2 critical, 41 high, 25 moderate, 4 low |
| `git diff --check` | PASS | Required again before each stage commit |
| tracked `.env`/database files | PASS | No tracked local secrets or database files |

The audit result is recorded as a baseline finding and is addressed in stage 7.

## Required checks after every stage

- [ ] Inspect the diff and confirm that only the current stage scope changed.
- [ ] `bun run lint`
- [ ] `bun run typecheck`
- [ ] `bun test`
- [ ] `bun run build`
- [ ] `git diff --check`
- [ ] `git status --short`
- [ ] Create a separate commit for the stage only after all applicable checks pass.

## Functional regression checklist

### Drafts and test flow

- [ ] Start a new test, answer a question, reload, and confirm the same question and answer remain.
- [ ] Navigate away from a running test and return; confirm draft state remains.
- [ ] Corrupt or stale draft is ignored safely and starts cleanly.
- [ ] Unknown test code and invalid answer values are rejected safely.
- [ ] "Начать заново" clears only the intended draft.

### Results and imports

- [ ] Complete results calculate the same scores and severity values as before.
- [ ] Incomplete results remain distinguishable from complete results.
- [ ] Valid JSON import works; malformed, oversized, unknown-test, duplicate, partial, and invalid-answer input is rejected safely.
- [ ] "Очистить всё" requires confirmation and handles storage errors.
- [ ] Results update after a change made in another browser tab.

### Diary and visit preparation

- [ ] Diary and visit entries persist after reload.
- [ ] Storage/quota failures produce a user-readable error without losing unrelated data.
- [ ] Changes made in another browser tab are reflected without a full reload.
- [ ] The agreed safety-field behavior is covered by a test.

### Crisis dialog and accessibility

- [ ] PHQ-9 crisis answer opens the crisis flow.
- [ ] Diary and visit safety text follow the same agreed crisis policy.
- [ ] Neutral text does not trigger a false positive.
- [ ] Dialog receives focus on open, traps keyboard focus, closes with Escape, and restores focus.
- [ ] Dialog has the required accessible name and description.
- [ ] Crisis flow is usable at a 390px mobile viewport.

### Navigation and deployment

- [ ] Direct load and reload work for `/`, `/tests`, `/tests/phq-9`, `/tests/phq-9/run`, `/results`, `/diary`, `/visit`, `/about`, `/help`, and `/privacy`.
- [ ] Browser back/forward navigation remains correct.
- [ ] Mobile navigation has no horizontal overflow or clipped controls.
- [ ] Build with `PAGES_BASE_PATH=/mindtrack` uses correct asset and route paths.
- [ ] Static output contains no secrets or unintended absolute paths.

## Stage gate

Do not start the next stage until the current stage has:

1. a reviewed diff limited to its handoff scope;
2. passing applicable automated and browser checks;
3. a separate commit with a descriptive message;
4. no newly discovered problem that changes the scope without an explicit decision.
