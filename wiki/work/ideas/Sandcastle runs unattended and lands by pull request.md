---
type: idea
title: Sandcastle runs unattended and lands by pull request
summary: Wrap the Sandcastle loop in npm run sandcastle:afk so an unattended run ends in a pull request the owner is asked to review and a comment on each issue, with nothing pushed to main.
tags: [area/agents, area/github, tool/claude-code]
created: 2026-10-13
updated: 2026-10-13
agent: claude-code
status: in-progress
owner: human
priority: P2
next_action: Owner reviews the branch, then runs npm run sandcastle:afk once on a throwaway issue with the machine account's gh login to exercise the real gh, Docker and review request, which no test here does.
related: ["[[Run Sandcastle on GitHub issues]]", "[[Sandcastle runs under the repository rules]]", "[[ADR-0025 Agents use a machine account and the owner approves]]"]
evidence:
  - "VERIFIED: scripts/sandcastle/afk.test.ts failed 13 of 13 against a stub main() that returned 0 and did nothing, and passes 13 of 13 against the implementation."
  - "VERIFIED: negative control, removing the filter that drops branches already on origin/main made the selection test fail (1 of 13); making a landing refusal exit 2 instead of 1 made the refusal test fail (1 of 13); restoring the file passed 13 of 13."
  - "VERIFIED: npm run lint and npm run typecheck exit 0 with the wrapper and its test, and node scripts/sandcastle/afk.ts --help prints the usage while an unknown argument exits 2."
  - "VERIFIED: spawnRunner(undefined, 0) from scripts/git/pr-ready.ts runs a command with no timeout and returns its output (sh -c 'echo ok' gave status 0, stdout ok), which is what the loop and the landing step use."
  - "VERIFIED: npm run check, run on commit ef254a0 before this evidence line was added, exited 0 (lint, typecheck, tests with coverage, evals:test, wiki:lint, skills:lint, governance:check, rules:check, wiki:compliance, changelog:guard and memory:guard)."
  - "UNKNOWN: the real gh (issue comment, the review request reaching the owner), Docker and the Sandcastle loop were not run; the tests replace them with scripted runners."
  - "UNKNOWN: whether pr-ready prints the pull request URL in the form the wrapper matches (https://.../pull/N) under a real gh; the test uses the URL shape from pr-ready's own message and pr-ready.test.ts."
---

## Problem

`npm run sandcastle` merges issue branches into the checked-out branch and stops: nothing is
pushed, no pull request is opened and the owner is not told. Going away from the machine meant
coming back to push and open the pull request by hand.

## Desired outcome

One command runs the loop and ends with the work on a pull request the code owner is asked to
review and a comment on each issue naming it, with every merge still the owner's act on GitHub.

## Next step

Owner points, none decided here:

1. Whether the wrapper should refuse early when the branch does not contain `origin/main`, so a
   long run is not spent before `pr-ready` refuses. It currently refuses only at the landing step.
2. Whether a notification channel beyond GitHub is wanted. The brief said none, so none exists.
3. Whether an issue merged by an earlier run whose pull request never opened should be
   announced again (it is, because selection is "merged here, not on origin/main").

## Observations

- `.sandcastle/main.ts` is untouched; the wrapper sits in front of it.
- The wrapper imports `spawnRunner` from `scripts/git/pr-ready.ts` rather than copying it, and
  uses a second runner with no timeout for the node steps because `npm run check` runs for minutes.
