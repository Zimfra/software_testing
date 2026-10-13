import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test, type TestContext } from "node:test";
import type { Run } from "../git/pr-ready.ts";
import { EXIT_ERROR, EXIT_OK, EXIT_REFUSED, type Output } from "../lib/cli.ts";
import { cleanGitEnv, createRepo, type RepoFixture } from "../test-support/repo-fixture.ts";
import { main } from "./afk.ts";

const PR_URL = "https://github.com/Zimfra/software_testing/pull/21";

function fixture(t: TestContext): RepoFixture {
  const repo = createRepo("afk-");
  const remote = mkdtempSync(join(tmpdir(), "afk-remote-"));
  t.after(() => { repo.cleanup(); rmSync(remote, { recursive: true, force: true }); });
  execFileSync("git", ["init", "--quiet", "--bare", remote], { env: cleanGitEnv });
  repo.commit("base");
  repo.git(["remote", "add", "origin", remote]);
  repo.git(["push", "--quiet", "origin", "main"]);
  repo.git(["fetch", "--quiet", "origin"]);
  repo.git(["switch", "--quiet", "-c", "feat/afk-work"]);
  return repo;
}

// An issue branch with one commit, left unmerged; the caller merges it where it should land.
function issueBranch(repo: RepoFixture, name: string): void {
  const from = repo.git(["symbolic-ref", "--short", "HEAD"]);
  repo.git(["switch", "--quiet", "-c", name, from]);
  repo.write(`${name.replaceAll("/", "-")}.md`, "work\n");
  repo.commit(`feat: ${name}`);
  repo.git(["switch", "--quiet", from]);
}

function mergeInto(repo: RepoFixture, target: string, name: string): void {
  repo.git(["switch", "--quiet", target]);
  repo.git(["merge", "--quiet", "--no-ff", "-m", `Merge ${name}`, name]);
}

type Script = {
  loop?: () => number;
  pr?: { status: number; stdout: string };
  failComments?: string[];
};

// git runs for real; the Sandcastle loop, pr-ready, gh and npm are scripted and recorded.
function runner(repo: RepoFixture, script: Script = {}): { run: Run; calls: string[] } {
  const calls: string[] = [];
  const run: Run = (command, args) => {
    const line = `${command} ${args.join(" ")}`;
    calls.push(line);
    if (command === "git") {
      const result = spawnSync("git", args, { cwd: repo.dir, env: cleanGitEnv, encoding: "utf8" });
      return { status: result.status, stdout: result.stdout };
    }
    if (line === "node .sandcastle/main.ts") return { status: script.loop?.() ?? 0, stdout: "" };
    if (line === "node scripts/git/pr-ready.ts") return script.pr ?? { status: 0, stdout: `pr-ready: pull request ${PR_URL} is open.\n` };
    if (command === "gh" && args[0] === "issue" && args[1] === "comment") {
      return { status: script.failComments?.includes(args[2] ?? "") === true ? 1 : 0, stdout: "" };
    }
    throw new Error(`unexpected ${line}`);
  };
  return { run, calls };
}

function go(repo: RepoFixture, run: Run, args: string[] = []): { code: number; out: string; err: string } {
  const out: string[] = [];
  const err: string[] = [];
  const output: Output = { write: (line) => out.push(line), warn: (line) => err.push(line) };
  return { code: main(args, { cwd: repo.dir, output, run }), out: out.join("\n"), err: err.join("\n") };
}

const comments = (calls: string[]): string[] => calls.filter((call) => call.startsWith("gh issue comment"));
const sawAnything = (calls: string[]): boolean => calls.some((call) => !call.startsWith("git "));

await test("the issues this run merged are announced on a pull request and commented on, and nothing merges", (t) => {
  const repo = fixture(t);
  issueBranch(repo, "sandcastle/issue-12");
  issueBranch(repo, "sandcastle/issue-4");
  issueBranch(repo, "sandcastle/issue-7");
  issueBranch(repo, "sandcastle/issue-9");
  issueBranch(repo, "sandcastle/other");
  issueBranch(repo, "feature/issue-3");
  // issue 9 already reached main, so it is not this run's to announce
  mergeInto(repo, "main", "sandcastle/issue-9");
  repo.git(["push", "--quiet", "origin", "main"]);
  repo.git(["switch", "--quiet", "feat/afk-work"]);
  const { run, calls } = runner(repo, {
    loop: () => {
      mergeInto(repo, "feat/afk-work", "sandcastle/issue-12");
      mergeInto(repo, "feat/afk-work", "sandcastle/issue-4");
      mergeInto(repo, "feat/afk-work", "sandcastle/issue-9");
      mergeInto(repo, "feat/afk-work", "sandcastle/other");
      mergeInto(repo, "feat/afk-work", "feature/issue-3");
      return 0;
    },
  });
  const result = go(repo, run);
  assert.equal(result.code, EXIT_OK, result.err);
  assert.match(result.out, new RegExp(PR_URL));
  const nonGit = calls.filter((call) => !call.startsWith("git "));
  assert.deepEqual(nonGit.slice(0, 2), ["node .sandcastle/main.ts", "node scripts/git/pr-ready.ts"], "loop first, then the landing tool");
  assert.equal(comments(calls).length, 2, "one comment per merged issue branch, and no other");
  assert.equal(nonGit.length, 4);
  const [first, second] = comments(calls);
  assert.match(first ?? "", /^gh issue comment 4 -R Zimfra\/software_testing --body /);
  assert.match(second ?? "", /^gh issue comment 12 -R Zimfra\/software_testing --body /);
  assert.ok(first?.includes(PR_URL) && first.includes("waiting for the owner's review"));
  assert.ok(!calls.some((call) => /push|--no-verify|\.env|issue close|pr merge|pr review|--admin/.test(call.replace(PR_URL, ""))), "no push, no bypass, no .env, no close or merge");
});

await test("nothing merged by this run opens nothing and exits 0", (t) => {
  const repo = fixture(t);
  issueBranch(repo, "sandcastle/issue-5");
  const { run, calls } = runner(repo);
  const result = go(repo, run);
  assert.equal(result.code, EXIT_OK, result.err);
  assert.match(result.out, /no Sandcastle issue branch was merged/i);
  assert.deepEqual(calls.filter((call) => !call.startsWith("git ")), ["node .sandcastle/main.ts"]);
});

await test("a failing Sandcastle loop stops the run with exit 2", (t) => {
  const repo = fixture(t);
  const { run, calls } = runner(repo, { loop: () => 3 });
  const result = go(repo, run);
  assert.equal(result.code, EXIT_ERROR);
  assert.match(result.err, /Sandcastle loop failed/);
  assert.ok(!calls.some((call) => call.includes("pr-ready") || call.startsWith("gh ")));
});

await test("a refusal from the landing tool is propagated and names the step, and nothing is commented", (t) => {
  const repo = fixture(t);
  issueBranch(repo, "sandcastle/issue-4");
  const { run, calls } = runner(repo, {
    loop: () => { mergeInto(repo, "feat/afk-work", "sandcastle/issue-4"); return 0; },
    pr: { status: 1, stdout: "" },
  });
  const result = go(repo, run);
  assert.equal(result.code, EXIT_REFUSED);
  assert.match(result.err, /landing step/);
  assert.match(result.err, /nothing was pushed or commented/);
  assert.equal(comments(calls).length, 0);
});

await test("a landing tool that broke exits 2 and nothing is commented", (t) => {
  const repo = fixture(t);
  issueBranch(repo, "sandcastle/issue-4");
  const { run, calls } = runner(repo, {
    loop: () => { mergeInto(repo, "feat/afk-work", "sandcastle/issue-4"); return 0; },
    pr: { status: 2, stdout: "" },
  });
  assert.equal(go(repo, run).code, EXIT_ERROR);
  assert.equal(comments(calls).length, 0);
});

await test("a landing tool that prints no pull request URL is an error, not a silent success", (t) => {
  const repo = fixture(t);
  issueBranch(repo, "sandcastle/issue-4");
  const { run, calls } = runner(repo, {
    loop: () => { mergeInto(repo, "feat/afk-work", "sandcastle/issue-4"); return 0; },
    pr: { status: 0, stdout: "pr-ready: done\n" },
  });
  const result = go(repo, run);
  assert.equal(result.code, EXIT_ERROR);
  assert.match(result.err, /pull request URL/);
  assert.equal(comments(calls).length, 0);
});

await test("a comment that fails does not stop the others, and the run reports it", (t) => {
  const repo = fixture(t);
  issueBranch(repo, "sandcastle/issue-4");
  issueBranch(repo, "sandcastle/issue-12");
  const { run, calls } = runner(repo, {
    loop: () => {
      mergeInto(repo, "feat/afk-work", "sandcastle/issue-4");
      mergeInto(repo, "feat/afk-work", "sandcastle/issue-12");
      return 0;
    },
    failComments: ["4"],
  });
  const result = go(repo, run);
  assert.equal(result.code, EXIT_ERROR);
  assert.equal(comments(calls).length, 2);
  assert.match(result.err, /issue 4/);
  assert.match(result.err, new RegExp(PR_URL));
});

await test("refusals come before anything runs, and are reported together", async (t) => {
  await t.test("on main", (t) => {
    const repo = fixture(t);
    repo.git(["switch", "--quiet", "main"]);
    const { run, calls } = runner(repo);
    const result = go(repo, run);
    assert.equal(result.code, EXIT_REFUSED);
    assert.match(result.err, /feature branch/);
    assert.ok(!sawAnything(calls));
  });
  await t.test("detached HEAD", (t) => {
    const repo = fixture(t);
    repo.git(["switch", "--quiet", "--detach", "HEAD"]);
    const { run, calls } = runner(repo);
    assert.equal(go(repo, run).code, EXIT_REFUSED);
    assert.ok(!sawAnything(calls));
  });
  await t.test("uncommitted changes", (t) => {
    const repo = fixture(t);
    repo.write("dirty.md", "x\n");
    const { run, calls } = runner(repo);
    const result = go(repo, run);
    assert.equal(result.code, EXIT_REFUSED);
    assert.match(result.err, /uncommitted/);
    assert.ok(!sawAnything(calls));
  });
  await t.test("both at once", (t) => {
    const repo = fixture(t);
    repo.git(["switch", "--quiet", "main"]);
    repo.write("dirty.md", "x\n");
    const result = go(repo, runner(repo).run);
    assert.match(result.err, /feature branch/);
    assert.match(result.err, /uncommitted/);
  });
});

await test("arguments", (t) => {
  const repo = fixture(t);
  assert.equal(go(repo, runner(repo).run, ["--bogus"]).code, EXIT_ERROR);
  assert.match(go(repo, runner(repo).run, ["--help"]).out, /Usage/);
});
