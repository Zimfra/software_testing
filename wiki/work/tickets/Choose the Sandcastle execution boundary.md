---
type: ticket
title: Choose the Sandcastle execution boundary
summary: Choose between isolating the complete execution workflow and hardening host-side SDK operations before designing the sandbox remediation.
tags: [area/planning, area/agents, kind/architecture]
created: 2026-10-16
updated: 2026-10-16
agent: opencode
status: backlog
owner: human
priority: P1
next_action: Ask the owner which execution boundary to target, with the recommendation and tradeoffs below.
idea: "[[Execute the repository audit remediation]]"
project: "[[Repository audit remediation]]"
ticket_kind: decision
map: "[[Repository audit remediation map]]"
depends_on: []
evidence:
  - "VERIFIED: at the audit baseline, .sandcastle/main.ts calls sandbox.close before scripts/sandcastle/afk.ts can run its post-loop tampering check."
  - "VERIFIED: the pinned Sandcastle 0.12.0 source inspected on 2026-10-16 mounts Git metadata into the sandbox and calls host-side git status during cleanup. Source links are in the audit inventory."
  - "UNKNOWN: an end-to-end Docker reproduction and the implementation cost of alternative boundaries have not been measured."
---

## Question

Should the complete agent execution workflow be isolated from host Git metadata and execution,
or should the current host-side SDK workflow be retained and hardened?

## Evidence

See finding A01 in [[Repository audit findings 2026-10-16]]. The wrapper's check runs after SDK
cleanup, so changing only that wrapper's order cannot protect earlier host-side operations.
Giving each agent a different worktree is also insufficient when the worktrees share Git metadata.

## Options

1. **Isolate the complete workflow.** Put the coordinator, agent-side Git operations and checks
   inside a disposable execution environment. Transfer changes to the host through a defined,
   host-controlled import that does not adopt sandbox configuration or hooks. This provides a
   clearer boundary but needs a tested transfer and recovery design.
2. **Harden the current host workflow.** Keep the SDK architecture and disarm executable Git
   configuration and hooks at every host-side operation, including cleanup and failure paths.
   This may be a smaller initial change, but correctness depends on complete SDK coverage and
   maintaining it across upgrades.

## Recommendation

Target isolation of the complete workflow. Start the eventual implementation with a bounded,
reproducible test of the boundary and the smallest transfer design. A separate clone alone is
not enough if host processes later execute Git against its agent-controlled configuration.

The owner chooses the target and acceptable cost; feasibility must be established before the
plan promises a particular container topology or dependency change.

## Resolution

Unresolved. Record the owner's actual answer and date here, then update the map. If the chosen
boundary exposes a factual feasibility question, create a focused research ticket before writing
the implementation plan.
