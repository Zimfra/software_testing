---
type: ticket
title: Choose the landing audit history scope
summary: Decide whether landing assurance covers the fork's own history or separately validates inherited upstream and fork history.
tags: [area/planning, area/git, area/github]
created: 2026-10-16
updated: 2026-10-16
agent: opencode
status: backlog
owner: human
priority: P2
next_action: Ask the owner which history the landing audit must certify before choosing its configuration and fixtures.
idea: "[[Execute the repository audit remediation]]"
project: "[[Repository audit remediation]]"
ticket_kind: decision
map: "[[Repository audit remediation map]]"
depends_on: []
evidence:
  - "VERIFIED: config/landing-audit.json names ahzeems/Zeemrepo while the current origin is Zimfra/software_testing; the first-parent history contains merged pull requests from both repositories."
  - "VERIFIED: the audit's GitHub query found the latest audited merge in the fork and no associated pull request for that commit in the configured upstream repository."
---

## Question

Should the landing audit validate inherited upstream history and fork history separately, or
begin its assurance at a documented fork boundary?

## Evidence

Finding A07 in [[Repository audit findings 2026-10-16]] identifies a repository mismatch. Replacing
the repository name alone would misattribute older upstream PR numbers. The choice changes
the configuration model, external queries, failure handling and test fixtures.

## Options

1. **Repository-specific history segments.** Preserve upstream provenance with explicit immutable
   boundaries and repository identities, then validate the fork's own segment against the fork.
   This retains historical assurance but depends on access to both repositories' records.
2. **Fork-only assurance.** Choose and document a verified starting commit for the fork. Treat
   inherited history as outside the audit's guarantee. This is simpler but deliberately narrows
   what a passing audit establishes.

## Recommendation

Use repository-specific segments if the existing whole-history assurance remains a requirement.
Prefer the fork-only approach only with an explicit owner decision to narrow that guarantee.
In either case, validate the PR's actual base branch and use a freshly fetched, pinned revision.

## Resolution

Unresolved. Record the owner's required assurance and the evidence for the chosen boundary.
