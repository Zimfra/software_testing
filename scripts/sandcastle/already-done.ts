import { gitLines, isAncestor, refExists } from "../lib/git.ts";

export type PlannedIssue = { id: string; title: string; branch: string };

// Sandcastle creates the branch at HEAD before the implementer runs, so a branch that never got
// a commit is an ancestor of HEAD too. Only the branch's own reflog tells the two apart: it holds
// the creation entry, plus one entry per commit made on the branch. A reset, rename or fetch also
// writes an entry, so only commit-type entries count. A worked branch that the merger merged
// before its issue was finished is dropped too: the signal cannot tell partial from complete work.
export function hasOwnCommits(ref: string, cwd: string): boolean {
  return gitLines(["reflog", "show", "--format=%gs", ref, "--"], { cwd }).some((entry) => /^(commit|merge|cherry-pick|revert)\b/.test(entry));
}

/**
 * The planned issues whose branch is not yet merged into the checked-out branch of `cwd`.
 * A branch that does not exist, or that never received a commit, is not done: an issue is
 * dropped only when it was worked on and the work is in HEAD. A branch whose reflog is gone
 * stays pending, which costs a re-plan and never loses an issue. Only local branches count: the
 * full ref name keeps a tag or remote branch of the same name, or a name starting with `-`, from matching.
 */
export function pendingIssues(issues: readonly PlannedIssue[], cwd: string): PlannedIssue[] {
  return issues.filter((issue) => {
    const ref = `refs/heads/${issue.branch}`;
    return !(refExists(ref, { cwd }) && isAncestor(ref, "HEAD", { cwd }) && hasOwnCommits(ref, cwd));
  });
}
