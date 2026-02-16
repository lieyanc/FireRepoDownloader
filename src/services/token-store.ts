import type { RepoTokenMetadata } from "../types";

function repoKey(owner: string, repo: string): string {
  return `repo:${owner.toLowerCase()}/${repo.toLowerCase()}`;
}

export async function getToken(
  kv: KVNamespace,
  owner: string,
  repo: string
): Promise<string | null> {
  return kv.get(repoKey(owner, repo));
}

export async function setToken(
  kv: KVNamespace,
  owner: string,
  repo: string,
  token: string
): Promise<void> {
  const key = repoKey(owner, repo);
  const existing = await kv.getWithMetadata<RepoTokenMetadata>(key);
  const now = new Date().toISOString();
  const metadata: RepoTokenMetadata = {
    owner: owner.toLowerCase(),
    repo: repo.toLowerCase(),
    created_at: existing.metadata?.created_at ?? now,
    updated_at: now,
  };
  await kv.put(key, token, { metadata });
}

export async function deleteToken(
  kv: KVNamespace,
  owner: string,
  repo: string
): Promise<void> {
  await kv.delete(repoKey(owner, repo));
}

export async function listRepos(
  kv: KVNamespace
): Promise<{ key: string; metadata: RepoTokenMetadata }[]> {
  const results: { key: string; metadata: RepoTokenMetadata }[] = [];
  let cursor: string | undefined;

  do {
    const list = await kv.list<RepoTokenMetadata>({
      prefix: "repo:",
      cursor,
    });
    for (const key of list.keys) {
      if (key.metadata) {
        results.push({ key: key.name, metadata: key.metadata });
      }
    }
    cursor = list.list_complete ? undefined : list.cursor;
  } while (cursor);

  return results;
}
