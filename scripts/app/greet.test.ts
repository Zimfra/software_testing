import assert from "node:assert/strict";
import { test } from "node:test";
import { EXIT_ERROR, EXIT_OK, type Output } from "../lib/cli.ts";
import { greet, main } from "./greet.ts";

function capture(): Output & { out: string[]; err: string[] } {
  const out: string[] = [];
  const err: string[] = [];
  return { out, err, write: (line) => out.push(line), warn: (line) => err.push(line) };
}

await test("greet", async (t) => {
  await t.test("addresses the name it is given", () => {
    assert.equal(greet("Ada"), "Hello, Ada!");
  });

  await t.test("greets the world when the name is empty", () => {
    assert.equal(greet(""), "Hello, world!");
  });
});

await test("main", async (t) => {
  await t.test("prints a greeting for the one name argument and returns EXIT_OK", () => {
    const output = capture();
    assert.equal(main(["Grace"], output), EXIT_OK);
    assert.deepEqual(output.out, ["Hello, Grace!"]);
    assert.deepEqual(output.err, []);
  });

  await t.test("greets the world when no name is given", () => {
    const output = capture();
    assert.equal(main([], output), EXIT_OK);
    assert.deepEqual(output.out, ["Hello, world!"]);
  });

  await t.test("refuses more than one argument with usage on stderr and EXIT_ERROR", () => {
    const output = capture();
    assert.equal(main(["a", "b"], output), EXIT_ERROR);
    assert.deepEqual(output.out, []);
    assert.deepEqual(output.err, ["usage: greet [name]"]);
  });
});
