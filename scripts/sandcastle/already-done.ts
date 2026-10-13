import { isAncestor, refExists } from "../lib/git.ts";

export type PlannedIssue = { id: string; title: string; branch: string };

/**
 * The planned issues whose branch is not yet merged into the checked-out branch of `cwd`.
 * A branch that does not exist is not done. Only local branches count: the full ref name
 * keeps a tag or remote branch of the same name, or a name starting with `-`, from matching.
 */
export function pendingIssues(issues: readonly PlannedIssue[], cwd: string): PlannedIssue[] {
  return issues.filter((issue) => {
    const ref = `refs/heads/${issue.branch}`;
    return !(refExists(ref, { cwd }) && isAncestor(ref, "HEAD", { cwd }));
  });
}
