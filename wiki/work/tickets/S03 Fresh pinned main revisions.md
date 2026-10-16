---
type: ticket
title: S03 Fresh pinned main revisions
summary: Make readiness and audit callers compare against an explicitly refreshed and pinned main commit, including narrowed fetch refspecs.
tags: [area/git, area/github, area/planning]
created: 2026-10-16
updated: 2026-10-16
agent: opencode
status: proposed
owner: agent
priority: P1
next_action: Verify job-spec approval and S02 completion, then build local bare-origin freshness controls.
idea: "[[Execute the repository audit remediation]]"
project: "[[Repository audit remediation]]"
ticket_kind: build
plan: "[[Repository audit remediation implementation plan]]"
depends_on: ["[[S02 Explicit-checkout command routing]]"]
related: ["[[Repository audit findings 2026-10-16]]"]
evidence:
  - "VERIFIED: this job spec preserves approved slice S03, finding A09 and its S02 prerequisite."
  - "UNKNOWN: job-spec approval and implementation evidence are pending."
---

## Goal

Ensure successful fetch/readiness checks use the intended remote main revision rather than a stale tracking ref.

## Inputs

- Plan S03 and audit A09; inspect `pr-ready.ts`, `landing-audit.ts` and AFK's existing explicit-destination fetch.
- Read S02's landed runner contract and existing local bare-origin fixtures.

## Approach

1. Reproduce success into FETCH_HEAD while a narrowed mapping leaves origin/main stale.
2. Refresh the intended destination explicitly and capture the verified commit used by later comparisons.
3. Apply the same boundary behavior to relevant callers, preserving before/after-loop refusal versus failure semantics.

## Acceptance criteria

- [ ] The old readiness/audit path fails a stale-ref control backed by a real local bare origin.
- [ ] A successful refresh identifies the correct main commit even with narrowed refspecs or an absent tracking ref.
- [ ] Unreachable origin, timeout, missing main and unreadable/noncommit results cannot become a passing comparison.
- [ ] Later comparisons use the captured revision; unrelated remote refs are not rewritten.
- [ ] Targeted Git/Sandcastle tests and the full check pass.

## Out of scope

Changing audit scope, PR destination semantics, authenticated services or general network retries.

## Allowed files

- `scripts/git/pr-ready.ts`, `scripts/git/pr-ready.test.ts`, `scripts/git/landing-audit.ts`, `scripts/git/landing-audit.test.ts`.
- `scripts/sandcastle/afk.ts`, `scripts/sandcastle/afk*.test.ts`, `scripts/lib/git.ts`, `scripts/lib/git.test.ts`.
- `wiki/reference/Merge gate contract.md`, this ticket and `CHANGELOG.md`.

## Forbidden files

All other files; never change the real origin or fetch configuration as a regression fixture.

## Human checkpoints

Verify approval and parent landing. Ask before altering public exit semantics or introducing a new retry policy.

## Secrets needed

None. Use local bare origins and scripted failures, not live GitHub credentials.

## Tests and evals

- `node --test "scripts/git/*.test.ts" "scripts/sandcastle/afk*.test.ts"`; `npm run check`.
- Positive: normal and narrowed mappings both capture the advertised main SHA.
- Broken: a preexisting stale ref plus narrowed mapping, failed fetch, absent main and changed ref after capture. Check the compared SHA, not just fetch exit status.

## Rollback and recovery

Retain failing fixture logs before cleanup. Repair/revert through a new PR; never reset or rewrite the real remote-tracking refs to imitate the test.

## Evidence

Record the advertised, fetched and compared fixture SHAs, each error case's exit, and independent verification.

## Wiki and doc updates

Describe exactly what freshness is established in the merge-gate contract and update this ticket's completion evidence.
