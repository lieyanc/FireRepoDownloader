import type { RepoRef } from "@/lib/repo";

const storageKey = "fire_recent_repos";
const limit = 6;

function read(): RepoRef[] {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (entry): entry is RepoRef =>
          typeof entry === "object" &&
          entry !== null &&
          typeof (entry as RepoRef).owner === "string" &&
          typeof (entry as RepoRef).repo === "string",
      )
      .slice(0, limit);
  } catch {
    return [];
  }
}

function write(entries: RepoRef[]): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(entries.slice(0, limit)));
  } catch {
    // Storage is unavailable (private mode, quota). Recents are optional.
  }
}

export function getRecentRepos(): RepoRef[] {
  return read();
}

export function rememberRepo(owner: string, repo: string): void {
  const rest = read().filter(
    (entry) => entry.owner.toLowerCase() !== owner.toLowerCase() || entry.repo.toLowerCase() !== repo.toLowerCase(),
  );
  write([{ owner, repo }, ...rest]);
}

export function forgetRepo(owner: string, repo: string): RepoRef[] {
  const next = read().filter((entry) => entry.owner !== owner || entry.repo !== repo);
  write(next);
  return next;
}
