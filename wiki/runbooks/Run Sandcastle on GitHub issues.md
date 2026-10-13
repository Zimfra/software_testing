---
type: runbook
title: Run Sandcastle on GitHub issues
summary: Run npm run sandcastle so Docker-sandboxed Claude agents plan, implement, review and merge issues labelled Sandcastle onto your branch, without pushing or closing anything.
tags: [area/agents, area/github, tool/claude-code, kind/setup]
created: 2026-10-13
updated: 2026-10-13
agent: claude-code
status: draft
related: ["[[Land a change]]", "[[Verify a repository change]]", "[[Sandcastle runs under the repository rules]]"]
---

> **Status:** draft. Written by an agent from the tracked `.sandcastle/` files and the Sandcastle
> 0.12.0 README. The image build and the loop itself were not run while writing it; each item
> below says whether it was observed.

Facts captured 2026-10-13 from `@ai-hero/sandcastle` 0.12.0 (`node_modules/@ai-hero/sandcastle/README.md`)
and `.sandcastle/main.ts`. Re-check with `npm ls @ai-hero/sandcastle` and that README after an upgrade.

## When to use

Sandcastle is a library that runs Claude Code agents inside Docker containers and returns their
commits on git branches. `npm run sandcastle` runs `.sandcastle/main.ts`, which repeats three
phases, at most 10 rounds:

1. **Plan.** One agent reads the open issues of `Zimfra/software_testing` that carry the
   `Sandcastle` label and picks the ones no other open issue blocks. Each gets the branch name
   `sandcastle/issue-<number>`. An issue whose branch is already merged into the branch you ran
   from is skipped and the log says so (`scripts/sandcastle/already-done.ts`).
2. **Implement, then review.** For each planned issue, a sandbox on that branch runs the
   implementer (up to 100 iterations); if it committed, a reviewer then runs once on the same
   branch. Issues run in parallel.
3. **Merge.** One agent merges every branch that produced commits into the branch you ran from,
   runs `npm run typecheck` and `npm run test`, and comments on each issue.

What it does not do: it never pushes, opens a pull request or notifies anyone, and its prompts
tell it not to close issues. An issue is done when the owner merges its pull request
(see [[Land a change]]), so a person pushes the integration branch and runs `npm run pr`, or
runs the loop through `npm run sandcastle:afk` (below), which does that landing step.

Use it for small, well-specified issues. Rules the agents follow are in `CLAUDE.md` and
`.claude/rules/zeem/`; the prompts point there instead of restating them.

## Prerequisites

- Docker running; Node from `.nvmrc` and `npm ci` done on the host.
- The `Sandcastle` label exists on the repository and is on the issues to work.
- `.sandcastle/.env` (git-ignored; copy `.sandcastle/.env.example`) holding, by name only:
  `CLAUDE_CODE_OAUTH_TOKEN` (from `claude setup-token` on the host; it should start with
  `sk-ant-oat`) or `ANTHROPIC_API_KEY`, and `GH_TOKEN`.
- The `GH_TOKEN` is a fine-grained token limited to this one repository with **Issues** read and
  write. Grant no Contents and no Pull requests permission: the agents must not be able to push
  or open a pull request, and [[ADR-0025 Agents use a machine account and the owner approves]]
  keeps merging with the owner.
- The sandbox image built once, and again after any `.sandcastle/Dockerfile` change:
  `npx sandcastle docker build-image`. It passes your user and group ids so the image user
  `agent` matches your host user (README, "sandcastle docker build-image").

## Steps

1. Start from a fresh feature branch, never `main`. The plan and merge phases work in your own
   checkout, so the merge commits land on whatever branch is checked out.
2. Commit or set aside your own changes first; the merge agent works in your working tree.
3. Run `npm run sandcastle`. Logs go to `.sandcastle/logs/` and worktrees to
   `.sandcastle/worktrees/`; both are git-ignored.
4. The loop stops when the planner returns no issue (`No unblocked issues to work on. Exiting.`)
   or after round 10.
5. Review what landed with [[Verify a repository change]], read the implementer log too, then
   land it with [[Land a change]].

## Verify

- `git log main..HEAD` shows the agents' commits with `<type>: <description>` subjects. The merge
  agent runs `git merge <branch> --no-edit` per branch, so each branch that was not a
  fast-forward has its own merge commit.
- `git ls-files .sandcastle` lists no `.env`, `logs/` or `worktrees/` entry.
- `npm run check` exits 0 on the branch before `npm run pr`.

## Unattended run with `npm run sandcastle:afk`

`npm run sandcastle:afk` (`scripts/sandcastle/afk.ts`) runs the loop and then lands its work, so
you can leave. It runs on the host, from the feature branch checked out, and takes no arguments.
In order:

1. Refuses, saying why and exiting 1, when the branch is `main`, HEAD is detached or the tree
   has uncommitted changes (reported together), and when `gh repo view` fails, which means `gh`
   is not logged in or cannot see the repository. Nothing has run yet. A login that is the
   repository owner is refused by step 4, after the loop; the work then stays merged on the
   branch.
2. Runs `node .sandcastle/main.ts`. If that exits non-zero the wrapper stops with exit 2 and
   nothing is pushed or commented.
3. Runs `git fetch origin main`, then lists the local branches named `sandcastle/issue-<N>` that
   this run merged into `HEAD` and that are not on `origin/main` and hold a commit of their own
   (the branch reflog, as in the already-done guard). The list comes from git, not from the log.
   A branch that was already merged before the run started is not announced, so an issue whose
   pull request never opened must be landed with `npm run pr` by hand. If there are none it says
   so and exits 0 without opening anything.
4. Runs `node scripts/git/pr-ready.ts`, the tool behind `npm run pr`, with its output streamed to
   the terminal: it runs `npm run check`, refuses a `gh` login that is the repository owner,
   pushes the branch and opens or reports the pull request. Its refusal (exit 1) or failure
   (exit 2) is passed on, and the wrapper says the landing step stopped and that nothing was
   commented. It then asks `gh pr view <branch> --json url` for the pull request URL; no URL is
   exit 2.
5. Comments on each listed issue with `gh issue comment <N> -R <repository gh reported>`, giving
   the pull request URL and saying it waits for the owner's review. A comment that fails does
   not stop the others; the wrapper then exits 2 and names the issues. The merge prompt also
   comments on each issue it merged, so an issue can carry two comments.

What notifies the owner: GitHub's review request on the pull request (the owner is the code
owner) and the comment on each issue. There is no other channel. What it deliberately does not
do: push or merge `main`, merge or approve a pull request, close an issue, skip a hook with
`--no-verify`, change a repository setting or read `.sandcastle/.env`. The pull request stays
open until the owner merges it in the browser.

Requirements on top of the prerequisites above: the host `gh` is logged in as the machine
account, not the owner ([[ADR-0025 Agents use a machine account and the owner approves]]), and
the branch contains `origin/main` when step 4 runs, or `npm run pr`'s tool refuses and you merge
`main` into the branch yourself.

Verified 2026-10-13 by `scripts/sandcastle/afk.test.ts` against real temporary git repositories
with the loop, `pr-ready`, `gh` and `npm` replaced by scripted runners: the order of the steps,
which branches are selected (merged by this run, not on `origin/main`, correctly named, with a
commit of their own), each refusal including an unresolvable repository, both exit codes of the
landing step, a URL taken from `gh` and not from the tool's text, a failing comment, and that no call pushes,
merges, closes, bypasses a hook or names `.env`. Not exercised: the real `gh`, Docker, the
Sandcastle loop, a real push, and GitHub's review request reaching the owner.

## Known notes

- The Dockerfile base is `node:22-bookworm` while `.nvmrc` says 24, so the sandbox may not run
  the full `npm run check`. Reported from the 2026-10-12 run; not re-run here.
- `.sandcastle/main.ts` names the model `claude-opus-4-8`. Check that id is current before a
  long run; not verified here.
- `.sandcastle/main.ts` is type-checked by `npm run typecheck` but not linted: the `files` globs
  in `eslint.config.ts` cover only `scripts/**/*.ts` and `eslint.config.ts` itself, and the
  file keeps the upstream template's style.
- The already-done guard drops an issue only when its `sandcastle/issue-<number>` branch is
  merged into the current branch and its reflog holds a commit entry (a commit made on the
  branch). A branch that was created, reset or renamed and never committed to stays pending.
  Three limits follow: a pull request that the owner squash-merges leaves a branch that is never
  an ancestor, so delete that local branch or close the issue; a branch whose reflog has expired
  is planned again, which costs a run and loses nothing; and a branch that holds only part of an
  issue's work, once merged, is dropped on the next round, so the implementer is told to say in
  the issue comment when a task is incomplete and the owner reads that comment before merging.
- The planner's output is validated before anything runs: `id` is a positive number without
  leading zeros, `branch` is `sandcastle/issue-<id>`, an issue appears once, and `title` is
  non-empty after it is normalised to one line of at most 200 characters with backticks and
  control characters replaced. The title is cleaned, not refused, because a code span in an issue
  title is ordinary and a refusal aborts the loop. Sandcastle 0.12.0 marks a prompt's own
  backticked commands before it substitutes arguments, so a title cannot become one; the
  cleaning keeps titles readable in logs and prompts. The schema is not a prompt-injection
  control: the agents have a shell and read the issue text.
- A merged branch whose typecheck or tests still fail after the merger's fix attempt is not
  undone, and the next round drops it as done; read the integration branch's checks before
  landing it. A branch that holds commits which were never merged (a reviewer that threw, a
  reset merge) can stall: the merger only receives branches that gained commits in the same
  round, so the implementer is planned again for it up to the iteration limit.
- The review prompt runs `git diff <current branch>...` in a shell, so run the loop from a
  branch whose name is plain (letters, digits, `-`, `/`).
- `main.ts` does not refuse to run on `main`; run it on a feature branch. The AFK wrapper refuses
  on `main`.

## Troubleshooting

Reported by the owner from earlier runs and not reproduced while writing this page.

- The agent refuses its credential: an OAuth token from `claude setup-token` must start with
  `sk-ant-oat`.
- `gh` answers 403: the token is still pending approval by the organisation, or it lacks the
  Issues permission on this repository.
