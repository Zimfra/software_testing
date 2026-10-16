---
type: idea
title: Runbook prerequisites point at the token check
summary: The Sandcastle runbook's Prerequisites now tell the reader to run the Token setup check before the first loop on a new token, and why the throwaway comment is the part that proves write access.
tags: [area/agents, area/github, tool/claude-code]
created: 2026-10-16
updated: 2026-10-16
agent: claude-code
status: in-progress
owner: human
priority: P3
next_action: Owner reviews and merges the pull request.
related: ["[[Run Sandcastle on GitHub issues]]", "[[Sandcastle token setup lessons]]"]
evidence:
  - "VERIFIED: the Prerequisites section of wiki/runbooks/Run Sandcastle on GitHub issues.md now carries one bullet after the GH_TOKEN bullet pointing at Token setup step 5, read on 2026-10-16."
  - "VERIFIED: npm run wiki:lint passed on 2026-10-16 after the edit and after the rewording that followed review."
  - "INFERRED: a token that reads but cannot write answers 403 only on the write, so the failure lands after the agents run, from the 403 troubleshooting entry and the Token setup notes in the same runbook."
  - "VERIFIED: a finder agent in a separate context read the first head and found that the step 5 command only reads, so only the throwaway comment tests write access; the bullet and this record were reworded to say so."
---

## Problem

The GH_TOKEN bullet in the runbook's Prerequisites named the "Token setup" check but did not say
why running it before the first loop matters. A fine-grained token with Issues read but not write
reads issues fine, so the planner and implementer succeed; it refuses only when an agent comments,
after the agents have already done their work. The step 5 command only reads, so the throwaway
comment in that step is what proves write access.

## Desired outcome

A reader setting up a new token runs the check first, throwaway comment included, and catches a
read-only token before a run, with the reason stated in one plain bullet that links to "Token
setup" instead of copying its steps.

## Next step

Owner review and merge.

## Observations

- [no-doc-change: this change is the runbook edit itself; no script or guard changes]
- Prevention: none. This is prose in a runbook, not an enforceable behaviour; wiki:lint checks the
  note's structure and evidence labels, not that the bullet says what it should.
