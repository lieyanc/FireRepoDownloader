import type { DownloadStat, RepoStatsSummary } from "../types";

function statKey(owner: string, repo: string, tag: string, asset: string): string {
  return `stats:${owner.toLowerCase()}/${repo.toLowerCase()}/${tag}/${asset}`;
}

export async function incrementDownloadCount(
  kv: KVNamespace,
  owner: string,
  repo: string,
  tag: string,
  asset: string
): Promise<void> {
  const key = statKey(owner, repo, tag, asset);
  const existing = await kv.get<DownloadStat>(key, "json");
  const stat: DownloadStat = {
    count: (existing?.count ?? 0) + 1,
    last_downloaded_at: new Date().toISOString(),
  };
  await kv.put(key, JSON.stringify(stat));
}

export async function getAllStats(
  kv: KVNamespace
): Promise<RepoStatsSummary[]> {
  const repoMap = new Map<string, RepoStatsSummary>();
  let cursor: string | undefined;

  do {
    const list = await kv.list({ prefix: "stats:", cursor });
    for (const key of list.keys) {
      // key format: stats:{owner}/{repo}/{tag}/{asset}
      const parts = key.name.slice("stats:".length).split("/");
      if (parts.length < 4) continue;

      const owner = parts[0];
      const repo = parts[1];
      const tag = parts[2];
      const asset = parts.slice(3).join("/");
      const repoKey = `${owner}/${repo}`;

      const stat = await kv.get<DownloadStat>(key.name, "json");
      if (!stat) continue;

      let summary = repoMap.get(repoKey);
      if (!summary) {
        summary = { repo: repoKey, total_downloads: 0, assets: [] };
        repoMap.set(repoKey, summary);
      }
      summary.total_downloads += stat.count;
      summary.assets.push({
        tag,
        asset,
        count: stat.count,
        last_downloaded_at: stat.last_downloaded_at,
      });
    }
    cursor = list.list_complete ? undefined : list.cursor;
  } while (cursor);

  return Array.from(repoMap.values());
}
