---
type: plan
title: Per-branch changelog fragments plan
summary: Replace the shared CHANGELOG.md edit with one dated fragment file per branch under changelog/, enforced by changelog:guard, so concurrent pull requests never conflict on the changelog.
tags: [area/git, area/planning, kind/convention]
created: 2026-10-17
updated: 2026-10-17
agent: claude-code
status: proposed
owner: human
priority: P2
next_action: Owner reviews this plan and ADR-0027; after the owner merges their pull request, set approval_ref and create the single build ticket with plan-tickets.
idea: "[[Changelog entries cannot conflict between branches]]"
related: ["[[ADR-0027 Changelog entries are per-branch fragment files]]", "[[ADR-0007 Changelog entries carry no post-merge facts]]", "[[Change records]]"]
evidence:
  - "VERIFIED: on 2026-10-17 GitHub reported PR 23 as conflicting in CHANGELOG.md after PR 22 merged; both had added a line directly under the 2026-10-17 heading, and merge commit 271578d resolved it by keeping both lines."
  - "VERIFIED: scripts/changes/changelog-validation.ts judges entries by the lines a branch added under a date heading in CHANGELOG.md; scripts/lib/paths.ts:6 names the file."
  - "OWNER DECISION: on 2026-10-17 the owner chose \"Folder is the changelog (Recommended)\" and \"Existing guard tests (Recommended)\" as the test seam."
  - "UNKNOWN: whether GitHub's conflict check would honour a merge=union attribute; this plan does not depend on it."
---

The plan is approved when the owner merges the pull request that adds it; then set
`approval_ref` to that PR.

## Problem

Every branch must add a `CHANGELOG.md` entry under a date heading, and every branch adds it at the
top of the same section, so any two open pull requests conflict there. See
[[Changelog entries cannot conflict between branches]] for the observed case.

## Destination

A branch records its change in its own new file, `changelog/<YYYY-MM-DD>-<slug>.md`.
`changelog:guard` requires exactly that, and two branches open at once merge in either order
without a conflict. `CHANGELOG.md` holds the history written before the switch and points to the
folder.

## Constraints

- Test first, with the guard shown failing before it passes (`write-guard`).
- A replaced rule is retired in the same pull request, and every live reference is repointed;
  `governance:check` must refuse text that still asserts the old rule.
- Historical records stay as written: existing `CHANGELOG.md` entries, decisions and work records
  are not edited, except one pointer line at the top of `CHANGELOG.md`.
- ADR-0007 still applies to fragments.
- Dependabot and other bot branches keep their current exemption from the change-record guards.

## Decisions

- New entries are per-branch files in `changelog/`; the folder is the changelog and nothing folds
  them back ([[ADR-0027 Changelog entries are per-branch fragment files]]).
- Fragments carry no post-merge facts ([[ADR-0007 Changelog entries carry no post-merge facts]]).

## Test seams

One seam: the existing guard tests. `scripts/changes/changelog-validation.test.ts` covers the pure
rule and `scripts/changes/changelog-guard.test.ts` runs the CLI against real temporary git
repositories through `scripts/test-support/repo-fixture.ts`; both run in `npm test`. New cases
there:

- Two fixture branches from the same base each add their own fragment; merging them into `main`
  one after the other completes without a conflict, and the guard passes on each.
- Refusing cases: no fragment; an empty fragment or one with no `- ` entry; a fragment dated
  before the branch started or after today; a name that does not match
  `<YYYY-MM-DD>-<slug>.md`; a fragment that edits or deletes an existing one; a branch that adds
  lines to `CHANGELOG.md`; a post-merge fact.
- Positive: a branch with one valid fragment; a branch whose only changes are exempt.

## Implementation slices

### Changelog fragments replace the shared entry

Job spec: none required; one build ticket.

- **Behaviour:** `changelog:guard` accepts a branch that adds at least one new valid fragment file
  and refuses the cases listed under Test seams. `repo-memory-validation` treats fragment files as
  it treats `CHANGELOG.md` today. `CHANGELOG.md` gains one line pointing to `changelog/`.
- **Rule and references, same pull request:** `CLAUDE.md`, `.claude/rules/zeem/change-records.md`,
  `.claude/rules/zeem/wiki-and-docs.md`, `wiki/reference/Change records.md`,
  `.sandcastle/implement-prompt.md`, `.sandcastle/merge-prompt.md`, the comment in
  `scripts/wiki/wiki-compliance-validation.ts`, and `config/governance-alignment.json`, which also
  gains a claim that refuses live text still requiring a `CHANGELOG.md` entry.
- **Acceptance:** the refusing cases fail before the change and pass after it; the two-branch
  merge test passes; `governance:check` refuses a planted sentence asserting the old rule;
  `npm run check` passes on the branch, whose own record is its first fragment.
- **Blocked by:** owner approval of this plan.

## Acceptance criteria

- [ ] Two concurrent fixture branches each record a change and merge into `main` in either order
  with no conflict, and the guard passes on both.
- [ ] Each refusing case under Test seams is refused by `changelog:guard` with a reason, and was
  shown failing first.
- [ ] No live rule, prompt, reference or config still requires a `CHANGELOG.md` entry, and
  `governance:check` refuses one planted back.
- [ ] Existing `CHANGELOG.md` history is unchanged apart from its pointer line.
- [ ] `npm run check` passes, and an independent verifier rates each criterion at the final head.

## Out of scope

- Folding fragments into one file or generating a combined view: the owner chose the folder as
  the changelog.
- A `merge=union` attribute: not needed once no branch edits a shared file.
- Rewriting or moving existing `CHANGELOG.md` entries: history stays as written.
- Changing ADR-0007's post-merge rule: it carries over unchanged.
