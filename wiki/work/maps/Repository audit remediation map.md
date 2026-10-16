---
type: map
title: Repository audit remediation map
summary: Isolation and partial-failure behavior are selected; resolve audit-history scope and establish a feasible isolated handoff before writing the remediation plan.
tags: [area/planning, area/agents]
created: 2026-10-16
updated: 2026-10-16
agent: opencode
status: clarifying
owner: human
priority: P1
next_action: Work through Choose the landing audit history scope with the owner; the isolated-handoff research can proceed independently.
idea: "[[Execute the repository audit remediation]]"
project: "[[Repository audit remediation]]"
evidence:
  - "VERIFIED: the repository's Idea to execution workflow requires decisions to be settled before write-plan and an owner-merged plan before plan-tickets."
  - "OWNER DECISION: the owner selected full-workflow isolation on 2026-10-16; the answer is recorded in Choose the Sandcastle execution boundary."
  - "OWNER DECISION: on 2026-10-16 the owner approved the partial-failure policy recorded in Define Sandcastle partial-failure outcomes."
  - "UNKNOWN: audit-history scope remains unresolved and the isolated-handoff design still needs research. No remediation plan is approved."
---

## Destination

An owner-reviewable remediation plan, grounded in the audit, with enough context and testable
slices for another LLM to turn it into approved job specs and execute one unblocked ticket per session.

## Notes

Start each session with `wiki-memory`, then this map and [[Resume repository audit remediation]].
The baseline inventory is [[Repository audit findings 2026-10-16]]. This map records decisions
and does not authorize implementation. Use `wayfinder` for one decision at a time, `grill-plan`
for owner questions, and the current harness's available engineering tools.

The likely work areas are execution isolation, Git-state and PR identity, orchestration outcomes,
privacy and metadata guards, and evaluation reliability. These are areas to slice after decisions,
not build tickets. Simple reproduced defects can be described without inventing new architecture.

The current branch also carries the provider-neutral authoring prerequisite. Its policy is in
[[ADR-0026 Any provider may work under shared rules]]. A different provider can use these records;
capability-specific runtime checks still require their real tools.

## Open decisions

- [[Choose the landing audit history scope]]: owner chooses what historical provenance to preserve.
  Work this next.
- [[Establish a feasible isolated Sandcastle handoff]]: an agent establishes a supported design
  for the chosen boundary and identifies remaining owner choices.
- [[Restore machine-account publication access]]: owner resolves the manual prerequisite for the PR.

## Decisions so far

- [[Choose the Sandcastle execution boundary]]: isolate the complete workflow in a disposable
  environment and import changes through a controlled host step; owner selected on 2026-10-16.
- [[Define Sandcastle partial-failure outcomes]]: reviewed successes may proceed, failed work
  stays unintegrated, incomplete runs exit nonzero and retries resume missing phases without
  duplicate notifications; owner approved on 2026-10-16.

The owner has also specified the handoff destination: committed planning reviewed through a
pull request, then execution by another LLM in a different session.

## Not yet specified

- The exact run-result format and recovery state required by the selected failure policy.
- The history representation required by the selected audit scope.
- The final slice boundaries and dependency graph, including any necessary prefactors.
- Which low-impact findings the owner may choose to defer after seeing the proposed breakdown.

## Out of scope

- Automatically approving or merging changes: ownership stays with the human.
- Provider runtime ports: the authoring prerequisite permits other harnesses but does not port
  Sandcastle or the live compliance runner to another model API.
- Live paid model evaluations or credential changes without explicit authorization for the run.
- Unrelated cleanup or a second issue-tracking system.
