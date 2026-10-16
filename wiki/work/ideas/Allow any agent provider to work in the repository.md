---
type: idea
title: Allow any agent provider to work in the repository
summary: Remove provider-specific authoring barriers so the current agent can plan, document and verify work with truthful attribution and the shared repository checks.
tags: [area/agents, area/wiki, area/compliance]
created: 2026-10-16
updated: 2026-10-16
agent: opencode
status: in-progress
owner: human
priority: P1
next_action: Obtain independent review of the committed change, then publish through the machine account and resume the audit remediation map.
related: ["[[ADR-0026 Any provider may work under shared rules]]", "[[Work with any agent provider]]"]
evidence:
  - "OWNER DECISION: on 2026-10-16 the owner said: lets change the only claude code to any providor - remove these blocks"
  - "VERIFIED: before implementation, the five targeted Node test files reported 158 tests, 143 passing and 15 failing entries, including parent subtests; failures exposed author rejection, adapter-file rejection, missing workflow-critical paths and stale governance policy."
  - "VERIFIED: the checkout started clean at 616a4ea59f84885cae294f0aa5f31dd9dffac129; Node 24.22.0 was used for the targeted tests after installing the locked dependencies with npm ci --ignore-scripts."
  - "VERIFIED: npm run check exits 0 on the updated tree with Node 24.22.0: 762 Node tests, 56 Python tests, 99.31 percent line coverage, 92.83 percent branch coverage and 96.92 percent function coverage; every repository guard passes."
  - "VERIFIED: the wiki, skill, governance and ECC-rules guards from main at 616a4ea59f84885cae294f0aa5f31dd9dffac129 each exit 0 against the updated tree. The schema examples let the old wiki guard recognize this branch's author while the new guard accepts unregistered identifiers."
  - "UNKNOWN: native skill discovery and model-backed behavior across providers have not been exercised by this change."
---

## Problem

Planning the audit remediation in the current harness was blocked by a closed author list and
a policy that required a different harness. The skill linter also rejected alternative adapter
files, the governance guard flagged their names, and the change-record guard ignored their
instruction paths.

## Desired outcome

Any provider or harness can follow the shared workflow, write correctly attributed notes and
use available equivalent tools. Author names remain kebab-case, malformed metadata is refused,
and adapter changes carry the same change records as other workflow-critical files.

The owner's instruction authorizes interface substitutions in `branch-review` and `write-skill`:
use available independent reviewer contexts and skill discovery or explicit reads rather than
requiring an installed ECC tool. The methods, ownership and review requirements remain defined
by their canonical skills. Their provenance records append the hashes of these substitutions.

## Next step

Run the targeted and full checks, inspect the legacy trusted guards against this tree, and obtain
independent review. Publication needs a machine-account login: the inspected GitHub CLI login
was a code owner, so the new branch is local until that prerequisite is met. Resume the audit
remediation map after this authoring prerequisite is recorded.
