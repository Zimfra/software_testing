import { isAncestor, refExists, tryGit } from "../lib/git.ts";

export type PlannedIssue = { id: string; title: string; branch: string };

// Sandcastle creates the branch at HEAD before the implementer runs, so a branch that never got
// a commit is an ancestor of HEAD too. Only the branch's own reflog tells the two apart: it holds
// the creation entry, plus one entry per commit made on the branch. A reset, rename, fetch or
// fast-forward merge also writes an entry, so only entries that create a commit count (a
// conflict resolved with `git commit` logs `commit (merge)`, which counts, as does
// `commit (amend)`; a conflict-free merge of another branch logs `merge ...` and does not).
//
// "worked" needs one such entry whose commit is still reachable from the tip, and nothing else
// makes a branch worked. A commit reachable from the tip is the branch's own work that is part of
// its history, so no reset or rebase order can make discarded work count as done. The price is
// that a rebased branch (its commits are rewritten) is not recognised: it stays pending and is
// planned again, which costs a round and loses nothing, and the prompts forbid rebasing.
export type BranchWork = "worked" | "empty" | "unrecognised";

// A reflog entry can name a commit that was pruned; that is "not reachable", never a failure.
function reachable(sha: string, ref: string, cwd: string): boolean {
  try {
    return isAncestor(sha, ref, { cwd });
  } catch {
    return false;
  }
}

// Subjects of reflog entries that move a branch tip without making work of the branch's own.
const TIP_MOVES = /^(rebase \(finish\)|merge |branch: Reset|Branch: renamed|reset:)/;
const COMMIT_ENTRY = /^(commit|cherry-pick|revert)(?=[ :(]|$)/;

/**
 * "worked": a commit entry's commit is still reachable from the tip. "empty": the branch is
 * missing, its tip is still where it was created, or its tip is held by HEAD and nothing but
 * resets, renames and other tip moves (or commits that were reset away) explain it.
 * "unrecognised": anything else, including every tip that HEAD does not hold, so a caller that
 * must not lose work (aheadIssues) or must not stay silent (the AFK wrapper) can see it.
 */
export function branchWork(ref: string, cwd: string): BranchWork {
  if (!refExists(ref, { cwd })) return "empty";
  const log = tryGit(["reflog", "show", "--format=%H %gs", ref, "--"], { cwd });
  const entries = (log ?? "").split("\n").filter((line) => line !== "").map((line) => {
    const space = line.indexOf(" ");
    return { sha: line.slice(0, space), subject: line.slice(space + 1) };
  });
  const created = entries.find((entry) => entry.subject.startsWith("branch: Created"));
  if (created !== undefined && created.sha === entries[0]?.sha) return "empty";
  const commits = entries.filter((entry) => COMMIT_ENTRY.test(entry.subject));
  if (commits.some((entry) => reachable(entry.sha, ref, cwd))) return "worked";
  if (!isAncestor(ref, "HEAD", { cwd })) return "unrecognised";
  if (commits.length > 0) return "empty";
  const others = entries.filter((entry) => entry !== created);
  return others.length > 0 && others.every((entry) => TIP_MOVES.test(entry.subject)) ? "empty" : "unrecognised";
}

export const hasOwnCommits = (ref: string, cwd: string): boolean => branchWork(ref, cwd) === "worked";

/**
 * The planned issues whose branch is not yet merged into the checked-out branch of `cwd`.
 * A branch that does not exist, or that never received a commit, is not done: an issue is
 * dropped only when it was worked on and the work is in HEAD. Only local branches count: the
 * full ref name keeps a tag or remote branch of the same name, or a name starting with `-`, from matching.
 */
export function pendingIssues(issues: readonly PlannedIssue[], cwd: string): PlannedIssue[] {
  return issues.filter((issue) => {
    const ref = `refs/heads/${issue.branch}`;
    return !(refExists(ref, { cwd }) && isAncestor(ref, "HEAD", { cwd }) && hasOwnCommits(ref, cwd));
  });
}

/**
 * The planned issues whose branch holds commits that HEAD does not contain yet (worked, or a tip
 * written by update-ref or fetch), such as work left over from a round whose review failed. The merger must receive these even when
 * the implementer adds nothing new in the round.
 */
export function aheadIssues(issues: readonly PlannedIssue[], cwd: string): PlannedIssue[] {
  return issues.filter((issue) => {
    const ref = `refs/heads/${issue.branch}`;
    return refExists(ref, { cwd }) && !isAncestor(ref, "HEAD", { cwd }) && branchWork(ref, cwd) !== "empty";
  });
}
