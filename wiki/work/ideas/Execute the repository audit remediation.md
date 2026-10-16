---
type: idea
title: Execute the repository audit remediation
summary: Turn the repository audit into a reviewed plan and dependency-linked job specs that another LLM can execute from a fresh terminal session.
tags: [area/planning, area/agents, area/compliance]
created: 2026-10-16
updated: 2026-10-16
agent: opencode
status: in-review
owner: human
priority: P1
next_action: Publish the independently reviewed proposed plan through the machine account for owner merge approval.
project: "[[Repository audit remediation]]"
evidence:
  - "OWNER DECISION: on 2026-10-16 the owner said: yes the goal is to take this planning, commit into the repo with a pull request, and for the planning to be executred by another llm in a different terminal session maybe claude for example"
  - "VERIFIED: the audit inspected 616a4ea59f84885cae294f0aa5f31dd9dffac129; the provider-neutral authoring prerequisite is implemented locally at 7fd3faa86650ce6e2c4c7874e5204ab87c0b611a, with independent review and a passing full check recorded in the preceding work."
  - "VERIFIED: after adding the map, tickets, inventory and fresh-session runbook, npm run check exited 0 on Node 24.22.0 with 762 Node tests and 56 Python tests passing; wiki-lint validated 65 notes and every repository guard passed."
  - "VERIFIED: independent review of 7c2b7c6bc0da50eb954a4ce2b3d63e895db7ae35 found two handoff ambiguities. The follow-up explicitly preserves the existing documentation-only landing default for the host-hardening option and makes job-spec approval conditional on the plan requiring job specs."
  - "OWNER DECISION: on 2026-10-16 the owner selected full-workflow isolation with a controlled host import; Choose the Sandcastle execution boundary records the verbatim answer."
  - "VERIFIED: after recording the isolation decision and its research follow-up, npm run check exited 0 on Node 24.22.0 with 762 Node tests and 56 Python tests passing; wiki-lint validated 66 notes and all repository guards passed."
  - "OWNER DECISION: on 2026-10-16 the owner replied 'approved' to the partial-failure policy recorded in Define Sandcastle partial-failure outcomes."
  - "VERIFIED: after recording the partial-failure approval and updating the handoff, npm run check exited 0 on Node 24.22.0 with 762 Node tests, 56 Python tests and all repository guards passing."
  - "OWNER DECISION: on 2026-10-16 the owner chose 'audit only the fork' and then asked 'and let me know in some detail whats being worked on and why'."
  - "VERIFIED: the SDK's pinned no-sandbox API supports the proposed outer-container execution design, and a temporary-repository experiment preserved commit identity while excluding source Git configuration, hooks and untracked work from a bundle import."
  - "VERIFIED: after recording fork scope, research results and the proposed verification approach, npm run check exited 0 on Node 24.22.0 with 762 Node tests and 56 Python tests passing; wiki-lint validated 68 notes and all repository guards passed."
  - "OWNER DECISION: on 2026-10-16, after the verification approach was presented, the owner said: do what it takes to get the PR completed so we can merge, - proceed as required"
  - "VERIFIED: the proposed plan exposed a blocking validator defect: a completed map counted its downstream plan as an unfinished ticket. Before the fix, work-tracking.test.ts reported 40 tests with 36 passing and 4 failing entries, covering proposed, approved and executing plans plus their parent test."
  - "VERIFIED: after the narrow validator fix, all 40 work-tracking tests passed. The full check passed 766 Node tests, 56 Python tests and all guards; wiki-lint validated 69 notes. All seven trusted guard CLIs from main at 616a4ea also passed against the proposed-plan tree."
  - "VERIFIED: a structural inspection of the proposed plan found 26 unique slices, an acyclic parent graph, coverage of all A01-A22 findings and Fixture Git containment as the first eligible slice."
  - "UNKNOWN: Docker is unavailable here, so live containment is not proven. The proposed plan still requires owner merge approval before build-ticket creation."
---

## Problem

The audit found execution-boundary, Git-state, orchestration, privacy and evaluation gaps. Its
findings were in a conversation, so a different terminal session could not reliably recover the
evidence, distinguish recommendations from decisions, or know which work was ready to start.

## Desired outcome

Commit the planning records and submit them in a pull request. The owner approves the resulting
plan through the repository workflow. A fresh LLM session can then find the approved plan, create
the agreed session-sized job specs, and work one unblocked ticket at a time with independent
verification and a recoverable handoff.

## Next step

Review [[Repository audit remediation implementation plan]], complete machine-account publication
and obtain the owner's merge. The next LLM verifies that approval before using `plan-tickets` and
the fresh-session runbook. The handoff must stand alone without this conversation.
