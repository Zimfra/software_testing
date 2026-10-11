---
type: idea
title: Merge backstops close the final audit gaps
summary: The merge hook reads continuations, escapes and shell input; npm run audit fetches first; a pre-merge-commit hook refuses merge commits on main; the merge gate docs match.
tags: [area/git, area/agents]
created: 2026-10-11
updated: 2026-10-11
agent: claude-code
status: done
owner: human
priority: P2
evidence:
  - "OWNER DECISION: \"fix the hardening items in one PR\" (2026-10-11), after the final read-only audit of main at 0ef0253 listed them."
  - "VERIFIED: scripts/claude/block-pr-merge.test.ts failed before the hook change (gh pr merge with a backslash-newline was allowed) and passes after; new allowed cases (a heredoc written to a file, a pipe into grep) stay allowed."
  - "VERIFIED: scripts/git/landing-audit.test.ts: the stale-ref and failed-fetch tests failed before the fetch was added and pass after; npm run audit against GitHub still reports 23 of 23 commits landed by merged pull request."
  - "VERIFIED: scripts/git/hooks.test.ts failed before .githooks/pre-merge-commit existed and passes after; as a control, the same merge on main in a scratch repository with no hook succeeded (exit 0)."
  - "VERIFIED: an ECC security review of e03b796 found bypasses (a mid-word continuation, a quoted-delimiter heredoc ended early, two heredocs on a line, wrapped or other shells, here-strings) and false positives (any quoted string in a command piped to a shell); the test added for them failed at e03b796 and passes after the fix."
  - "VERIFIED: bash 5.3 on 2026-10-11 joined ec, backslash, newline, ho into echo; kept a quoted-delimiter heredoc body as written, so a body line ending in a backslash did not hide the delimiter after it; and joined that line in an unquoted heredoc, so its body ran on to the next delimiter."
  - "VERIFIED: the security re-review of da9a0cd found 40,000 newlines took 13 seconds (16 ms before the change) and that shells behind wrappers with values (sudo -u root bash, env FOO=1 bash, FOO=1 bash) were missed; tests for both failed at da9a0cd (the newline run took 161 seconds) and pass after, 100,000 newlines now judged within the test's 2-second limit."
  - "VERIFIED: the third security review of 53902fc found `a=b|` repeated took 24 seconds for 100 KB, some wrapped shells still missed (sudo -u root -E bash, nice -n 5 bash) and commands naming a shell only as an argument refused (sudo tee bash/notes); tests for these failed at 53902fc and pass after shell detection moved from regexes to the hook's own command parser."
  - "VERIFIED: inputs of about 100 KB made of unterminated heredoc openers (10,000 copies of: cat <<E, newline, x, newline) still take seconds per check, and a hook run makes two checks (merge, then push): the verifier measured 3.7 to 4.2 seconds per check at 2fc725a, about 8 seconds per hook run. The security review found such inputs 2 to 3 times slower than before this branch, and two heredoc-heavy inputs went from under 1 second to 2.6 and 3.6 seconds."
---

## Problem

The final audit of main on 2026-10-11 found four gaps in the local backstops, none of which let
a change reach main without the owner's approval:

- the merge hook missed commands split with `\` and newline, words hidden by a backslash, and
  commands fed to a shell by a heredoc or pipe;
- `npm run audit` trusted a local `origin/main` that might be stale;
- `git merge` on main runs `pre-merge-commit`, which did not exist, so only pre-push refused it;
- the Merge gate contract left out `rules:check` from the guards and one ruleset setting.

## Desired outcome

Each gap has a test that failed before its fix, and the contract describes what runs.

## Next step

None: done with the evidence above.

## Observations

- The hook remains a heuristic: process substitution, decoded input, other interpreters and a
  script written then run are not followed; the ruleset and the owner's review are the control.
- Heredoc-heavy inputs of about 100 KB are left slow (see the evidence): the heredoc scan has
  been quadratic since before this branch, no realistic command has thousands of unterminated
  heredoc openers, and making it linear means rewriting heredoc parsing, which is separate work.
- Commit dc2db33 is labelled `refactor(claude)` but changes behaviour (it blocks more wrapped
  shells and stops four false positives); it should have been `fix(claude)`. The label is left as
  is rather than rewriting the branch's history.
- `evals:test` failed once during review on
  `test_netproxy.Limits.test_a_silent_client_is_dropped_and_excess_connections_are_refused`
  (empty response instead of a 503) and passed on rerun and five runs alone. It looks timing
  dependent and is outside this change; it needs its own work item if it recurs.
