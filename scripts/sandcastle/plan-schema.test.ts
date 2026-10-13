import assert from "node:assert/strict";
import { test } from "node:test";
import { planSchema } from "./plan-schema.ts";

const validate = (value: unknown): ReturnType<typeof planSchema["~standard"]["validate"]> =>
  planSchema["~standard"].validate(value);

await test("planSchema accepts a plan and returns its issues", () => {
  const plan = { issues: [{ id: "42", title: "Fix auth bug", branch: "sandcastle/issue-42" }] };
  assert.deepEqual(validate(plan), { value: plan });
  assert.deepEqual(validate({ issues: [] }), { value: { issues: [] } });
});

await test("planSchema refuses a plan with the wrong shape, naming where", () => {
  const failing: [string, unknown, string][] = [
    ["a non-object", "nope", ""],
    ["null", null, ""],
    ["no issues list", {}, "issues"],
    ["issues that is not an array", { issues: "x" }, "issues"],
    ["an issue that is not an object", { issues: [1] }, "issues.0"],
    ["a numeric id", { issues: [{ id: 42, title: "t", branch: "sandcastle/issue-42" }] }, "issues.0.id"],
    ["a missing title", { issues: [{ id: "1", branch: "sandcastle/issue-1" }] }, "issues.0.title"],
    ["a missing branch", { issues: [{ id: "1", title: "t" }] }, "issues.0.branch"],
    ["an id that is not a number", { issues: [{ id: "1; rm", title: "t", branch: "sandcastle/issue-1" }] }, "issues.0.id"],
    ["a branch outside sandcastle/issue-N", { issues: [{ id: "1", title: "t", branch: "main" }] }, "issues.0.branch"],
    ["a branch that starts with a dash", { issues: [{ id: "1", title: "t", branch: "--all" }] }, "issues.0.branch"],
    ["a branch that names another issue", { issues: [{ id: "1", title: "t", branch: "sandcastle/issue-2" }] }, "issues.0.branch"],
    ["an id with a leading zero", { issues: [{ id: "007", title: "t", branch: "sandcastle/issue-007" }] }, "issues.0.id"],
    ["a title with a backtick", { issues: [{ id: "1", title: "run !`id`", branch: "sandcastle/issue-1" }] }, "issues.0.title"],
    ["a multi-line title", { issues: [{ id: "1", title: "a\nb", branch: "sandcastle/issue-1" }] }, "issues.0.title"],
    ["an empty title", { issues: [{ id: "1", title: "  ", branch: "sandcastle/issue-1" }] }, "issues.0.title"],
    ["an over-long title", { issues: [{ id: "1", title: "x".repeat(201), branch: "sandcastle/issue-1" }] }, "issues.0.title"],
    ["the same issue twice", { issues: [{ id: "1", title: "t", branch: "sandcastle/issue-1" }, { id: "1", title: "u", branch: "sandcastle/issue-1" }] }, "issues.1.id"],
    ["a branch with a path suffix", { issues: [{ id: "1", title: "t", branch: "sandcastle/issue-1/../x" }] }, "issues.0.branch"],
  ];
  for (const [name, value, path] of failing) {
    const result = validate(value);
    assert.ok("issues" in result && result.issues.length > 0, name);
    assert.equal("issues" in result ? result.issues[0]?.path.join(".") : undefined, path, name);
  }
});

// Sandcastle's extractObject (dist/index.js, 0.12.0) treats a truthy `issues` on the result as
// a validation failure and otherwise returns `value`; extractStructuredOutput is not exported, so
// the test applies that same contract to the schema's results.
await test("planSchema results follow the contract Sandcastle's Output.object reads", () => {
  const plan = { issues: [{ id: "7", title: "t", branch: "sandcastle/issue-7" }] };
  const accepted = validate(plan);
  assert.ok("value" in accepted && !("issues" in accepted), "a plan must not carry a top-level issues key on success");
  assert.deepEqual(accepted.value, plan);
  for (const bad of [{ issues: [{ id: "x", title: "t", branch: "sandcastle/issue-x" }] }, { issues: 3 }, null]) {
    const refused = validate(bad);
    assert.ok("issues" in refused && refused.issues.length > 0 && !("value" in refused));
  }
});
