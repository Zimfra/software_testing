---
type: session
title: 2026-10-16 Provider-neutral authoring
summary: The owner requested provider-neutral authoring after the audit planning handoff exposed harness restrictions; tests first reproduced the barriers before their removal.
tags: [area/agents, area/wiki]
created: 2026-10-16
updated: 2026-10-16
agent: opencode
status: active
idea: "[[Allow any agent provider to work in the repository]]"
---

## Goal

Allow the current agent to plan and record audit remediation under the shared repository rules.

## What was done

Identified the author, adapter, governance and workflow-path restrictions. Added targeted tests
and observed their failures before updating the checks. Recorded the owner's policy decision in
[[ADR-0026 Any provider may work under shared rules]] and the workflow in
[[Work with any agent provider]].

## Outcome

The implementation and verification are tracked in the originating idea. The work was authored
through OpenCode with GPT-6 Astra, using the repository skills directly rather than an ECC run.
The full check passed 762 Node tests and 56 Python tests. Main's wiki, skill, governance and
ECC-rules guards also passed against the changed tree.

## Open items

Complete independent review, publish through the machine account, and return
to the audit remediation map. The provider-neutral policy does not decide the map's architecture
or failure-handling questions.
