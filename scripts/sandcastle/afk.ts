// npm run sandcastle:afk: run the Sandcastle loop, then hand its work to the owner and walk away.
//
// `npm run sandcastle` only merges issue branches into the checked-out branch: nothing is pushed,
// no pull request is opened and nobody is told. This wrapper adds those steps without adding any
// authority. Landing is the repository's own tool (scripts/git/pr-ready.ts, what `npm run pr`
// runs), so the checks, the refusal of an owner login and the push of the branch stay where they
// are. Notification is GitHub only: the pull request's review request to the code owner and a
// comment on each issue. It never pushes main, never merges or approves, never closes an issue,
// never skips a hook and does not read .sandcastle/.env itself (the loop it starts does).
import { EXIT_ERROR, EXIT_OK, EXIT_REFUSED, consoleOutput, isEntryPoint, runCli, type Output } from "../lib/cli.ts";
import { spawnRunner, type Run } from "../git/pr-ready.ts";
import { branchWork, type BranchWork } from "./already-done.ts";

export type Options = { cwd?: string; output?: Output; run?: Run };

// The repository the Sandcastle prompts read issues from and comment on (.sandcastle/*.md).
const PROMPT_REPO = "Zimfra/software_testing";
const ISSUE_BRANCH = /^refs\/heads\/sandcastle\/issue-([1-9]\d*)$/;

const USAGE = `Usage: node scripts/sandcastle/afk.ts
Runs the Sandcastle loop on the current feature branch, then opens a pull request for the issue
branches it merged (npm run pr's tool) and comments on each issue. Never merges or closes anything.
Exit: 0 done or nothing to land, 1 refused, 2 a step failed.`;

function git(run: Run, args: readonly string[]): string {
  const result = run("git", args);
  if (result.status !== 0) throw new Error(`git ${args.join(" ")} failed (exit ${String(result.status)})`);
  return result.stdout;
}

/** The current branch (empty on a detached HEAD), the repository gh reports, and every reason not to run the loop. */
function readiness(run: Run): { branch: string; repo: string; refused: string[] } {
  const head = run("git", ["symbolic-ref", "--quiet", "--short", "HEAD"]);
  const branch = head.status === 0 ? head.stdout.trim() : "";
  const refused: string[] = [];
  if (branch === "" || branch === "main") refused.push("Run this on a feature branch, not main or a detached HEAD.");
  if (git(run, ["status", "--porcelain"]).trim() !== "") refused.push("The tree has uncommitted changes. Commit or stash them first.");
  // One cheap call before the loop spends minutes: it fails when gh is not logged in or cannot
  // see the repository. The owner-login refusal stays with pr-ready.ts, after the loop.
  const view = run("gh", ["repo", "view", "--json", "nameWithOwner", "--jq", ".nameWithOwner"]);
  const repo = view.stdout.trim();
  if (view.status !== 0 || repo === "") refused.push("gh cannot resolve this repository. Run gh auth login (as the machine account), then rerun.");
  else if (repo !== PROMPT_REPO) refused.push(`gh resolves ${repo}, but the Sandcastle prompts read and comment on issues of ${PROMPT_REPO}.`);
  return { branch, repo, refused };
}

const branchesMerged = (run: Run, flag: string, ref: string): string[] =>
  git(run, ["for-each-ref", "--format=%(refname)", flag, ref, "refs/heads/sandcastle/"]).split("\n").filter((name) => name !== "");

/** Refs of sandcastle/issue-<N> branches merged into HEAD but not into origin/main, with whether each holds a commit of its own. */
function mergedBranches(run: Run, cwd: string | undefined): { ref: string; work: BranchWork }[] {
  git(run, ["fetch", "--quiet", "origin", "main"]);
  const onMain = new Set(branchesMerged(run, "--merged", "refs/remotes/origin/main"));
  return branchesMerged(run, "--merged", "HEAD")
    .filter((name) => !onMain.has(name) && ISSUE_BRANCH.test(name))
    .map((ref) => ({ ref, work: branchWork(ref, cwd ?? process.cwd()) }));
}

const issueNumber = (ref: string): string => ISSUE_BRANCH.exec(ref)?.[1] ?? ref;
const byNumber = (a: string, b: string): number => Number(a) - Number(b);

// A gh call that times out throws (spawnRunner); it counts as a failed comment, not a crash.
function comment(run: Run, repo: string, issue: string, url: string): boolean {
  const body = `Sandcastle merged a branch for this issue into the branch of ${url}, which is waiting for the owner's review. The work may be incomplete: read the pull request before merging it. This issue stays open until the owner merges that pull request.`;
  try {
    return run("gh", ["issue", "comment", issue, "-R", repo, "--body", body]).status === 0;
  } catch {
    return false;
  }
}

/** True when origin already holds HEAD under this branch's name (pr-ready pushed it). */
function isPushed(run: Run, branch: string): boolean {
  return run("git", ["merge-base", "--is-ancestor", "HEAD", `refs/remotes/origin/${branch}`]).status === 0;
}

type Landing = { repo: string; branch: string; issues: string[] };

/** Steps 2 and 3: open the pull request through pr-ready.ts, then comment on each issue. */
function land(run: Run, output: Output, { repo, branch, issues }: Landing): number {
  output.write(`afk: step 2 of 3, landing issue(s) ${issues.join(", ")} with scripts/git/pr-ready.ts (checks, push, pull request).`);
  const landing = run("node", ["scripts/git/pr-ready.ts"], { inherit: true });
  if (landing.status !== 0) {
    if (landing.status === 1) {
      output.warn("afk: the landing step refused (exit 1, reason above). The work stays merged on this branch; nothing was pushed or commented.");
      return EXIT_REFUSED;
    }
    output.warn(`afk: the landing step failed (exit ${String(landing.status)}, reason above). A push may already have happened: check origin before rerunning. Nothing was commented, and the work stays merged on this branch.`);
    return EXIT_ERROR;
  }
  let url = "";
  try {
    const view = run("gh", ["pr", "view", branch, "--json", "url", "--jq", ".url"]);
    url = view.status === 0 ? view.stdout.trim() : "";
  } catch {
    url = "";
  }
  if (!/^https:\/\/\S+\/pull\/\d+$/.test(url)) {
    output.warn("afk: the landing step succeeded but gh reports no pull request URL for this branch, so no issue was commented. Find the pull request on GitHub.");
    return EXIT_ERROR;
  }

  output.write(`afk: step 3 of 3, commenting on issue(s) ${issues.join(", ")}.`);
  const failed = issues.filter((issue) => !comment(run, repo, issue, url));
  if (failed.length > 0) {
    output.warn(`afk: the pull request ${url} is open, but the comment on issue ${failed.join(", ")} failed.`);
    return EXIT_ERROR;
  }
  output.write(`afk: done. ${url} is waiting for the owner's review; this tool never merges.`);
  return EXIT_OK;
}

export function main(args: readonly string[], options: Options = {}): number {
  const output = options.output ?? consoleOutput;
  if (args[0] === "--help") {
    output.write(USAGE);
    return EXIT_OK;
  }
  if (args.length > 0) {
    output.warn("afk: pass no arguments. See --help.");
    return EXIT_ERROR;
  }
  const run = options.run ?? defaultRunner(options.cwd);
  const { branch, repo, refused } = readiness(run);
  for (const reason of refused) output.warn(`afk: ${reason}`);
  if (refused.length > 0) return EXIT_REFUSED;
  const before = new Set(mergedBranches(run, options.cwd).map((entry) => entry.ref));
  const headBefore = git(run, ["rev-parse", "HEAD"]).trim();

  output.write("afk: step 1 of 3, running the Sandcastle loop (node .sandcastle/main.ts).");
  if (run("node", [".sandcastle/main.ts"], { inherit: true }).status !== 0) {
    output.warn("afk: the Sandcastle loop failed (output above). Nothing was pushed or commented, but the loop may already have merged issues into this branch.");
    return EXIT_ERROR;
  }
  // The merger is an agent with a shell on this checkout: the pull request must be the one for
  // the branch the run started on, and a moved HEAD must not end as a silent "nothing to land".
  if (run("git", ["symbolic-ref", "--quiet", "--short", "HEAD"]).stdout.trim() !== branch) {
    output.warn(`afk: HEAD is no longer on ${branch} after the loop. Nothing was pushed or commented; check the checkout.`);
    return EXIT_ERROR;
  }
  const merged = mergedBranches(run, options.cwd);
  const fresh = merged.filter((entry) => !before.has(entry.ref));
  const issues = fresh.filter((entry) => entry.work === "worked").map((entry) => issueNumber(entry.ref)).sort(byNumber);
  const unannounced = fresh.filter((entry) => entry.work === "unrecognised").map((entry) => issueNumber(entry.ref)).sort(byNumber);
  const earlier = merged.filter((entry) => before.has(entry.ref)).map((entry) => issueNumber(entry.ref)).sort(byNumber);
  if (earlier.length > 0) {
    output.warn(`afk: issue ${earlier.join(", ")} was merged on this branch by an earlier run and is not commented on by this run; the pull request carries its work.`);
  }
  if (unannounced.length > 0) {
    output.warn(`afk: issue ${unannounced.join(", ")} was merged by this run but its branch has no commit entry in its reflog, so it is not commented on; the pull request still carries its work.`);
  }
  if (issues.length === 0) return nothingToAnnounce(run, output, { branch, headBefore, earlier, unannounced });

  const code = land(run, output, { repo, branch, issues });
  return code === EXIT_OK && unannounced.length > 0 ? EXIT_ERROR : code;
}

type Quiet = { branch: string; headBefore: string; earlier: string[]; unannounced: string[] };

/** Nothing was announceable: decide whether that is a quiet success or work left unlanded. */
function nothingToAnnounce(run: Run, output: Output, state: Quiet): number {
  const moved = git(run, ["rev-parse", "HEAD"]).trim() !== state.headBefore;
  if (state.unannounced.length > 0 || moved) {
    output.warn("afk: HEAD moved during the loop but no issue branch with commits was merged, so nothing was announced. Check the branch before landing it by hand.");
    return EXIT_ERROR;
  }
  if (state.earlier.length > 0 && !isPushed(run, state.branch)) {
    output.warn("afk: work merged by an earlier run is on this branch and not pushed, and this run found nothing new. Land it with npm run pr.");
    return EXIT_ERROR;
  }
  if (state.earlier.length > 0) {
    output.write("afk: nothing new to announce; the work an earlier run merged is already pushed.");
    return EXIT_OK;
  }
  output.write("afk: no Sandcastle issue branch was merged into this branch by this run; nothing to land.");
  return EXIT_OK;
}

// The loop and the landing tool run for minutes and are not given a timeout; git and gh are.
function defaultRunner(cwd: string | undefined): Run {
  const quick = spawnRunner(cwd);
  const long = spawnRunner(cwd, 0);
  return (command, args, options) => (command === "node" ? long : quick)(command, args, options);
}

if (isEntryPoint(import.meta.url)) await runCli(() => main(process.argv.slice(2)));
