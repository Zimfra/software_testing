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
  - "VERIFIED: scripts/sandcastle/already-done.test.ts failed 2 of 5 against a stub that returned every issue (a merged branch was kept; a missing directory did not throw) and passes 5 of 5 against the implementation, which also keeps a tag-only name, a diverged branch and a branch named --all."
  - "VERIFIED: scripts/sandcastle/plan-schema.test.ts failed 1 of 2 against a stub that accepted anything and passes 2 of 2, naming the failing path for eight malformed plans."
  - "VERIFIED: adding a third argument to the pendingIssues call in .sandcastle/main.ts fails npm run typecheck with TS2554, so tsconfig.json really covers the file; restoring it passes."
  - "VERIFIED: node_modules/@ai-hero/sandcastle/package.json lists zod only under devDependencies and its Output.object takes a StandardSchemaV1, so zod is not needed by main.ts; the plan schema is written by hand instead."
  - "VERIFIED: eslint on .sandcastle/main.ts reports 'File ignored because no matching configuration was supplied', so lint skips the file; eslint.config.ts was not changed."
  - "VERIFIED: npm run check, run on the branch head before this evidence line was added, exited 0 (lint, typecheck, tests with coverage, evals:test, wiki:lint, skills:lint, governance:check, rules:check, wiki:compliance, changelog:guard and memory:guard)."
  - "VERIFIED: independent review of a0393b4 (a finder and a verifier in separate contexts) passed npm run check and four mutation controls, and the finder reported one HIGH and five MEDIUM findings, all addressed on this branch: an empty branch created at HEAD was dropped as done (scripts/sandcastle/already-done.test.ts gained cases that failed 1 of the 2 new ones before the fix, and all 9 sandcastle tests pass after), the plan's id and branch were not validated (the refusal test failed at its first new case before the fix, and passes with all five), and the merge prompt, an unqualified gh issue view, the runbook's reasons and five em dashes in .sandcastle/main.ts were corrected."
  - "VERIFIED: after the second independent review of e156675 (finder and verifier, both separate contexts; the verifier passed npm run check and three mutation controls), the finder's findings were fixed test first at ad06b7a: plan-schema.test.ts gained six refusal cases (leading zero, backtick title, multi-line title, blank title, 201-character title, duplicate issue) and already-done.test.ts a branch moved by a reset with no commit; the new plan-schema cases failed at the leading-zero case and the reset case failed before the change, and all 11 sandcastle tests pass after it."
  - "VERIFIED: npm run check at ad06b7a exited 0 with 593 of 593 tests passing (2026-10-13), after the first run of the previous head had the changelog guard refuse the word cherry-pick in the entry, which was reworded."
  - "UNKNOWN: whether a half-finished branch should be merged at all; the guard cannot tell partial from complete work, so the limit is documented in the runbook and the implementer prompt asks for an incomplete task to be said so in the issue comment. Awaiting the owner."
  - "UNKNOWN: .sandcastle/main.ts has no test and no refusal on the main branch, because it is a top-level loop; scripts/sandcastle/afk.ts refuses there."
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
