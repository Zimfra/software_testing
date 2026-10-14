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
  - "VERIFIED: after the second independent review of 0bc08dd (a finder and a verifier in separate contexts; the verifier passed npm run check and four mutation controls on named tests), the findings were fixed test first at e1fd25a: afk.test.ts has 24 tests, with 7 failing entries before the change (the announce test for its wording, the earlier-run test, the refusals suite with its new gh case, a branch switch during the loop, a HEAD that moved with nothing announceable, and a leading-zero branch), and the failing git status and failing second fetch cases pin behaviour that already threw."
  - "VERIFIED: npm run check at e1fd25a exited 0 with 619 of 619 tests passing (2026-10-13), after merging the integration branch at c276e10."
  - "UNKNOWN: whether commits reach the host branch under a real Sandcastle run only through reflog commit entries; the wrapper exits 2 when HEAD moves with nothing announceable, so a different path fails loudly instead of reporting success."
  - "UNKNOWN: an owner decision on automatic issue comments; the brief asked for the owner to be told when work is done and no dated quote of that is recorded here."
  - "VERIFIED: after the review of d207c67 (a finder and a verifier in separate contexts; the verifier passed npm run check at 619 of 619 and six mutation controls on named tests), the findings were fixed test first at 4d3a72a: afk.test.ts now has 31 tests; the new cases (a landing failure that says a push may have happened, a failing loop that says issues may be merged, earlier work unpushed and pushed, an unrecognised branch exiting 2 after landing the rest, a timed-out gh comment, a different repository refused) were red before the change, with 8 failing entries in that run, and a branchWork test pins the empty, worked and unrecognised classes in already-done.test.ts."
  - "VERIFIED: npm run check at 4d3a72a exited 0 with 632 of 632 tests passing (2026-10-13); the first run failed only the known flaky evals test test_netproxy (a 503 not seen from a socket), and the rerun passed."
  - "VERIFIED: after the review of 10782ea (a finder and a verifier in separate contexts; the verifier passed npm run check at 632 of 632 and seven mutation controls on named tests), the finder's HIGH finding (an empty issue branch from an earlier run made later empty runs exit 2) and its MEDIUM findings were fixed test first at e21c7f7: the empty-branch case, the pushed-earlier-work case after a later local commit, the dirty tree and mid-merge cases and the unresolvable-gh case failed before the change, and the test that ties the prompts' -R repository to PROMPT_REPO passes and pins them; afk.test.ts has 38 tests."
  - "VERIFIED: npm run check at e21c7f7 exited 0 with 640 of 640 tests passing (2026-10-13), after merging the integration branch at 138a816."
  - "VERIFIED: after the review of 8239586 (a finder and a verifier in separate contexts; the verifier passed seven mutation controls on named tests), the finder's HIGH finding (an empty leftover branch that the loop then worked and merged was treated as earlier work, so nothing landed) and its MEDIUM finding (pushed work with no pull request exited 0) were fixed test first at 89ba1d7: both new cases failed before the change, the clean mid-merge case and the prompt-repository tie already passed and stay as guards, afk.test.ts has 41 tests, and npm run check at 89ba1d7 exited 0 with 646 of 646 tests passing (2026-10-13)."
  - "VERIFIED: npm run check at 8239586 in the AFK worktree exited 0 with 640 of 640 tests passing (author's own rerun, 2026-10-13); the verifier of that head reported 602 where it ran, which equals the integration branch's count and is UNKNOWN in cause, so it is not used here."
  - "UNKNOWN: whether a real Sandcastle run writes commit entries into the host branch reflog; the wrapper exits 2 instead of announcing when it does not."
  - "VERIFIED: after the review of 4a374a7 (a finder and a verifier in separate contexts; the verifier passed seven mutation controls on named tests and reproduced 646 of 646), the findings were fixed test first at 94f16e6: earlier work is now judged by branch tips (an unrecognised branch whose reflog expired no longer exits 2 on every run, and an earlier branch the run extends and merges again is announced), a worked branch the run left unmerged exits 2, and only an OPEN pull request counts; the new cases failed before the change (13 of 47 entries, most because the gh view output format changed with the fix) and afk.test.ts now has 47 test entries, and npm run check at 94f16e6 exited 0 with 655 of 655 tests passing (2026-10-13)."
  - "UNKNOWN: a comment that failed after the pull request opened is not visible to a rerun, so a rerun exits 0 when earlier work is pushed and has an open pull request; the failed comment is never retried."
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

1. Whether the wrapper should also refuse early when the branch does not contain `origin/main`,
   or when the `gh` login is the owner's, so a long run is not spent before `pr-ready` refuses.
   It refuses early on branch, tree and an unresolvable repository; the other two checks stay
   in `scripts/git/pr-ready.ts`, which is a different branch's file.
2. Whether a notification channel beyond GitHub is wanted. None exists.
3. Which of the two comments an issue gets (the merge prompt's, and the wrapper's, which names
   the pull request) should stay. Both exist now.
4. An issue merged by an earlier run is named in a warning and not commented on again. When
   nothing new was merged and that earlier work is not on origin, the run exits 2 and says to
   land it with `npm run pr`; once it is pushed and has an open pull request the run exits 0 with a note, and without one it exits 2. Whether a rerun
   should instead land and announce it is the owner's call.
5. `.sandcastle/main.ts` ends with "All done." and exit 0 even when every agent failed, so a
   total failure looks like an empty queue to this wrapper.

## Observations

- `.sandcastle/main.ts` is untouched; the wrapper sits in front of it.
- The wrapper imports `spawnRunner` from `scripts/git/pr-ready.ts` rather than copying it, and
  uses a second runner with no timeout for the node steps because `npm run check` runs for minutes.
