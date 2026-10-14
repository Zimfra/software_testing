import assert from "node:assert/strict";
import type { RepoFixture } from "../test-support/repo-fixture.ts";
import { test } from "node:test";
import type { Run } from "../git/pr-ready.ts";
import { EXIT_ERROR, EXIT_OK, EXIT_REFUSED } from "../lib/cli.ts";
import { comments, fixture, go, issueBranch, mergeInto, runner } from "../test-support/afk-harness.ts";

// Anything that is not documentation. The guard is an allowlist of documentation paths, so a path
// no one thought of (a root json.py that `python3 -m unittest` would import, a nested eslint config,
// an upper-case Scripts/ on a case-insensitive disk) is refused by default.
const EXECUTED = [
  "scripts/git/pr-ready.ts", "scripts/lib/git.ts", "scripts/app/thing.ts", "scripts/claude/block.ts",
  "evals/compliance/run.py", "config/rules.json", ".claude/settings.json", ".claude/rules/zeem/x.md",
  ".githooks/pre-push", ".github/workflows/check.yml", ".sandcastle/main.ts", ".sandcastle/plan-prompt.md",
  "package.json", "package-lock.json", "tsconfig.json", "eslint.config.ts", ".npmrc", ".nvmrc",
  "json.py", "unittest.py", "wiki/eslint.config.js", "Scripts/evil.test.ts", "setup.sh", "wiki/diagram.png",
];
const DOCS = ["wiki/note.md", "wiki/runbooks/Some page.md", "CHANGELOG.md", "README.md", "docs/guide.md", "NOTES.md"];

function landingLoop(repo: RepoFixture, paths: string[], extra: { failComments?: string[]; also?: () => void } = {}): { run: Run; calls: string[] } {
  repo.git(["switch", "--quiet", "-c", "sandcastle/issue-4", "feat/afk-work"]);
  for (const path of paths) repo.write(path, "// changed by an agent\n");
  repo.commit("feat: four");
  repo.git(["switch", "--quiet", "feat/afk-work"]);
  return runner(repo, { ...(extra.failComments === undefined ? {} : { failComments: extra.failComments }), loop: () => { mergeInto(repo, "feat/afk-work", "sandcastle/issue-4"); extra.also?.(); return 0; } });
}

await test("a run that changed anything but documentation is not landed unattended", async (t) => {
  for (const path of EXECUTED) {
    await t.test(path, (t) => {
      const repo = fixture(t);
      const { run, calls } = landingLoop(repo, [path]);
      const result = go(repo, run);
      assert.equal(result.code, EXIT_REFUSED);
      assert.ok(result.err.includes(path), "names the file");
      assert.match(result.err, /SANDCASTLE_AFK_LAND_CODE/);
      assert.ok(!calls.some((call) => call.includes("pr-ready")), "nothing is landed");
    });
  }
  for (const path of DOCS) {
    await t.test(`${path} lands`, (t) => {
      const repo = fixture(t);
      const { run, calls } = landingLoop(repo, [path]);
      assert.equal(go(repo, run).code, EXIT_OK);
      assert.ok(calls.includes("node scripts/git/pr-ready.ts"));
    });
  }
  await t.test("documentation together with code is refused, naming only the code", (t) => {
    const repo = fixture(t);
    const { run } = landingLoop(repo, ["wiki/note.md", "scripts/app/thing.ts"]);
    const result = go(repo, run);
    assert.equal(result.code, EXIT_REFUSED);
    assert.ok(result.err.includes("scripts/app/thing.ts"));
    assert.ok(!result.err.includes("wiki/note.md"));
  });
  await t.test("the owner's opt-in lets code land", (t) => {
    const repo = fixture(t);
    const { run, calls } = landingLoop(repo, ["scripts/app/thing.ts"]);
    const result = go(repo, run, [], { SANDCASTLE_AFK_LAND_CODE: "1" });
    assert.equal(result.code, EXIT_OK, result.err);
    assert.ok(calls.includes("node scripts/git/pr-ready.ts"));
  });
  await t.test("any other value of the opt-in is not an opt-in", (t) => {
    const repo = fixture(t);
    const { run } = landingLoop(repo, ["scripts/app/thing.ts"]);
    assert.equal(go(repo, run, [], { SANDCASTLE_AFK_LAND_CODE: "yes" }).code, EXIT_REFUSED);
  });
});

await test("a refused run tells the issues, so an unattended owner is not left with silence", (t) => {
  const repo = fixture(t);
  const { run, calls } = landingLoop(repo, ["scripts/app/thing.ts"]);
  const result = go(repo, run);
  assert.equal(result.code, EXIT_REFUSED);
  const [only] = comments(calls);
  assert.match(only ?? "", /^gh issue comment 4 -R Zimfra\/software_testing --body /);
  assert.match(only ?? "", /not landed/);
  assert.ok(!calls.some((call) => call.includes("pr-ready")));
});

await test("a branch that already differs from origin/main in code is refused before the loop runs", (t) => {
  const repo = fixture(t);
  repo.write("scripts/app/owner-work.ts", "// the owner's own work\n");
  repo.commit("feat: owner work");
  const { run, calls } = runner(repo);
  const result = go(repo, run);
  assert.equal(result.code, EXIT_REFUSED);
  assert.ok(result.err.includes("scripts/app/owner-work.ts"));
  assert.ok(!calls.includes("node .sandcastle/main.ts"), "no paid loop is spent");
});

await test("a rerun after a refusal is refused before the loop, because the edit is already on the branch", (t) => {
  const repo = fixture(t);
  const first = landingLoop(repo, ["scripts/git/pr-ready.ts"]);
  assert.equal(go(repo, first.run).code, EXIT_REFUSED);
  const second = runner(repo);
  const result = go(repo, second.run);
  assert.equal(result.code, EXIT_REFUSED);
  assert.ok(result.err.includes("scripts/git/pr-ready.ts"));
  assert.ok(!second.calls.includes("node .sandcastle/main.ts"));
});

await test("moving a guarded file away is seen as a change to it", (t) => {
  const repo = fixture(t);
  repo.git(["switch", "--quiet", "main"]);
  repo.write("scripts/git/pr-ready.ts", "// the landing tool\n");
  repo.commit("feat: landing tool");
  repo.git(["push", "--quiet", "origin", "main"]);
  repo.git(["fetch", "--quiet", "origin"]);
  repo.git(["switch", "--quiet", "feat/afk-work"]);
  repo.git(["merge", "--quiet", "--no-edit", "origin/main"]);
  repo.git(["switch", "--quiet", "-c", "sandcastle/issue-4", "feat/afk-work"]);
  repo.git(["mv", "scripts/git/pr-ready.ts", "wiki-moved.md"]);
  repo.commit("feat: move it away");
  repo.git(["switch", "--quiet", "feat/afk-work"]);
  const { run, calls } = runner(repo, { loop: () => { mergeInto(repo, "feat/afk-work", "sandcastle/issue-4"); return 0; } });
  const result = go(repo, run);
  assert.equal(result.code, EXIT_REFUSED);
  assert.ok(result.err.includes("scripts/git/pr-ready.ts"));
  assert.ok(!calls.some((call) => call.includes("pr-ready")));
});

await test("a repository config the loop changed is an error, because tracked diffs cannot show it", (t) => {
  const repo = fixture(t);
  issueBranch(repo, "sandcastle/issue-4");
  const { run, calls } = runner(repo, {
    loop: () => {
      mergeInto(repo, "feat/afk-work", "sandcastle/issue-4");
      repo.git(["config", "core.hooksPath", "/tmp/evil-hooks"]);
      return 0;
    },
  });
  const result = go(repo, run);
  assert.equal(result.code, EXIT_ERROR);
  assert.match(result.err, /git config/);
  assert.ok(!calls.some((call) => call.includes("pr-ready") || call.startsWith("gh issue")));
});

await test("a branch with no history in common with origin/main is a named refusal before the loop", (t) => {
  const repo = fixture(t);
  repo.git(["switch", "--quiet", "--orphan", "unrelated"]);
  repo.write("x.md", "x\n");
  repo.commit("docs: unrelated");
  const { run, calls } = runner(repo);
  const result = go(repo, run);
  assert.equal(result.code, EXIT_REFUSED);
  assert.match(result.err, /no history in common with origin\/main/);
  assert.ok(!calls.includes("node .sandcastle/main.ts"));
});

await test("a stale origin/main tracking ref does not make a documentation-only branch look like code", (t) => {
  const repo = fixture(t);
  const older = repo.git(["rev-parse", "refs/remotes/origin/main"]);
  repo.git(["switch", "--quiet", "main"]);
  repo.write("scripts/app/others-work.ts", "// merged to main by someone else\n");
  repo.commit("feat: others work");
  repo.git(["push", "--quiet", "origin", "main"]);
  repo.git(["fetch", "--quiet", "origin"]);
  repo.git(["switch", "--quiet", "feat/afk-work"]);
  repo.git(["merge", "--quiet", "--no-edit", "origin/main"]);
  repo.git(["update-ref", "refs/remotes/origin/main", older]); // the tracking ref is now stale
  const result = go(repo, runner(repo).run);
  assert.equal(result.code, EXIT_OK, result.err);
});

await test("the code refusal is reported together with the other independent refusals", (t) => {
  const repo = fixture(t);
  repo.write("scripts/app/owner-work.ts", "// the owner's work\n");
  repo.commit("feat: owner work");
  repo.write("dirty.md", "x\n");
  const result = go(repo, runner(repo).run);
  assert.equal(result.code, EXIT_REFUSED);
  assert.match(result.err, /uncommitted/);
  assert.ok(result.err.includes("scripts/app/owner-work.ts"));
});

await test("a code refusal that coincides with stranded work is a failure, not only a refusal", (t) => {
  const repo = fixture(t);
  const { run } = landingLoop(repo, ["scripts/app/thing.ts"], {
    also: () => {
      repo.git(["switch", "--quiet", "-c", "sandcastle/issue-7", "feat/afk-work"]);
      repo.write("seven.md", "7\n");
      repo.commit("feat: seven");
      repo.git(["switch", "--quiet", "feat/afk-work"]);
    },
  });
  const result = go(repo, run);
  assert.equal(result.code, EXIT_ERROR);
  assert.match(result.err, /issue 7/);
});

await test("a notice comment that failed is reported and fails the run, so silence is never mistaken for success", (t) => {
  const repo = fixture(t);
  const { run } = landingLoop(repo, ["scripts/app/thing.ts"], { failComments: ["4"] });
  const result = go(repo, run);
  assert.equal(result.code, EXIT_ERROR);
  assert.match(result.err, /could not be told/);
  assert.match(result.err, /issue 4/);
});

await test("a multi-line config value cannot hide a change behind a branch.-prefixed tail", (t) => {
  const repo = fixture(t);
  repo.git(["config", "core.editor", "vim"]);
  issueBranch(repo, "sandcastle/issue-4");
  const { run } = runner(repo, {
    loop: () => {
      mergeInto(repo, "feat/afk-work", "sandcastle/issue-4");
      repo.git(["config", "core.editor", "vim\nbranch.x.note=hidden"]);
      return 0;
    },
  });
  const result = go(repo, run);
  assert.equal(result.code, EXIT_ERROR);
  assert.match(result.err, /git config/);
});

await test("branch tracking keys written when a branch is created from origin/main are not a config change", (t) => {
  const repo = fixture(t);
  issueBranch(repo, "sandcastle/issue-4");
  const { run } = runner(repo, {
    loop: () => {
      mergeInto(repo, "feat/afk-work", "sandcastle/issue-4");
      repo.git(["branch", "--track", "sandcastle/issue-9", "origin/main"]);
      return 0;
    },
  });
  assert.equal(go(repo, run).code, EXIT_OK);
});
