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

interface ReleasePageProps {
  owner: string;
  repo: string;
  release: GitHubRelease;
}

export const ReleasePage: FC<ReleasePageProps> = ({ owner, repo, release }) => {
  return (
    <Layout title={`${release.tag_name} - ${owner}/${repo}`}>
      <div class="mb-4">
        <p class="text-muted text-sm mb-2">
          <a href="/">Home</a> / <a href={`/${owner}/${repo}`}>{owner}/{repo}</a> / {release.tag_name}
        </p>
        <div class="flex items-center gap-2">
          <h1>{release.name || release.tag_name}</h1>
          {release.prerelease && <span class="tag tag-pre">pre-release</span>}
          {release.draft && <span class="tag tag-pre">draft</span>}
        </div>
        <p class="text-muted text-sm mt-2">
          Published {formatDate(release.published_at)}
        </p>
      </div>

      {release.body && (
        <div class="card mb-4">
          <h3 class="mb-2">Release Notes</h3>
          <div class="markdown-body">
            <pre style="white-space:pre-wrap">{release.body}</pre>
          </div>
        </div>
      )}

      <div class="card">
        <h3 class="mb-2">
          Assets
          <span class="badge">{release.assets.length}</span>
        </h3>
        {release.assets.length === 0 ? (
          <p class="text-muted">No assets attached to this release.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>File</th>
                <th>Size</th>
                <th>Type</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {release.assets.map((asset) => (
                <tr>
                  <td>
                    <span class="asset-name">{asset.name}</span>
                  </td>
                  <td class="text-muted text-sm">{formatSize(asset.size)}</td>
                  <td class="text-muted text-sm">{asset.content_type}</td>
                  <td style="text-align:right">
                    <a
                      href={`/download/${owner}/${repo}/${release.tag_name}/${asset.name}`}
                      class="btn btn-primary btn-sm"
                    >
                      Download
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div class="mt-4">
        <a href={`/${owner}/${repo}`} class="btn btn-primary">
          &larr; All Releases
        </a>
      </div>
    </Layout>
  );
};
