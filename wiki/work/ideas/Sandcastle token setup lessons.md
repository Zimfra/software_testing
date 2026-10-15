---
type: idea
title: Sandcastle token setup lessons
summary: Swapping the sandbox GH_TOKEN to the machine account hit five distinct failures; the runbook now lists the steps and the checks that tell them apart.
tags: [area/agents, area/github, tool/claude-code]
created: 2026-10-16
updated: 2026-10-16
agent: claude-code
status: in-progress
owner: human
priority: P2
next_action: Owner reviews and merges the pull request, then revokes the replaced tokens, including the one created under the owner account by mistake.
related: ["[[Run Sandcastle on GitHub issues]]", "[[First real Sandcastle run and the wrapper probe fix]]"]
evidence:
  - "VERIFIED: on 2026-10-15 the first machine account token was refused by the organisation for a lifetime over 366 days, and the second could read issues but answered addComment with 'Resource not accessible by personal access token' in the agents' logs."
  - "VERIFIED: a check from the sandbox image with the env file printed the login and the token expiry; a token created under the owner account printed the owner login and could comment, and a token with the machine account as resource owner printed the machine login and answered 403 on comments."
  - "VERIFIED: gh api orgs/<org>/memberships/<machine-account> returned pending while the resource owner list offered only the account itself, and active after the invitation was accepted."
  - "VERIFIED: a new token with the organisation as resource owner still answered 403 until the owner approved it; after approval a comment on the trial issue was authored by the machine account."
  - "UNKNOWN: whether a token created before the invitation is accepted could ever be edited into an organisation token; the runbook says to create a new one because the string and expiry did not change after edits."
---

## Problem

The first real run showed the sandbox token was the owner's personal one. Replacing it with a
machine account token took several rounds because each failure looked like the previous one: a
403 on comments.

## Desired outcome

The runbook's "Token setup" section lists the order that works (accept the invitation, pick the
organisation as resource owner, Issues read and write, owner approval, then a check that prints the
login and expiry) so the next swap needs one pass.

## Next step

Owner review, then revoke the replaced tokens.

## Observations

- [no-doc-change: the runbook itself is updated in this branch; no script or guard changes]
- The check in the runbook runs inside the sandbox image, so it tests the string the loop will
  use and not the one in the owner's shell.
