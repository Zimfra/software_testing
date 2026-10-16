---
type: ticket
title: S07 Fork-only landing assurance
summary: Audit this fork after its verified boundary and validate exact main-branch PR landings against the relevant historical owner policy.
tags: [area/git, area/github, area/planning]
created: 2026-10-16
updated: 2026-10-16
agent: opencode
status: proposed
owner: agent
priority: P1
next_action: Verify job approval and S03 completion, then implement the approved fork boundary and provenance controls.
idea: "[[Execute the repository audit remediation]]"
project: "[[Repository audit remediation]]"
ticket_kind: build
plan: "[[Repository audit remediation implementation plan]]"
depends_on: ["[[S03 Fresh pinned main revisions]]"]
related: ["[[Choose the landing audit history scope]]", "[[Repository audit findings 2026-10-16]]"]
evidence:
  - "VERIFIED: this job spec preserves approved slice S07, findings A07/A08 and its S03 prerequisite."
  - "UNKNOWN: job-spec approval and implementation evidence are pending."
---

## Goal

Make a passing landing audit establish the approved fork-only main-branch PR provenance guarantee.

## Inputs

- Plan S07, audits A07/A08 and the boundary evidence in Choose the landing audit history scope.
- Target `Zimfra/software_testing`; exclusive start `f9c1b9d3853226fe8a1a3181703f884106393ad0`; first included merge `bf3e4073f32ae593d02c55eae1f003ba711bd41e`.
- Inspect `landing-audit.ts`, its tests, `config/landing-audit.json` and the merge-gate contract.

## Approach

1. Configure the fork and exclusive boundary, verifying that it belongs to the freshly fetched main history.
2. Validate each in-scope landing's merged state, exact SHA, main base and authorized merger under the relevant trusted historical policy.
3. Report unverifiable provenance as an error/refusal, not a clean audit, and state the excluded inherited scope.

## Acceptance criteria

- [ ] The first fork merge is included; history at and before the inherited boundary is excluded.
- [ ] Wrong/missing/nonancestor boundaries and failed external queries cannot pass.
- [ ] A direct update, non-main PR, mismatched SHA or unauthorized merger is detected.
- [ ] A historical owner change does not invalidate a previously authorized landing merely because today's owner differs.
- [ ] Correct fork fixtures pass and output explicitly states the scope of assurance.

## Out of scope

Auditing inherited upstream history, rewriting Git history or changing who may approve/merge.

## Allowed files

- `scripts/git/landing-audit.ts`, `scripts/git/landing-audit.test.ts`, `config/landing-audit.json`.
- Bounded `scripts/git/code-owners*.ts` with sibling tests if shared policy parsing is required; `scripts/git/pr-ready.ts` and `scripts/git/pr-ready.test.ts` only to reuse that same parser.
- `wiki/reference/Merge gate contract.md`, `wiki/runbooks/Land a change.md`, this ticket and `CHANGELOG.md`.

## Forbidden files

All other files; do not edit historical owner policy, current CODEOWNERS, branch rules or real refs as fixtures.

## Human checkpoints

Verify approval and S03 landing. If historical authority cannot be resolved under the recorded policy, report it and ask the owner rather than inventing an identity.

## Secrets needed

None for fixtures. Read-only GitHub verification may use the configured machine account; no write trial is needed.

## Tests and evals

- `node --test "scripts/git/*.test.ts"`; `npm run check`.
- Positive: fork-only chain, correct merge and historical owner rotation.
- Broken: boundary errors, direct main update, release-branch PR with a matching SHA, wrong merger, malformed answer and unreachable service. Use local Git history and controlled GitHub responses.

## Rollback and recovery

Keep the selected historical boundary immutable unless the owner explicitly revises the decision. Repair an audit defect through a new PR; never rewrite history to satisfy the audit.

## Evidence

Record boundary inclusion/exclusion, policy revision used for each fixture, command exits and independent verification; identify live queries separately.

## Wiki and doc updates

Update the audit command's documented guarantee and limitations. Link completion to its owner-merged implementation PR.
