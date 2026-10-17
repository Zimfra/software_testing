---
type: ticket
title: Recognise changelog fragments as documentation
summary: Name the changelog/ fragment folder and pattern once, count a fragment as documentation in the AFK landing rule, and exclude fragments from governance:check, before any guard requires them.
tags: [area/git, area/planning, kind/convention]
created: 2026-10-17
updated: 2026-10-17
agent: claude-code
status: backlog
owner: agent
priority: P2
next_action: Start on a fresh branch from main with a failing afk-guard case for a branch that adds only a wiki page and a changelog fragment.
idea: "[[Changelog entries cannot conflict between branches]]"
ticket_kind: build
plan: "[[Per-branch changelog fragments plan]]"
depends_on: []
related: ["[[ADR-0027 Changelog entries are per-branch fragment files]]"]
evidence:
  - "VERIFIED: the plan was approved by PR 24, which gh pr view 24 shows MERGED by the owner (squash commit 6a28e1d)."
  - "VERIFIED: scripts/sandcastle/afk.ts:28 lists the documentation paths as wiki/**.md, docs/**.md and root *.md, so a changelog/ fragment is not documentation today; scripts/lib/paths.ts:6 names only CHANGELOG.md; config/governance-alignment.json:32 excludes CHANGELOG.md as history."
---

## Goal

A `changelog/<YYYY-MM-DD>-<slug>.md` fragment is recognised as documentation everywhere the
repository classifies paths, while `CHANGELOG.md` stays the required record.

## Approach

- Plan slice 1, "Fragment paths are recognised as documentation".
- Write the failing tests first: an `afk-guard` case (`scripts/sandcastle/afk-guard.test.ts`)
  where a branch adds only a wiki page and a fragment and is treated as documentation, and a
  governance case showing a fragment is not scanned.
- `scripts/lib/paths.ts`: name the `changelog/` folder and the fragment name pattern once.
- `scripts/sandcastle/afk.ts`: count a path matching that pattern as documentation.
- `config/governance-alignment.json`: exclude `changelog/**` as history, beside `CHANGELOG.md`.
- Record the branch with a `CHANGELOG.md` entry, as main's guard still requires.

## Acceptance criteria

- [ ] The new `afk-guard` case fails before the change and passes after it (`node --test scripts/sandcastle/afk-guard.test.ts`).
- [ ] The governance case shows a fragment under `changelog/` is not scanned (`npm run governance:check` tests).
- [ ] The branch adds no file under `changelog/` (`git diff --name-only origin/main...HEAD`).
- [ ] `npm run check` passes, and an independent verifier rates these criteria at the final head.

## Out of scope

- Any change to `changelog:guard` or to what a branch must record: slice 2,
  [[Switch the changelog to per-branch fragments]].
- Retiring rule, prompt or runbook text that names `CHANGELOG.md`: slice 2.
- Changing ADR-0007 or ADR-0027 status: slice 2.
