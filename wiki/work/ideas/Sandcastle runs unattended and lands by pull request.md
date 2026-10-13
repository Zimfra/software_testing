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
  - "VERIFIED: after independent review of the first head (finder and verifier, separate contexts; the verifier passed npm run check and three mutation controls), the finder's findings were fixed test first at 51a32b8: afk.test.ts went from 13 to 17 tests (5 of the 17 are new top-level cases) with 7 of its tests red before the change (an empty branch created during the run was announced, an earlier run's merge was announced, the URL was matched from the landing tool's text, the repository name was fixed, and gh was not checked before the loop) and all pass after it."
  - "VERIFIED: npm run check at 51a32b8 exited 0 with 610 of 610 tests passing (2026-10-13), after merging the integration branch at 993348c."
  - "UNKNOWN: the real gh (issue comment, the review request reaching the owner), Docker and the Sandcastle loop were not run; the tests replace them with scripted runners."
  - "UNKNOWN: whether gh pr view <branch> --json url --jq .url returns the URL for a branch pushed by pr-ready under a real gh; the test replaces gh with a scripted runner."
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

1. Whether the wrapper should refuse early when the branch does not contain `origin/main`, or
   when the `gh` login is the owner's, so a long run is not spent before `pr-ready` refuses. It
   now refuses early only when `gh` cannot resolve the repository; the other two checks stay in
   `pr-ready.ts`, which is a different branch's file.
2. Whether a notification channel beyond GitHub is wanted. The brief said none, so none exists.
3. Which of the two comments an issue gets (the merge prompt's and the wrapper's, which names
   the pull request) should stay. Both exist now.
4. An issue merged by an earlier run whose pull request never opened is no longer announced
   again; it needs `npm run pr` by hand.

## Observations

- `.sandcastle/main.ts` is untouched; the wrapper sits in front of it.
- The wrapper imports `spawnRunner` from `scripts/git/pr-ready.ts` rather than copying it, and
  uses a second runner with no timeout for the node steps because `npm run check` runs for minutes.
