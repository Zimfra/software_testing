---
type: ticket
title: S04 Content-sensitive working-state snapshots
summary: Detect content changes to tracked and nonignored untracked working files even when Git status text is unchanged.
tags: [area/git, area/typescript, area/planning]
created: 2026-10-16
updated: 2026-10-16
agent: opencode
status: proposed
owner: agent
priority: P1
next_action: Verify approval and S01 completion, then reproduce dirty-to-dirty changes missed by the current snapshot.
idea: "[[Execute the repository audit remediation]]"
project: "[[Repository audit remediation]]"
ticket_kind: build
plan: "[[Repository audit remediation implementation plan]]"
depends_on: ["[[S01 Fixture Git containment]]"]
related: ["[[Repository audit findings 2026-10-16]]"]
evidence:
  - "VERIFIED: this job spec preserves approved slice S04, finding A06 and its S01 prerequisite."
  - "UNKNOWN: job-spec approval and implementation evidence are pending."
---

## Goal

Make state verification detect changed working contents rather than only changed status classifications.

## Inputs

- Plan S04, audit A06, `scripts/git/git-state.ts` and `git-state.test.ts`.
- Read the documented coverage boundaries in the source and the hook-state lesson.

## Approach

1. Snapshot an already-modified tracked file and an existing untracked file, then overwrite their contents without changing status codes.
2. Digest the relevant file contents with explicit mode/symlink behavior and safe path handling.
3. Preserve hashes-only output and the documented treatment of bare repositories and ignored files.

## Acceptance criteria

- [ ] Dirty-to-dirty and untracked-to-untracked changes fail against the old snapshot and are detected after repair.
- [ ] Unchanged state passes; creation, deletion, mode changes and symlink target changes have explicit tested behavior.
- [ ] NUL-safe paths, including whitespace/control characters, are handled without following links outside the fixture.
- [ ] Snapshot output/messages expose no file contents or secret-bearing configuration values.
- [ ] Existing state/config/ref coverage and the full check still pass.

## Out of scope

Snapshotting ignored dependency trees, global configuration, hooks or the Git object store unless separately approved.

## Allowed files

- `scripts/git/git-state.ts`, `scripts/git/git-state.test.ts`; bounded new `scripts/git/working-tree-state*.ts` modules with sibling tests if needed.
- `wiki/lessons/Hook-run checks must preserve Git state.md`, `wiki/reference/Merge gate contract.md`, this ticket and `CHANGELOG.md`.

## Forbidden files

All other files, actual user working files and global Git settings.

## Human checkpoints

Verify job-spec approval and parent completion. Seek agreement before expanding the snapshot boundary beyond tracked/nonignored working state.

## Secrets needed

None; use generated fixture content and assert only digests and redacted diagnostics.

## Tests and evals

- `node --test "scripts/git/*state*.test.ts"`; `npm run check`.
- Positive: identical content/state, including a bare fixture where applicable.
- Broken: same porcelain output but different bytes; executable-bit and symlink changes; unreadable required input must not be a passing snapshot.

## Rollback and recovery

The checker detects damage but does not undo it. Preserve evidence and stop publication on a mismatch; restore only disposable fixtures automatically. Repair/revert code through a new PR.

## Evidence

Record before/after status equality, differing content digests, CLI exits and an independent verdict for each criterion.

## Wiki and doc updates

Update snapshot coverage statements and this ticket. Do not claim coverage of excluded state.
