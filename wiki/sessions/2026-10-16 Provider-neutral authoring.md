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

The owner then requested committed planning and a pull-request handoff for execution by a
different LLM session. Recorded the baseline inventory, project, map, three unresolved decisions,
publication prerequisite and [[Resume repository audit remediation]].

The owner selected full-workflow isolation with a controlled host import. Recorded the answer in
[[Choose the Sandcastle execution boundary]], updated the map's frontier and opened
[[Establish a feasible isolated Sandcastle handoff]] for the remaining factual design question.

The owner approved the partial-failure policy in [[Define Sandcastle partial-failure outcomes]].
Recorded the four approved behaviors and advanced the map to the history-scope decision.

The owner selected fork-only auditing and requested detailed progress explanations. Verified
the inherited starting commit against Git history and the fork's first merged PR, recorded the
scope in [[Choose the landing audit history scope]], and added the reporting preference to the
fresh-session handoff. Began the isolated-handoff feasibility research.

Moved the publication prerequisite to [[Planning pull request publication is blocked]] and
superseded its map ticket: a delivery authentication issue should not block design-map completion.

Source research identified the SDK's no-sandbox provider as a supported inner runtime for an
outer disposable container. A temporary Git experiment preserved the exported commit SHA,
rejected a missing-prerequisite bundle, and transferred no source config, hook or untracked file.
Recorded the research limits and [[Audit remediation verification approach]] for owner agreement.

After the owner directed the agent to proceed and complete the PR, recorded
[[Repository audit remediation implementation plan]] with 26 proposed slices covering A01-A22,
their dependencies, acceptance controls and the fresh-session approval/execution contract.

The plan exposed a validator defect that counted a downstream plan as an unfinished map ticket.
Added a failing regression control and fixed the type check; all 40 work-tracking tests then
passed. The proposed-plan tree passed the full check with 766 Node and 56 Python tests, plus
all seven trusted guard CLIs from main. The initial plan uses a related map link until that fix lands.

## Outcome

The implementation and verification are tracked in the originating idea. The work was authored
through OpenCode with GPT-6 Astra, using the repository skills directly rather than an ECC run.
The full check passed 762 Node tests and 56 Python tests. Main's wiki, skill, governance and
ECC-rules guards also passed against the changed tree.

## Open items

The provider-neutral change passed independent review at 7fd3faa. Review the proposed plan and
publish it through the machine account for owner merge approval. Live containment proof belongs
to implementation. No proposed plan or build ticket is approved by the authoring session.
