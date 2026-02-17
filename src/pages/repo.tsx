import type { FC } from "hono/jsx";
import { Layout } from "./layout";
import type { GitHubRelease } from "../types";

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface RepoPageProps {
  owner: string;
  repo: string;
  releases: GitHubRelease[];
  page: number;
  hasMore: boolean;
}

export const RepoPage: FC<RepoPageProps> = ({ owner, repo, releases, page, hasMore }) => {
  return (
    <Layout title={`${owner}/${repo}`}>
      <div class="mb-4">
        <p class="text-muted text-sm mb-2">
          <a href="/">Home</a> / {owner} / {repo}
        </p>
        <h1>{owner}/{repo}</h1>
        <p class="text-muted">Releases</p>
      </div>

      {releases.length === 0 ? (
        <div class="card empty">
          <p>No releases found for this repository.</p>
          <p class="text-sm mt-2">
            If this is a private repository, make sure a token is configured via the Admin panel.
          </p>
        </div>
      ) : (
        releases.map((release) => (
          <div class="card">
            <div class="flex items-center justify-between">
              <div>
                <a href={`/${owner}/${repo}/${release.tag_name}`}>
                  <h2>{release.name || release.tag_name}</h2>
                </a>
                <div class="flex items-center gap-2 mt-2">
                  <span class={`tag ${release.prerelease ? "tag-pre" : ""}`}>
                    {release.tag_name}
                  </span>
                  {release.prerelease && <span class="tag tag-pre">pre-release</span>}
                  {release.draft && <span class="tag tag-pre">draft</span>}
                  <span class="text-muted text-sm">
                    {formatDate(release.published_at)}
                  </span>
                </div>
              </div>
              <div>
                <span class="badge">{release.assets.length} asset{release.assets.length !== 1 ? "s" : ""}</span>
              </div>
            </div>
            {release.assets.length > 0 && (
              <div class="mt-2 release-asset-divider">
                {release.assets.slice(0, 5).map((asset) => (
                  <div class="asset-row">
                    <span class="asset-name text-sm">
                      <a href={`/download/${owner}/${repo}/${release.tag_name}/${asset.name}`}>
                        {asset.name}
                      </a>
                    </span>
                    <span class="asset-size">{formatSize(asset.size)}</span>
                  </div>
                ))}
                {release.assets.length > 5 && (
                  <p class="text-sm text-muted mt-2">
                    <a href={`/${owner}/${repo}/${release.tag_name}`}>
                      +{release.assets.length - 5} more assets...
                    </a>
                  </p>
                )}
              </div>
            )}
          </div>
        ))
      )}

      <div class="flex justify-between mt-4">
        {page > 1 ? (
          <a href={`/${owner}/${repo}?page=${page - 1}`} class="btn btn-primary">
            &larr; Previous
          </a>
        ) : (
          <span />
        )}
        {hasMore ? (
          <a href={`/${owner}/${repo}?page=${page + 1}`} class="btn btn-primary">
            Next &rarr;
          </a>
        ) : (
          <span />
        )}
      </div>
    </Layout>
  );
};
