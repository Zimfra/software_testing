---
type: issue
title: VS Code merge-base key trips the pre-push state check
summary: VS Code writes branch.<name>.vscode-merge-base into local git config while the pre-push check runs, so the first push of a new branch is refused as if a test had changed git state.
tags: [area/git, kind/pitfall]
created: 2026-10-17
updated: 2026-10-17
agent: claude-code
status: backlog
owner: human
priority: P3
issue_kind: environment
next_action: Owner decides whether git-state, which today compares every local config key, should ignore vscode-merge-base keys, or whether the retry is acceptable.
idea: "[[Execute the repository audit remediation]]"
project: "[[Repository audit remediation]]"
evidence:
  - "VERIFIED: on 2026-10-17 the first git push -u of fix/s01-fixture-git-containment and of docs/audit-remediation-s01-closeout each failed with git-state: local git config changed: branch.<...>.vscode-merge-base; the second push of each succeeded unchanged."
  - "VERIFIED: git config --local listed branch.<name>.vscode-merge-base=origin/main for each new branch after the failed push."
  - "INFERRED: the VS Code Git extension writes the key once when it sees a new branch, which happened during the check because the branch was created just before the push."
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

Not decided. Options: let `git-state` ignore `vscode-merge-base` keys, or create and push
branches with the editor closed. Any change to the check needs its own ticket and a refusing case.

## Verification

Pending a fix. Record the failing first push and a passing first push with the editor open.

## Prevention

None yet: the pre-push `git-state` check is the control, and it currently reports this false refusal.
