import type { GitHubRelease, RepoStatsSummary } from "@/types";

export interface ReleaseListResponse {
  releases: GitHubRelease[];
  page: number;
  per_page: number;
  has_more: boolean;
}

export interface ConfiguredRepo {
  repo: string;
  created_at: string;
  updated_at: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const text = await response.text();
  let data: unknown = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }
  }

  if (!response.ok) {
    const message =
      typeof data === "object" && data && "error" in data && typeof data.error === "string"
        ? data.error
        : `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status);
  }

  return data as T;
}

function segment(value: string): string {
  return encodeURIComponent(value);
}

export function getReleases(owner: string, repo: string, page: number, signal?: AbortSignal) {
  return fetchJson<ReleaseListResponse>(
    `/api/releases/${segment(owner)}/${segment(repo)}?page=${page}&per_page=10`,
    { signal },
  );
}

export function getRelease(owner: string, repo: string, tag: string, signal?: AbortSignal) {
  return fetchJson<GitHubRelease>(
    `/api/releases/${segment(owner)}/${segment(repo)}/${segment(tag)}`,
    { signal },
  );
}

function adminHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export function verifyAdmin(token: string, signal?: AbortSignal) {
  return fetchJson<{ ok: true }>("/admin/api/auth", {
    headers: adminHeaders(token),
    signal,
  });
}

export function getConfiguredRepos(token: string, signal?: AbortSignal) {
  return fetchJson<ConfiguredRepo[]>("/admin/api/repos", {
    headers: adminHeaders(token),
    signal,
  });
}

export function getStats(token: string, signal?: AbortSignal) {
  return fetchJson<RepoStatsSummary[]>("/admin/api/stats", {
    headers: adminHeaders(token),
    signal,
  });
}

export function saveRepoToken(token: string, owner: string, repo: string, githubToken: string) {
  return fetchJson<{ ok: true; repo: string }>(
    `/admin/api/repos/${segment(owner)}/${segment(repo)}/token`,
    {
      method: "PUT",
      headers: adminHeaders(token),
      body: JSON.stringify({ token: githubToken }),
    },
  );
}

export function removeRepoToken(token: string, owner: string, repo: string) {
  return fetchJson<{ ok: true; repo: string }>(
    `/admin/api/repos/${segment(owner)}/${segment(repo)}/token`,
    {
      method: "DELETE",
      headers: adminHeaders(token),
    },
  );
}

export function repoPath(owner: string, repo: string): string {
  return `/${segment(owner)}/${segment(repo)}`;
}

export function releasePath(owner: string, repo: string, tag: string): string {
  return `${repoPath(owner, repo)}/${segment(tag)}`;
}

export function downloadPath(owner: string, repo: string, tag: string, asset: string): string {
  return `/download/${segment(owner)}/${segment(repo)}/${segment(tag)}/${segment(asset)}`;
}
