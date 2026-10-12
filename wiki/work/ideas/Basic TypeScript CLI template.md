---
type: idea
title: Basic TypeScript CLI template
summary: A minimal, tested TypeScript CLI under scripts/app/ to copy when starting a new script application, with an npm run ci script for type checking and tests.
tags: [area/typescript, tool/node]
created: 2026-10-12
updated: 2026-10-12
agent: claude-code
status: in-progress
owner: claude-code
priority: P2
next_action: Owner reviews and merges the pull request for issue #1.
related: []
evidence:
  - "VERIFIED: scripts/app/greet.test.ts failed before scripts/app/greet.ts existed (the import of ./greet.ts could not resolve) and passes after; 7 subtests across greet and main cover the name, the empty-name default, and the usage error."
  - "VERIFIED: node scripts/app/greet.ts printed 'Hello, world!' with no argument, 'Hello, Ada!' for one name, and 'usage: greet [name]' with exit 2 for two arguments."
  - "VERIFIED: npm run ci (tsc then node --test with coverage) exits 0 with 587 tests passing; greet.ts covers 100% of lines, its one uncovered function is the entry-point lambda, and the overall gate holds (lines 99.63%, functions 96.45%, branches 92.53%)."
---

Delivers GitHub issue #1: scaffold a basic TypeScript template with a very simple CLI, tests
with type checking, and a CI script that type-checks and runs the tests.

## Problem

A newcomer starting a new script application here has no minimal, working example to copy. The
existing scripts are governance guards, which mix the CLI shape with their own logic.

## Desired outcome

A tiny CLI under `scripts/app/` that follows the repository's `main`/`isEntryPoint` convention
from `scripts/lib/cli.ts`, has a sibling `node:test` test, type-checks, and is runnable with
`node scripts/app/greet.ts`. A single `npm run ci` command runs the type check and the tests,
the same pair the `check` workflow already runs on every pull request.

## Next step

Owner reviews and merges the pull request. The work is done only when the owner merges.

## Observations

- The CLI reuses `scripts/lib/cli.ts`; the only uncovered function is the entry-point lambda,
  which in-process tests cannot reach, as with every other script here.
- [no-doc-change: the template is an example that adds no rule, guard or workflow step; the
  change-record reference and runbooks are unaffected]
