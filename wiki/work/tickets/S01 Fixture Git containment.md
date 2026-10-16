---
type: ticket
title: S01 Fixture Git containment
summary: Keep every Python fixture subprocess inside its intended disposable repository when Git routing variables are inherited.
tags: [area/git, area/evals, area/planning]
created: 2026-10-16
updated: 2026-10-16
agent: opencode
status: proposed
owner: agent
priority: P1
next_action: Verify owner approval of this job spec, then implement from an identified root checkout with inherited Git routing scrubbed.
idea: "[[Execute the repository audit remediation]]"
project: "[[Repository audit remediation]]"
ticket_kind: build
plan: "[[Repository audit remediation implementation plan]]"
depends_on: []
related: ["[[Repository audit findings 2026-10-16]]"]
evidence:
  - "VERIFIED: this job spec expands approved slice S01 and finding A02; it has no build-ticket dependencies."
  - "UNKNOWN: job-spec approval and implementation evidence are pending."
---

## Goal

Make Python fixture subprocesses honor their disposable checkout rather than inherited Git routing.

## Inputs

- Approved plan S01 and audit A02; read `ScenarioSetup` and `Baseline` in `evals/compliance/test_run_comply.py`.
- Read `setup_sandbox`, `isolated_env` and subprocess wrappers in `evals/compliance/run_comply.py`.
- Use Node 24 and an identified root checkout. This is the bootstrap ticket before linked-worktree hook checks are safe.

## Approach

1. Reproduce the inherited-routing failure against a disposable decoy, never this repository.
2. Reuse or narrowly extend the existing environment sanitization for fixture callbacks.
3. Add a Python-aware regression control for the fixture subprocess boundary; preserve ordinary setup behavior.

## Acceptance criteria

- [ ] A failing control demonstrates that the old callback targets the decoy when routing variables are inherited.
- [ ] The repaired callback initializes the intended fixture; decoy HEAD, refs, configuration, index and files are unchanged.
- [ ] Cover inherited `GIT_DIR`, `GIT_WORK_TREE`, `GIT_INDEX_FILE` and configuration-injection variables, including shell setup commands.
- [ ] Ordinary setup still creates its files and reports failed commands. The environment control catches the original omission.
- [ ] `npm run evals:test` and `npm run check` pass with the new controls discovered.

## Out of scope

Production network confinement, model credentials, unrelated Git helpers and remediation of other findings.

## Allowed files

- `evals/compliance/test_*.py`; `evals/compliance/run_comply.py` only for shared environment behavior needed by this fix.
- `scripts/toolchain/fixture-env.test.ts` if integration with the existing fixture check is needed.
- `evals/compliance/README.md`, `.claude/skills/write-guard/SKILL.md`, this ticket and `CHANGELOG.md`.

## Forbidden files

All other files; particularly `evals/compliance/netproxy.py`, credential stores, real Git metadata and repository settings.

## Human checkpoints

- Verify the owner-merged job-spec revision and record its PR before implementation.
- Stop for a scope change if the repair requires altering production confinement or installing infrastructure.

## Secrets needed

None. Use synthetic identities and local fixtures; do not read real credentials.

## Tests and evals

- Run `npm run evals:test`, then `npm run check`, with Node 24 and an untainted parent environment.
- Positive: ordinary setup and an explicitly scrubbed callback create the intended repository.
- Broken: inherited decoy routing reaches the wrong repository with the original callback; the fixed path leaves the decoy untouched.
- Test the hook-like environment only inside disposable fixtures. Do not run the unsafe baseline under a real linked-worktree hook.

## Rollback and recovery

Preserve failure logs and fixture state until inspected, then remove only the disposable fixtures.
If the fix cannot establish containment, stop parallel implementation work; repair or revert through a new PR without rewriting history.

## Evidence

Record baseline/head SHAs, red/green commands and exits, decoy state comparisons and the independent verifier's verdict. No implementation result is claimed by this spec.

## Wiki and doc updates

Update the fixture-environment guidance and this ticket's status/evidence. Record completion through the owner-merged implementation PR before children become eligible.
