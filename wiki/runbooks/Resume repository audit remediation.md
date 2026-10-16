---
type: runbook
title: Resume repository audit remediation
summary: Start a fresh LLM session from committed planning records, verify approval and dependencies, and leave one independently verifiable slice with a clear next action.
tags: [area/planning, area/agents, area/git]
created: 2026-10-16
updated: 2026-10-16
agent: opencode
status: active
idea: "[[Execute the repository audit remediation]]"
project: "[[Repository audit remediation]]"
related: ["[[Idea to execution]]", "[[Work with any agent provider]]"]
---

## When to use

Use this entry point in a different terminal or LLM session to continue the audit remediation.
All authoritative work state lives in the repository. The original chat is not a prerequisite.

## Prerequisites

- Read `AGENTS.md`, `CLAUDE.md` and the applicable area rules, then load `wiki-memory`.
- Identify the checkout, branch, HEAD, local changes and other worktrees before choosing work.
- Read [[Repository audit remediation]], then [[Repository audit remediation map]]. Open only
  the current ticket and the evidence it needs.
- Read [[Repository audit remediation implementation plan]] and inspect its actual approval
  state before selecting implementation work.
- Use the selected provider's available tools and truthful author identity. For Claude Code,
  use ECC helpers when available; for another harness, follow the same methods with available
  equivalents and disclose substitutions.
- For checks, use Node from `.nvmrc` and install locked dependencies with `npm ci`. For publication,
  verify the machine-account prerequisite; model authentication and GitHub authentication are separate.

## Steps

1. **Determine the phase from committed records.** If the map is clarifying, use `wayfinder` to
   work one named or unblocked decision ticket with the owner. Ask one question per turn with
   evidence and a recommendation. Recommendations in tickets are not decisions.
2. **Use the canonical approved plan.** The resolved map and verification approach are recorded
   in [[Repository audit remediation implementation plan]], approved through PR 15. Read it rather
   than creating a competing plan. Use `write-plan` for any agreed revision; preserve finding
   coverage, test seams and the distinction between planned work and observed results.
3. **Verify plan approval before ticket creation.** Follow [[Idea to execution]]. The owner must
   merge [planning PR 15](https://github.com/Zimfra/software_testing/pull/15). Inspect GitHub's
   actual state and merger; record the real PR in
   `approval_ref`. A status written by an agent is insufficient. If approval is absent, stop at
   the proposed plan and name the pending action. If the plan still says proposed after GitHub's
   owner merge, update its approval metadata only after verifying that actual merge.
   The approval handoff restores the plan's typed `map` link after the validator fix landed in
   PR 15. Older checkouts may still have the initial `related` link; update from the committed
   handoff before creating tickets.
4. **Create the agreed build tickets.** Use `plan-tickets`, showing the owner the numbered breakdown,
   dependencies and delivered behavior before creation unless that breakdown is already approved.
   Each ticket has one deliverable and fits a fresh context. When `job_specs: required` is set,
   include every required section and obtain the owner's job-spec approval before implementation.
   The canonical plan contains 26 approved slices; verify or reuse that breakdown and
   begin with Fixture Git containment once its job spec is approved.
5. **Select one executable ticket.** Its plan must be approved and its dependencies completed.
   Read its Goal, Approach, Acceptance criteria and Out of scope. If the plan requires job specs,
   also verify the job-spec approval and read Inputs, Allowed files, Forbidden files and Human
   checkpoints. If scope or a required capability is unclear, record the blocker instead of
   substituting an assumption.
6. **Implement test-first.** Follow `manage-branch`, then ECC's TDD method or its equivalent. Use
   `write-guard` for guard changes. Reproduce the original failure in disposable fixtures, observe
   a failing regression control, implement the smallest slice and run its acceptance commands
   and `npm run check`. Do not test destructive cases against the real checkout.
7. **Arrange independent review and verification.** Pin the commit and provide the ticket criteria,
   base SHA, relevant findings and commands to separate reviewer contexts. Use `branch-review`
   and `verify-work`; the builder does not certify its own work. Fix confirmed findings and verify
   the new head. Name unavailable checks and capabilities without turning them into passes.
8. **Publish and leave a recoverable handoff.** Update the owning ticket's status, `next_action`
   and labelled evidence; commit wiki files separately from other changes. Use `npm run pr`.
   Record the actual PR URL when available. Only the owner approves and merges. Leave the branch,
   commit, completed criteria, remaining blockers and next eligible ticket in the handoff.

## Progress updates

The owner requested detailed explanations of what is being worked on and why on 2026-10-16.
At the start of a meaningful task and when a result or blocker changes the next action, explain:

- The current ticket and the behavior or planning question being worked on.
- Why it matters, which finding it addresses and what depends on its result.
- The evidence obtained so far, distinguishing inspected source, tested behavior and proposals.
- What remains unresolved and the next concrete action or owner decision.

Keep updates specific to the work rather than narrating each file read or command. The final
handoff names commits, check results, publication status and the next eligible ticket so another
session can resume reliably.

## Verify

- A fresh session can locate the project, map and current ticket through their links and metadata.
- No build begins from unresolved decisions, an unapproved plan, an unapproved required job spec
  or an unfinished dependency.
- Acceptance checks exercise the changed behavior with valid and broken controls, not only
  declarations that the behavior exists.
- Evidence names the actual command, revision and outcome. Source inspection, mocked runs,
  live integration checks and model-backed evaluations retain their distinct limits.
- The owning record names the concrete next action even when publication or approval is blocked.
- `npm run wiki:lint`, `npm run wiki:compliance` and the full required check pass on the final tree.

## Starter instruction

Paste this in a fresh LLM session opened at the repository checkout:

```text
Read AGENTS.md and CLAUDE.md, then load wiki-memory. Follow
wiki/runbooks/Resume repository audit remediation.md. Identify the checkout and current
work state, read the project and map, and follow their recorded next action for the current phase:
one decision, a plan or ticket-preparation step, or one approved unblocked build ticket. Observe
the approval gates in the runbook. Use the repository's skills and independent review. Do not
infer owner decisions or approval. Leave committed evidence and a concrete next action.
```
