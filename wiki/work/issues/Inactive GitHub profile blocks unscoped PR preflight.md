---
type: issue
title: Inactive GitHub profile blocks unscoped PR preflight
summary: A stale inactive GitHub login makes the whole-account auth check fail even though the intended machine account is valid.
tags: [area/auth, area/github, tool/gh]
created: 2026-10-16
updated: 2026-10-16
agent: opencode
status: blocked
owner: human
priority: P2
issue_kind: environment
next_action: The owner repairs the inactive profile, or publication uses a validated bot-only context with the normal PR checks; verify the actual actor before any write.
blocker: The whole-account auth status still reports an invalid inactive profile; the default unscoped PR command can therefore refuse before publication.
idea: "[[Execute the repository audit remediation]]"
project: "[[Repository audit remediation]]"
related: ["[[Planning pull request publication is blocked]]"]
evidence:
  - "VERIFIED: the 2026-10-16 auth-status JSON showed the intended machine account active/successful and a different inactive profile in error. No credential values are recorded here."
  - "VERIFIED: prior planning publication succeeded through a temporary bot-only CLI context while retaining the repository's authentication, actor, branch and check requirements."
---

## Reproduction

Inspect `gh auth status` and the nonsecret active-account information. The authoring session
observed a successful active machine account alongside an invalid inactive profile. The normal
PR tool asks for whole-account status and can refuse that environment.

## Expected and actual

Expected: a valid machine-account publication context passes authentication and the existing
actor checks. Actual: unrelated inactive-profile failure blocks the unscoped preflight.

## Root cause

An invalid saved profile remains in the shared CLI configuration. This is separate from model
authentication and does not mean the active machine account lacks repository access.

## Fix

The owner may repair the inactive profile. Alternatively, use an explicitly validated temporary
machine-account context for this repository, with credentials kept only in secure storage and
process environment and a Git helper using that same identity. Run the normal checks and PR tool;
do not weaken actor/branch rules or copy tokens into work records. No saved profile is deleted by
this job-spec preparation task.

## Verification

Record nonsecret actor, repository permission, exact branch/SHA and preflight outcome. If a scoped
context succeeds, distinguish that result from repair of the shared configuration. Leave this
unscoped-environment issue open until the owner actually repairs or accepts that limitation.

## Prevention

The PR tool's authentication and code-owner refusals remain the control. The fresh-session
runbook requires checking the actual publishing context before remote writes.
