---
type: issue
title: Planning pull request publication is blocked
summary: GitHub authentication and the active account prevent the planning branch from being published; this delivery blocker does not prevent local design or plan drafting.
tags: [area/auth, area/github, tool/gh]
created: 2026-10-16
updated: 2026-10-16
agent: opencode
status: blocked
owner: human
priority: P1
issue_kind: environment
next_action: The owner establishes a valid machine-account session; recheck authentication, repository identity and the branch before running npm run pr.
blocker: The last publication attempt found an invalid stored GitHub account and the active login matched CODEOWNERS; owner action is needed for a valid machine-account session.
idea: "[[Execute the repository audit remediation]]"
project: "[[Repository audit remediation]]"
evidence:
  - "VERIFIED: npm run pr at 4cb19802c18914e707fbd39d2a45342d9b6a0158 passed the full check and refused before pushing because gh auth status reported an invalid stored account."
  - "VERIFIED: later read-only checks during planning again returned gh auth status exit 1, identified the active login as a code owner and found no PR for feat/provider-neutral-governance."
  - "INFERRED: this blocks publication and subsequent owner-merged plan approval, but does not block resolving design questions or drafting the proposed plan locally."
---

## Reproduction

The preceding planning session ran `npm run pr`; its checks passed and publication stopped at
GitHub authentication. Recheck with `gh auth status` and `gh api user --jq .login`, comparing the
active login with the intended machine account and `.github/CODEOWNERS`. Do not copy tokens or
credential-store contents into the evidence.

## Expected and actual

Expected: the PR tool publishes the feature branch through a valid machine-account session.
Observed: authentication failed for a stored account, and the active account also matched a code
owner. The branch remained local and no PR was created.

## Root cause

The CLI's whole-account authentication check reports an invalid stored account. Independently,
the active identity does not satisfy the repository's machine-account publication requirement.
Model-provider authentication is a separate concern.

## Fix

The owner repairs the authentication state and selects the intended machine account. Then the
agent rechecks the target repository, branch and current main before using `npm run pr`. No
credential deletion, account switch or publication-policy exception has been authorized here.

## Verification

Record the successful nonsecret authentication results, published branch and actual PR URL after
publication. Keep this issue open until those results are observed. A created PR does not itself
approve the proposed plan; that requires the owner's merge through the existing workflow.

## Prevention

`scripts/git/pr-ready.ts`, run by `npm run pr`, refuses invalid authentication and code-owner
publication. This check prevents publication under the wrong identity; it does not repair local
credentials. The owner's authentication step remains the manual prerequisite.
