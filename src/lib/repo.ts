export interface RepoRef {
  owner: string;
  repo: string;
}

const segmentPattern = /^[\w.-]+$/;

/**
 * Accepts `owner/repo`, a full GitHub URL, or anything in between and
 * normalises it to a repository reference. Returns null when unusable.
 */
export function parseRepository(value: string): RepoRef | null {
  const normalized = value
    .trim()
    .replace(/^https?:\/\/(?:www\.)?github\.com\//i, "")
    .replace(/\.git$/i, "")
    .replace(/^\/+|\/+$/g, "");
  const [owner, repo, ...rest] = normalized.split("/");

  if (!owner || !repo || rest.length > 0) return null;
  if (!segmentPattern.test(owner) || !segmentPattern.test(repo)) return null;

  return { owner, repo };
}

export function formatRepo({ owner, repo }: RepoRef): string {
  return `${owner}/${repo}`;
}
