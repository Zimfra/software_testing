---
type: ticket
title: S02 Explicit-checkout command routing
summary: Make an explicit runner cwd authoritative despite inherited Git repository, index or configuration routing.
tags: [area/git, area/typescript, area/planning]
created: 2026-10-16
updated: 2026-10-16
agent: opencode
status: proposed
owner: agent
priority: P1
next_action: Verify this job spec's approval and S01 completion, then reproduce routing through the actual spawnRunner boundary.
idea: "[[Execute the repository audit remediation]]"
project: "[[Repository audit remediation]]"
ticket_kind: build
plan: "[[Repository audit remediation implementation plan]]"
depends_on: ["[[S01 Fixture Git containment]]"]
related: ["[[Repository audit findings 2026-10-16]]"]
evidence:
  - "VERIFIED: this job spec preserves approved slice S02, finding A03 and its S01 prerequisite."
  - "UNKNOWN: job-spec approval and implementation evidence are pending."
---

## Goal

Ensure Git, Node and npm launched with an explicit cwd operate on that identified checkout.

## Inputs

- Plan S02, audit A03, `scripts/git/pr-ready.ts` and `scripts/lib/git.ts`.
- Read `environmentFor`, `gitOptionsAt`, `spawnRunner` and their actual callers before changing them.
- Parent S01 must be completed through its merged implementation PR.

## Approach

1. Use two real disposable repositories and route the inherited environment toward the decoy.
2. Exercise `spawnRunner` itself and apply the shared explicit-checkout environment rule.
3. Preserve the existing omitted-cwd semantics needed by legitimate Git-hook callers.

## Acceptance criteria

- [ ] The old runner fails the explicit-cwd decoy control before the fix.
- [ ] Git inspection and commands launched through Node or npm resolve the selected fixture, not the decoy.
- [ ] The decoy's refs, index, configuration and files remain unchanged.
- [ ] Omitted-cwd hook routing retains the intended behavior; configuration/history injection remains scrubbed.
- [ ] Targeted tests and the full check pass without relaxing the fixture-environment guard.

## Out of scope

Remote freshness, PR identity validation, publication state snapshots and sandbox architecture.

## Allowed files

- `scripts/git/pr-ready.ts`, `scripts/git/pr-ready.test.ts`, `scripts/lib/git.ts`, `scripts/lib/git.test.ts`.
- `scripts/test-support/repo-fixture.ts` only if a reusable fixture capability is required.
- `wiki/lessons/Git hooks route child Git commands to the hooked repository.md`, this ticket and `CHANGELOG.md`.

## Forbidden files

All other files; do not alter real Git configuration, auth profiles, hooks or branch protection to make a control pass.

## Human checkpoints

Verify job-spec approval and the parent's actual landing. Seek owner agreement before changing the omitted-cwd contract or widening file scope.

## Secrets needed

None; fixtures and subprocess output must contain no real credentials.

## Tests and evals

- `node --test scripts/git/pr-ready.test.ts scripts/lib/git.test.ts`; `npm run check`.
- Positive: explicit cwd with an ordinary environment and omitted cwd with intentional hook routing.
- Broken: inherited decoy Git directory/worktree/index/config routes while cwd names another fixture. Assert the actual subprocess result, not only an environment object.

## Rollback and recovery

Use disposable repositories for all routing probes. Revert or repair the change on a new branch/PR if callers regress; never restore state by resetting the real checkout blindly.

## Evidence

Record red/green output, the fixture and decoy state comparisons, exact SHAs and an independent criterion verdict.

## Wiki and doc updates

Update the routing lesson only with observed behavior and update this ticket's status, next action and completion PR.
