---
type: project
title: Repository audit remediation
summary: Deliver an owner-reviewed remediation plan and independently verifiable work from the repository audit, executable across fresh LLM sessions.
tags: [area/planning, area/agents, area/compliance]
created: 2026-10-16
updated: 2026-10-16
agent: opencode
status: clarifying
owner: human
priority: P1
next_action: Resolve audit-history scope, establish a feasible isolated handoff using the approved failure policy, and clear the machine-account publication prerequisite.
idea: "[[Execute the repository audit remediation]]"
evidence:
  - "OWNER DECISION: on 2026-10-16 the owner requested committed planning, a pull request and execution by another LLM in a separate terminal session."
---

## Outcome

A reviewed plan and job specs that preserve the audit's evidence, define the expected behavior,
and let a fresh LLM implement a bounded slice without inventing decisions or relying on chat history.

## Scope

- Give every finding in the audit inventory an explicit disposition and evidence requirement.
- Use the selected full-workflow isolation target in [[Choose the Sandcastle execution boundary]];
  establish its feasible implementation through the linked research ticket.
- Apply the approved behavior in [[Define Sandcastle partial-failure outcomes]] to run outcomes,
  per-issue integration and recovery.
- Resolve the choices that change implementation, then write the proposed plan with test seams
  and dependency-linked implementation slices.
- Propose `job_specs: required` so build tickets carry inputs, file boundaries, tests, recovery,
  evidence and human checkpoints. Agree the ticket breakdown before creating them.
- Keep the existing branch, test-first, independent-review and owner-merge workflow.

## Acceptance criteria

- [ ] Every inventory finding is linked to a proposed slice or an explicit, reasoned deferral.
- [ ] Every decision needed by the plan is resolved with owner evidence or reproducible research.
- [ ] The plan is proposed in a pull request and identifies its intended base, test seams and limits.
- [ ] After owner merge, approval is verified on GitHub and recorded before build-ticket creation.
- [ ] Each build ticket has one deliverable, checkable acceptance, explicit dependencies and a
  valid and broken control for the behavior it changes.
- [ ] The handoff routes a fresh session by actual work status and explains where to stop for
  owner decisions, verification failures, missing capabilities or approval.
- [ ] Each implemented slice has an independent criterion-by-criterion verdict at a pinned SHA.

## Work links

- [[Repository audit remediation map]]: decisions and the next planning action.
- [[Repository audit findings 2026-10-16]]: baseline findings and evidence limits.
- [[Resume repository audit remediation]]: entry point for a different LLM session.
