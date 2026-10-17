---
type: issue
title: VS Code merge-base key trips the pre-push state check
summary: VS Code writes branch.<name>.vscode-merge-base into local git config while the pre-push check runs, so the first push of a new branch is refused as if a test had changed git state.
tags: [area/git, kind/pitfall]
created: 2026-10-17
updated: 2026-10-17
agent: claude-code
status: done
owner: human
priority: P3
issue_kind: environment
next_action: None. A branch created with VS Code open now pushes on the first try.
root_cause: The VS Code Git extension writes branch.<name>.vscode-merge-base into local git config when it first sees a branch, which can happen while the pre-push check runs between the two git-state snapshots.
fix_ref: branch fix/git-state-ignores-vscode-merge-base
regression_evidence: Before the fix, git-state.test.ts cases adding, changing and removing branch.main.vscode-merge-base during the check failed with EXIT_REFUSED; after it they pass, and branch.main.merge, branch.main.vscode-merge-base-x, fixture.main.vscode-merge-base and branch.vscode-merge-base are still refused.
prevention: git-state.test.ts keeps both the ignored cases and the refused look-alikes, so widening or dropping the exception fails npm test.
idea: "[[Execute the repository audit remediation]]"
project: "[[Repository audit remediation]]"
evidence:
  - "VERIFIED: on 2026-10-17 the first git push -u of fix/s01-fixture-git-containment and of docs/audit-remediation-s01-closeout each failed with git-state: local git config changed: branch.<...>.vscode-merge-base; the second push of each succeeded unchanged."
  - "VERIFIED: git config --local listed branch.<name>.vscode-merge-base=origin/main for each new branch after the failed push."
  - "INFERRED: the VS Code Git extension writes the key once when it sees a new branch, which happened during the check because the branch was created just before the push."
  - "OWNER DECISION: on 2026-10-17 the owner said \"ignore vscoe-merge-base\" when asked whether git-state should ignore the key."
  - "VERIFIED: git-state.test.ts went from 2 failing cases to 27 passing after git-state skipped keys matching ^branch\\..+\\.vscode-merge-base$."
---

## Reproduction

With the checkout open in VS Code, create a branch with `git switch -c <name> origin/main` and
push it at once with `git push -u origin <name>`. The pre-push hook runs `npm run check` between
two `git-state` snapshots. Seen twice out of two new branches on 2026-10-17.

## Expected and actual

Expected: the push passes when no test changed git state. Actual: `git-state verify` refuses,
naming `branch.<...>.vscode-merge-base`, a key no test wrote.

## Root cause

Unconfirmed. The editor, not a test, adds the key, and it does so during the check. A retry passes
because the key already exists in both snapshots. The tracking keys that `git push -u` writes never
trip the check because git writes them after the hook has run.

## Fix

`git-state` skips keys matching `^branch\..+\.vscode-merge-base$`, as the owner decided. Every
other local and per-worktree key is still compared.

## Verification

The new git-state.test.ts cases failed before the change and pass after it. The first push of
the fix branch itself is the live check, recorded in its pull request.

## Prevention

`scripts/git/git-state.test.ts` pins both sides: the key is ignored, and keys that only look like
it are still refused, in `npm test`.
