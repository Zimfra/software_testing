---
type: idea
title: Sandcastle runs under the repository rules
summary: Track .sandcastle/ and contain it so npm run check stays green and the Sandcastle agents commit, test and comment under this repository's rules, ready to run unattended later.
tags: [area/agents, area/github, tool/claude-code]
created: 2026-10-13
updated: 2026-10-13
agent: claude-code
status: in-review
owner: human
priority: P2
next_action: Owner reviews and merges the pull request, then decides the open points under Next step.
related: ["[[Run Sandcastle on GitHub issues]]", "[[The privacy scan treats the sandbox user agent as a role name]]"]
evidence:
  - "VERIFIED: scripts/wiki/redaction.test.ts, rewritten test 'the role-name home agent is allowed, and every other home path is flagged for every login' failed before the change (actual: the home path finding, expected: none, for a path under the agent home) and 36 of 36 tests pass after it."
  - "VERIFIED: scripts/sandcastle/already-done.test.ts failed 2 of 5 (at that head; the file now has 9 tests) against a stub that returned every issue (a merged branch was kept; a missing directory did not throw) and passes 5 of 5 against the implementation, which also keeps a tag-only name, a diverged branch and a branch named --all."
  - "VERIFIED: scripts/sandcastle/plan-schema.test.ts failed 1 of 2 (at that head; the file now has 4 tests) against a stub that accepted anything and passes 2 of 2, naming the failing path for eight malformed plans."
  - "VERIFIED: adding a third argument to the pendingIssues call in .sandcastle/main.ts fails npm run typecheck with TS2554, so tsconfig.json really covers the file; restoring it passes."
  - "VERIFIED: node_modules/@ai-hero/sandcastle/package.json lists zod only under devDependencies and its Output.object takes a StandardSchemaV1, so zod is not needed by main.ts; the plan schema is written by hand instead."
  - "VERIFIED: eslint on .sandcastle/main.ts reports 'File ignored because no matching configuration was supplied', so lint skips the file; eslint.config.ts was not changed."
  - "VERIFIED: independent review of a0393b4 (a finder and a verifier in separate contexts) passed npm run check and four mutation controls, and the finder reported one HIGH and five MEDIUM findings, all addressed on this branch: an empty branch created at HEAD was dropped as done (scripts/sandcastle/already-done.test.ts gained cases that failed 1 of the 2 new ones before the fix, and all 9 sandcastle tests pass after), the plan's id and branch were not validated (the refusal test failed at its first new case before the fix, and passes with all five), and the merge prompt, an unqualified gh issue view, the runbook's reasons and five em dashes in .sandcastle/main.ts were corrected."
  - "VERIFIED: after the second independent review of e156675 (finder and verifier, both separate contexts; the verifier passed npm run check and three mutation controls), the finder's findings were fixed test first at ad06b7a: plan-schema.test.ts gained six refusal cases (leading zero, backtick title, multi-line title, blank title, 201-character title, duplicate issue) and already-done.test.ts a branch moved by a reset with no commit; the new plan-schema cases failed at the leading-zero case and the reset case failed before the change, and all 11 sandcastle tests pass after it."
  - "VERIFIED: npm run check at 071ce5c exited 0 with 595 of 595 tests passing (2026-10-13); the earlier head ad06b7a ran 593, and the two tests added since are the fast-forward and rename case and the title normalisation case."
  - "VERIFIED: after the review of 993348c (a finder and a verifier in separate contexts; the verifier passed four mutation controls), the findings were fixed test first at 071ce5c: a title with a backtick was refused and aborted the loop (now normalised; the new case failed before the change), and a fast-forward merge or rename of an empty branch counted as work (the new case failed before the change)."
  - "VERIFIED: after the review of c276e10 (a finder and a verifier in separate contexts; the verifier reproduced 595 of 595 and passed five mutation controls), the findings were fixed test first at 9394b57: already-done.test.ts gained a branch reset past its commits, cherry-pick and revert entries, a missing reflog, and the ahead selector, and plan-schema.test.ts bidi and surrogate-pair titles; before the change already-done.test.ts failed to load (the aheadIssues export was missing), so no single case of that file was observed failing, the new title case failed its assertion, and branch-guard.test.ts failed to load; after it 600 of 600 tests pass at that head in npm run check (2026-10-13)."
  - "VERIFIED: the verifier of c276e10 ran npm run check in this worktree and reproduced 595 of 595; the 610 an earlier verifier reported for 993348c was not reproduced and its cause is UNKNOWN, so that figure is not used here."
  - "UNKNOWN: a merged branch whose tests still fail is dropped as done next round, and a branch with unmerged commits can stall the loop; both are documented limits in the runbook, and the handling is awaiting the owner."
  - "UNKNOWN: whether a half-finished branch should be merged at all; the guard cannot tell partial from complete work, so the limit is documented in the runbook and the implementer prompt asks for an incomplete task to be said so in the issue comment. Awaiting the owner."
  - "VERIFIED: the main-branch refusal is branchRefusal in scripts/sandcastle/branch-guard.ts and its test covers main, a detached HEAD and a feature branch; UNKNOWN: the call in .sandcastle/main.ts is not executed by any test because that file is a top-level loop."
  - "INFERRED: the hand-written schema satisfies Output.object, because plan-schema.test.ts applies the contract read from extractObject in dist/index.js of 0.12.0 (a truthy issues is a failure, otherwise value is returned); extractStructuredOutput is not exported, so the planner itself was not run."
  - "UNKNOWN: whether the prompt changes make the agents follow the commit, staging and no-push rules; no agent was run in this work, and the Docker image was not built."
  - "UNKNOWN: whether gh in the sandbox resolves the fork correctly without -R; the prompts pass -R Zimfra/software_testing and that was not exercised."
  - "UNKNOWN: whether the model id claude-opus-4-8 in .sandcastle/main.ts is current."
---

## Problem

Sandcastle ran once against issue 1 from untracked files in an owner checkout. Its prompts asked
for `RALPH:` commit subjects, told the merger to close issues and left `gh` to guess the
repository, `.sandcastle/Dockerfile` tripped the home-path scan, and a re-run could plan an
issue whose branch was already merged.

## Desired outcome

`.sandcastle/` is tracked without `.env`, `logs/` and `worktrees/`, `npm run check` passes with
it, the agents are told this repository's rules, and a runbook describes the verified setup.

## Next step

Owner points, none decided here:

1. Whether `.sandcastle/Dockerfile` should move to the Node version in `.nvmrc` and a Python
   that can run `evals:test`, so the sandbox can run the whole check.
2. Whether `main.ts` joins lint (it needs three non-null assertions replaced) or stays outside.
3. Whether the reviewer prompt, which is the upstream one, should also name the repository
   review rules, and whether an unattended run needs a notification step first.
4. Which run mode to use unattended, given that the plan and merge phases use the owner's own
   checkout.

## Observations

- `.sandcastle/.env.example` did not exist in the generated directory; this branch adds one
  with variable names and no values. `CLAUDE_CODE_OAUTH_TOKEN` and `ANTHROPIC_API_KEY` come
  from the Sandcastle README; `GH_TOKEN` is what the `gh` CLI reads.
- `.sandcastle/CODING_STANDARDS.md` was the empty scaffold the reviewer loads; it now points to
  `CLAUDE.md` and the rules instead of restating them.
