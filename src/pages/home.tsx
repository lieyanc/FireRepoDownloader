import type { FC } from "hono/jsx";
import { Layout } from "./layout";

export const HomePage: FC = () => {
  return (
    <Layout>
      <div style="text-align:center;padding:48px 0 32px">
        <h1 style="font-size:2.2rem;margin-bottom:8px">FireRepoDownloader</h1>
        <p class="text-muted" style="font-size:1.1rem;max-width:520px;margin:0 auto 32px">
          A GitHub Release download proxy. Browse releases and download assets
          from public and private repositories.
        </p>
        <form id="search-form" class="search-box">
          <input
            type="text"
            id="repo-input"
            placeholder="owner/repo (e.g. cloudflare/workers-sdk)"
          />
          <button type="submit" class="btn btn-primary">Browse</button>
        </form>
      </div>

      <div class="grid-2 mt-4">
        <div class="card">
          <h3 style="margin-bottom:8px">Download Proxy</h3>
          <p class="text-sm text-muted">
            Stream release assets directly through this worker. Supports both public and
            private repositories with configured access tokens.
          </p>
          <p class="text-sm mt-2">
            <code>/download/:owner/:repo/:tag/:asset</code>
          </p>
        </div>
        <div class="card">
          <h3 style="margin-bottom:8px">Release API</h3>
          <p class="text-sm text-muted">
            Query release information via JSON API. Supports pagination and per-tag lookup.
          </p>
          <p class="text-sm mt-2">
            <code>/api/releases/:owner/:repo</code>
          </p>
        </div>
      </div>

      <script>{`
        document.getElementById('search-form').addEventListener('submit', function(e) {
          e.preventDefault();
          var val = document.getElementById('repo-input').value.trim();
          if (!val) return;
          var parts = val.replace(/^https?:\\/\\/github\\.com\\//, '').split('/');
          if (parts.length >= 2) {
            window.location.href = '/' + parts[0] + '/' + parts[1];
          }
        });
      `}</script>
    </Layout>
  );
};
