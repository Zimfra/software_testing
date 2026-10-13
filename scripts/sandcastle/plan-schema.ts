import type { PlannedIssue } from "./already-done.ts";

export type Plan = { issues: PlannedIssue[] };
type Issue = { message: string; path: string[] };
type Result = { value: Plan } | { issues: Issue[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseIssue(entry: unknown, index: number): { issue: PlannedIssue } | { problems: Issue[] } {
  const at = ["issues", String(index)];
  if (!isRecord(entry)) return { problems: [{ message: "an issue must be an object", path: at }] };
  const { id, title, branch } = entry;
  const problems = Object.entries({ id, title, branch })
    .filter(([, field]) => typeof field !== "string")
    .map(([name]) => ({ message: `${name} must be a string`, path: [...at, name] }));
  if (typeof id !== "string" || typeof title !== "string" || typeof branch !== "string") return { problems };
  // The plan comes from a model that read untrusted issue text, and the branch goes into git and gh.
  if (!/^\d+$/.test(id)) return { problems: [{ message: "id must be an issue number", path: [...at, "id"] }] };
  if (branch !== `sandcastle/issue-${id}`) return { problems: [{ message: `branch must be sandcastle/issue-${id}`, path: [...at, "branch"] }] };
  return { issue: { id, title, branch } };
}

function parsePlan(value: unknown): Result {
  if (!isRecord(value)) return { issues: [{ message: "the plan must be an object", path: [] }] };
  const list = value["issues"];
  if (!Array.isArray(list)) return { issues: [{ message: "issues must be an array", path: ["issues"] }] };
  const parsed = list.map(parseIssue);
  const problems = parsed.flatMap((entry) => ("problems" in entry ? entry.problems : []));
  if (problems.length > 0) return { issues: problems };
  return { value: { issues: parsed.flatMap((entry) => ("issue" in entry ? [entry.issue] : [])) } };
}

// The Standard Schema (https://standardschema.dev) that Output.object takes, written by hand
// because the plan has three string fields; a validation library would be a dependency for that.
export const planSchema = {
  "~standard": { version: 1 as const, vendor: "zeemrepo", validate: parsePlan },
};
