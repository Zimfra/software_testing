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
    ["a numeric id", { issues: [{ id: 42, title: "t", branch: "b" }] }, "issues.0.id"],
    ["a missing title", { issues: [{ id: "1", branch: "b" }] }, "issues.0.title"],
    ["a missing branch", { issues: [{ id: "1", title: "t" }] }, "issues.0.branch"],
  ];
  for (const [name, value, path] of failing) {
    const result = validate(value);
    assert.ok("issues" in result && result.issues.length > 0, name);
    assert.equal("issues" in result ? result.issues[0]?.path.join(".") : undefined, path, name);
  }
});
