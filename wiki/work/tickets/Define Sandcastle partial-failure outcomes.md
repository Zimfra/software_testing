---
type: ticket
title: Define Sandcastle partial-failure outcomes
summary: Decide when a run is successful, what may be integrated after a failed phase, and how a later session recovers unfinished work.
tags: [area/planning, area/agents]
created: 2026-10-16
updated: 2026-10-16
agent: opencode
status: backlog
owner: human
priority: P1
next_action: Ask the owner whether reviewed successes may proceed while failed work stays unintegrated and the overall run reports incomplete.
idea: "[[Execute the repository audit remediation]]"
project: "[[Repository audit remediation]]"
ticket_kind: decision
map: "[[Repository audit remediation map]]"
depends_on: []
evidence:
  - "VERIFIED: the audit evaluated the actual loop with mocked SDK failures; ten rejected sandbox creations ended with All done, and the wrapper's unchanged-state path returned exit 0."
  - "VERIFIED: .sandcastle/main.ts can pass leftover branches to the merger, and the AFK work record acknowledges total-failure success and notification retry limits."
---

## Question

What outcomes should make an unattended run successful, incomplete or failed, and which
unfinished results may a subsequent run integrate or retry?

## Evidence

Findings A10 and A11 in [[Repository audit findings 2026-10-16]] distinguish an empty or blocked
queue from failed execution. Produced commits do not establish reviewed or completed work.
The current AFK record also states that a failed issue comment is not retried on a quiet rerun.

## Options

1. **Explicit phase outcomes with guarded recovery.** Successful work may proceed independently,
   but failed review blocks that issue's automatic integration. A run with failed or incomplete
   work reports a non-success outcome and names the remaining work. Recovery preserves completed
   phases and retries eligible missing steps without duplicate notification.
2. **Best-effort integration.** Continue integrating available commits, including unreviewed
   leftovers, and rely on later owner inspection. This retains more current behavior but requires
   an explicit incomplete result so a partial run cannot be mistaken for completed work.

## Recommendation

Choose explicit phase outcomes with guarded recovery. Distinguish planned work, produced
commits, passed review, local integration, an open PR and delivered notification. Keep an empty
or wholly blocked queue separate from failed execution, and report the latter clearly.

## Resolution

Unresolved. Record the chosen behavior and any exceptions with the owner's words and date.
Do not infer approval for automatic issue comments or unreviewed integration from this recommendation.
