---
type: idea
title: The privacy scan treats the sandbox user agent as a role name
summary: The wiki redaction scan lists agent beside node and runner as a role name, so wiki:lint passes for the Sandcastle sandbox user and agents need no --no-verify for it.
tags: [area/wiki, area/agents]
created: 2026-10-12
updated: 2026-10-12
agent: claude-code
status: in-progress
owner: human
priority: P2
next_action: Owner reviews and merges the pull request; then decide whether the home-path pattern may allow the sandbox user's home directory before .sandcastle/ is tracked.
evidence:
  - "OWNER DECISION: \"add agent to the role names which roles explain this with an example\" (2026-10-12), after the options were laid out: add agent to the role names, or rename the sandbox user."
  - "VERIFIED: scripts/wiki/redaction.test.ts failed before the change (the service-account test, 1 of 35, because agent counted as a personal username) and passes after (35 of 35); scripts/wiki/wiki-validation.test.ts passes 59 of 59; npm run lint and npm run typecheck are clean."
  - "VERIFIED: in the Sandcastle sandbox image running as the user agent, npm run wiki:lint on a copy of this branch exits 0 (42 notes OK). Before the change the same check, run as agent, flagged the agent: field of repository notes as this machine's username."
  - "VERIFIED: a control note containing a home path with a real username is still flagged by wiki:lint in the same sandbox, so the list entry did not switch off the path check."
  - "VERIFIED: the upstream Sandcastle README names a non-root agent user as required (read 2026-10-12), and the image's /etc/passwd lists agent with uid 1000 and a home directory named after the user."
---

## Problem

The Sandcastle sandbox image runs as a user named `agent`. The wiki privacy scan
(`scripts/wiki/redaction.ts`) flags the machine's login name wherever it appears, and `agent` is
also the value of the `agent:` field in every note. Run as `agent`, `wiki:lint` therefore failed
on the notes, so the pre-commit hook failed inside the sandbox and the agents committed with
`--no-verify`.

## Desired outcome

`agent` counts as a role name, like `node`, `runner` and `ci`, so the scan passes in the
sandbox while a login that names a person is still flagged.

## Next step

Owner review. The change is one word in `SERVICE_ACCOUNTS` and the assertions in
`scripts/wiki/redaction.test.ts`.

## Observations

- Renaming the sandbox user was the alternative. The Sandcastle README says the `agent` user is
  required and bind-mounts the repository under that user's home directory, and any other name of
  four characters or more would be flagged the same way unless it was also added to the list.
- Not covered here: the sandbox user's home-directory paths in `.sandcastle/Dockerfile`. They trip the separate
  home-path pattern (`redaction.ts`, "home path with username"), which only allows `<user>` and
  `linuxbrew`. That matters once `.sandcastle/` is tracked, and it needs its own test-first change.
- [no-doc-change: the change adds one name to a list that tests document, and no written rule states the list]
- A rule that lists accounts is built from the environment, so it has to be tested in the
  environment that fails: [[A rule built from the environment needs testing in that environment]].
