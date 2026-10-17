---
type: ticket
title: Switch the changelog to per-branch fragments
summary: changelog:guard requires one new dated fragment per branch under changelog/, with a one-time transition, and no live text still requires a CHANGELOG.md entry.
tags: [area/git, area/planning, kind/convention]
created: 2026-10-17
updated: 2026-10-17
agent: claude-code
status: backlog
owner: agent
priority: P2
next_action: Blocked until Recognise changelog fragments as documentation lands; then start from main with the guard's refusing cases written first.
idea: "[[Changelog entries cannot conflict between branches]]"
ticket_kind: build
plan: "[[Per-branch changelog fragments plan]]"
depends_on: ["[[Recognise changelog fragments as documentation]]"]
related: ["[[ADR-0027 Changelog entries are per-branch fragment files]]", "[[ADR-0007 Changelog entries carry no post-merge facts]]", "[[Change records]]"]
evidence:
  - "VERIFIED: the plan was approved by PR 24, which gh pr view 24 shows MERGED by the owner (squash commit 6a28e1d)."
  - "VERIFIED: the required guards check runs main's copy of the guards against a pull request (.github/workflows/guards.yml, pull_request_target), so this ticket's pull request must satisfy main's old changelog guard as well as its own new one."
---

## Goal

`changelog:guard` requires each branch to add its own valid fragment under `changelog/`, so two
open pull requests never conflict on the changelog, and no live text still requires a
`CHANGELOG.md` entry.

## Approach

- Plan slice 2, "Changelog fragments replace the shared entry". The plan lists the guard's rules,
  the transition and every file to repoint; this ticket does not restate them.
- Write the refusing cases first in `scripts/changes/changelog-validation.test.ts` and
  `scripts/changes/changelog-guard.test.ts`, plus the two-branch either-order merge fixture and
  the transition cases, and show each failing.
- Change `scripts/changes/changelog-validation.ts` and `changelog-guard.ts` to read fragments from
  the branch diff (added, modified and deleted told apart, untracked included).
- In the same pull request: repoint every live reference the plan lists, add the
  `config/governance-alignment.json` claim with its history allowances, set ADR-0007 to
  `superseded` (`superseded_by` ADR-0027) and ADR-0027 to `active`.
- Record the branch with its own fragment plus the transition `CHANGELOG.md` entry and pointer line.

## Acceptance criteria

- [ ] Each refusing case in plan slice 2 is refused with a reason, and was shown failing first (`node --test scripts/changes/*.test.ts`).
- [ ] Two fixture branches from one base each add a fragment and merge into `main` in either order without a conflict, the guard passing on both (a case in `scripts/changes/changelog-guard.test.ts`).
- [ ] The transition case passes only while the base has no fragment, and a branch with a transition entry but no fragment is refused.
- [ ] The branch passes main's old `changelog:guard` (the PR's required `guards` check, which runs main's copy) and its own new one (`npm run changelog:guard`), and adds a fragment (`git diff --name-only origin/main...HEAD`).
- [ ] `npm run governance:check` refuses a planted sentence that still requires a `CHANGELOG.md` entry.
- [ ] `npm run check` passes, and an independent verifier rates these criteria at the final head.

## Out of scope

- Folding fragments into one file or generating a combined view (the owner chose the folder as the changelog).
- A `merge=union` attribute.
- Editing or moving existing `CHANGELOG.md` entries beyond the pointer line and transition entry.
- Changing the post-merge rule itself.
- Dependabot's exemption from the change-record guards (`.github/workflows/guards.yml`), which stays as it is, as the plan's constraints require.
