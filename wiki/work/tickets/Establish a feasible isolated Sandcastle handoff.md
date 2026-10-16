---
type: ticket
title: Establish a feasible isolated Sandcastle handoff
summary: Determine how the pinned Sandcastle runtime can isolate the complete workflow and return candidate commits and check evidence through a controlled host import.
tags: [area/planning, area/agents, kind/architecture]
created: 2026-10-16
updated: 2026-10-16
agent: opencode
status: backlog
owner: agent
priority: P1
next_action: Inspect the pinned SDK and repository callers, compare supported isolation and transfer paths, and record a feasible design with its limits before write-plan.
idea: "[[Execute the repository audit remediation]]"
project: "[[Repository audit remediation]]"
ticket_kind: research
map: "[[Repository audit remediation map]]"
depends_on: ["[[Choose the Sandcastle execution boundary]]"]
evidence:
  - "OWNER DECISION: the owner selected full-workflow isolation on 2026-10-16 in Choose the Sandcastle execution boundary."
  - "VERIFIED: finding A01 records host-side Git during the pinned SDK's cleanup; a separate worktree alone does not establish the selected boundary."
  - "UNKNOWN: the smallest feasible runtime topology, commit-transfer mechanism and binding of check evidence to imported commits have not been established."
---

## Question

Which supported design can run the coordinator, agents, Git operations and checks in a disposable
environment, then transfer candidate commits and their check evidence without giving the host
agent-controlled executable configuration or commands?

## Evidence

Start with finding A01 and its pinned upstream sources in [[Repository audit findings 2026-10-16]].
Inspect `.sandcastle/main.ts`, `scripts/sandcastle/afk.ts`, `scripts/git/pr-ready.ts` and the locked
SDK. The current publication path runs checks on the host, so its integration with isolated check
results must be explained rather than assumed. Design recovery results around the approved
policy in [[Define Sandcastle partial-failure outcomes]]: reviewed successes may proceed while
failed work stays unintegrated, and retries preserve completed work without duplicate notifications.
Bind any reused check and review evidence to the candidate commit it actually verified.

## Options

Compare the runtime's supported isolation mechanisms against a disposable environment containing
the coordinator and its worker runtime. For each feasible candidate, identify:

- What executes inside the disposable environment and what trusted tooling remains on the host.
- How Git metadata, executable configuration, hooks and runtime control interfaces are separated.
- What data returns, how its commit identity and check evidence are verified, and how rejected
  or interrupted imports are recovered.
- Required dependencies, infrastructure, credentials, costs and unresolved capability limits.
- The highest useful test seam, including a harmless sentinel that exposes the audited failure.

## Recommendation

Research the smallest supported design that satisfies the chosen boundary before proposing a
runtime port or broad SDK fork. Use source inspection and non-model verification appropriate to
the question. Record primary sources and their dates; do not treat an untested design as a working
integration. Return infrastructure or cost choices requiring owner input as decision tickets.

## Resolution

Unresolved. Record the feasible design and supporting evidence here. If no supported design is
established, name the concrete missing capability and return to the owner rather than silently
falling back to host execution. Implementation belongs in the subsequently approved plan.
