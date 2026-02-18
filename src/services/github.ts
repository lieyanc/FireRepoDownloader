import type { GitHubRelease, GitHubRepo } from "../types";

const GITHUB_API = "https://api.github.com";

interface GitHubRequestOptions {
  token?: string | null;
}

async function githubFetch(
  path: string,
  options: GitHubRequestOptions = {}
): Promise<Response> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "FireRepoDownloader/1.0",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (options.token) {
    headers["Authorization"] = `Bearer ${options.token}`;
  }
  return fetch(`${GITHUB_API}${path}`, { headers });
}

export async function getRepo(
  owner: string,
  repo: string,
  token?: string | null
): Promise<GitHubRepo> {
  const res = await githubFetch(`/repos/${owner}/${repo}`, { token });
  if (!res.ok) {
    throw new GitHubError(res.status, await res.text());
  }
  return res.json();
}

export async function listReleases(
  owner: string,
  repo: string,
  page = 1,
  perPage = 10,
  token?: string | null
): Promise<{ releases: GitHubRelease[]; hasMore: boolean }> {
  const res = await githubFetch(
    `/repos/${owner}/${repo}/releases?page=${page}&per_page=${perPage}`,
    { token }
  );
  if (!res.ok) {
    throw new GitHubError(res.status, await res.text());
  }
  const releases: GitHubRelease[] = await res.json();
  const linkHeader = res.headers.get("Link");
  const hasMore = linkHeader?.includes('rel="next"') ?? false;
  return { releases, hasMore };
}

export async function getRelease(
  owner: string,
  repo: string,
  tag: string,
  token?: string | null
): Promise<GitHubRelease> {
  const res = await githubFetch(
    `/repos/${owner}/${repo}/releases/tags/${tag}`,
    { token }
  );
  if (!res.ok) {
    throw new GitHubError(res.status, await res.text());
  }
  return res.json();
}

export async function getLatestRelease(
  owner: string,
  repo: string,
  token?: string | null
): Promise<GitHubRelease> {
  const res = await githubFetch(
    `/repos/${owner}/${repo}/releases/latest`,
    { token }
  );
  if (!res.ok) {
    throw new GitHubError(res.status, await res.text());
  }
  return res.json();
}

export async function getLatestPreRelease(
  owner: string,
  repo: string,
  token?: string | null
): Promise<GitHubRelease> {
  const { releases } = await listReleases(owner, repo, 1, 100, token);
  const preRelease = releases.find((r) => r.prerelease);
  if (!preRelease) {
    throw new GitHubError(404, "No pre-release found");
  }
  return preRelease;
}

export async function resolveRelease(
  owner: string,
  repo: string,
  tag: string,
  token?: string | null
): Promise<GitHubRelease> {
  switch (tag) {
    case "latest":
      return getLatestRelease(owner, repo, token);
    case "pre-release":
      return getLatestPreRelease(owner, repo, token);
    default:
      return getRelease(owner, repo, tag, token);
  }
}

export async function downloadAsset(
  assetUrl: string,
  token?: string | null
): Promise<Response> {
  const headers: Record<string, string> = {
    Accept: "application/octet-stream",
    "User-Agent": "FireRepoDownloader/1.0",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(assetUrl, { headers, redirect: "manual" });

  if (response.status === 302) {
    const redirectUrl = response.headers.get("Location");
    if (!redirectUrl) {
      throw new GitHubError(502, "GitHub returned 302 without Location header");
    }
    // Follow redirect WITHOUT Authorization header (S3 rejects it)
    return fetch(redirectUrl);
  }

  if (!response.ok) {
    throw new GitHubError(response.status, await response.text());
  }

  return response;
}

export class GitHubError extends Error {
  constructor(
    public status: number,
    public body: string
  ) {
    super(`GitHub API error ${status}: ${body}`);
  }

  get isRateLimited(): boolean {
    return this.status === 403 && this.body.includes("rate limit");
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }
}
