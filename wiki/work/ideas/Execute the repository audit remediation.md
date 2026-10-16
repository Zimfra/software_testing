---
type: idea
title: Execute the repository audit remediation
summary: Turn the repository audit into a reviewed plan and dependency-linked job specs that another LLM can execute from a fresh terminal session.
tags: [area/planning, area/agents, area/compliance]
created: 2026-10-16
updated: 2026-10-16
agent: opencode
status: clarifying
owner: human
priority: P1
next_action: Resolve the Sandcastle execution-boundary decision, then the other open decisions before writing the proposed remediation plan.
project: "[[Repository audit remediation]]"
evidence:
  - "OWNER DECISION: on 2026-10-16 the owner said: yes the goal is to take this planning, commit into the repo with a pull request, and for the planning to be executred by another llm in a different terminal session maybe claude for example"
  - "VERIFIED: the audit inspected 616a4ea59f84885cae294f0aa5f31dd9dffac129; the provider-neutral authoring prerequisite is implemented locally at 7fd3faa86650ce6e2c4c7874e5204ab87c0b611a, with independent review and a passing full check recorded in the preceding work."
  - "VERIFIED: after adding the map, tickets, inventory and fresh-session runbook, npm run check exited 0 on Node 24.22.0 with 762 Node tests and 56 Python tests passing; wiki-lint validated 65 notes and every repository guard passed."
  - "UNKNOWN: the owner has not yet chosen the execution boundary, partial-failure policy or landing-audit history scope. No remediation plan is approved."
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

Use the linked project's map to resolve one decision at a time. The publication prerequisite
can be resolved independently. The execution handoff must stand alone without this conversation.
