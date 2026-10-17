---
type: issue
title: Docker-capable containment proof is unavailable locally
summary: This checkout has no Docker executable, so containment evidence must come from a Docker-capable runner or an owner-authorized local setup.
tags: [area/agents, area/planning]
created: 2026-10-16
updated: 2026-10-17
agent: opencode
status: blocked
owner: human
priority: P1
issue_kind: environment
next_action: S12 adds the real container control to a required CI job on GitHub's Docker-capable runners and records a matching-head passing run; no local Docker is installed.
blocker: No containment proof exists until S12 lands its CI control; command -v docker also returns exit 1 on the machine now used.
idea: "[[Execute the repository audit remediation]]"
project: "[[Repository audit remediation]]"
related: ["[[S12 Reproducible runtime and real containment control]]", "[[S18 Public-command cutover and end-to-end isolation proof]]"]
evidence:
  - "VERIFIED: command -v docker returned exit 1 on 2026-10-16 while creating the job specs."
  - "UNKNOWN: real containment has not been demonstrated locally; S12 must create and run the required non-model container control."
  - "OWNER DECISION: on 2026-10-17 the owner chose \"CI runners only (Recommended)\": the containment proof for S12, S14, S15 and S18 comes from CI, and nothing is installed locally."
  - "VERIFIED: on 2026-10-17 the required check and guards workflows run on ubuntu-latest; command -v docker and command -v podman found nothing on the machine now used."
---

## Reproduction

Run `command -v docker` in the selected environment. The job-spec authoring session received
exit 1. No Docker daemon, image or model-backed run was started.

## Expected and actual

The isolation acceptance requires a real Docker-capable boundary control. This machine cannot
currently supply it. Unit tests and source inspection are useful but do not satisfy that proof.

## Root cause

No Docker executable is available on the current PATH. Whether another host or the intended
CI image provides the complete runtime must be checked where the control will actually run.

## Fix

S12 wires the real control into an existing required CI check on a Docker-capable runner. A
matching-head passing CI result can resolve the proof prerequisite without installing Docker
on every authoring machine. Local installation or additional infrastructure needs owner authorization.

## Verification

Record the runtime/image identities, actual smoke command, head SHA, host/guest sentinel results
and CI URL. Close this issue only when a verified execution environment supplies the required proof;
do not claim that the local machine was repaired if the proof came from CI.

## Prevention

None yet for the new boundary: S12 creates the runner and its required CI integration. Until then,
the manual runtime preflight must report missing proof instead of a successful skip.
