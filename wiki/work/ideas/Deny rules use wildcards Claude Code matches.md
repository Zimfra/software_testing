---
type: idea
title: Deny rules use wildcards Claude Code matches
summary: The API merge deny rule mixed a * wildcard with the trailing :* form, which Claude Code reads as a literal prefix; it now ends in merge* and a test refuses the mix.
tags: [area/agents, area/git]
created: 2026-10-11
updated: 2026-10-11
agent: claude-code
status: done
owner: human
priority: P2
evidence:
  - "VERIFIED: Claude Code 2.1.296 warned at startup that Bash(gh api -X PUT repos/ahzeems/Zeemrepo/pulls/*/merge:*) mixes * with the trailing :* prefix syntax and is matched as a literal prefix; git log -S shows the rule was added in b4b589e (2026-10-09)."
  - "VERIFIED: scripts/git/hooks.test.ts failed on the old rule and passes on the fixed one; applied to the ten deny rules, the new check flags only that rule."
  - "OWNER DECISION: the owner approved the plan to fix the flagged rule (2026-10-11)."
  - "INFERRED: Claude Code's permissions page (code.claude.com/docs/en/permissions, Wildcard patterns, read 2026-10-11) documents :* only at the end of a pattern and is silent on mixing it with *; the defect was in this repository's rule, not in Claude Code."
---

## Problem

One deny rule in `.claude/settings.json` never matched anything, so it never blocked a merge
through the GitHub API. The merge-blocking hook and the `protect-main` ruleset still stopped such a
merge, so nothing slipped through.

## Desired outcome

Every deny rule uses a pattern Claude Code applies, and a test fails if one stops doing so.

## Next step

None: done with the evidence above. The Merge gate contract's deny-rule row now says how the rules
match and what the test refuses.
