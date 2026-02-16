import type { FC } from "hono/jsx";
import { raw } from "hono/utils/html";
import { Layout } from "./layout";

export const AdminPage: FC = () => {
  return (
    <Layout title="Admin">
      <h1 class="mb-4">Admin Panel</h1>

      <div id="login-section" class="card">
        <h3 class="mb-2">Authentication</h3>
        <div class="flex gap-2">
          <input type="password" id="admin-token" placeholder="Enter admin token" />
          <button class="btn btn-primary" id="login-btn">Login</button>
        </div>
        <p id="login-status" class="text-sm text-muted mt-2"></p>
      </div>

      <div id="admin-content" style="display:none">
        <div class="grid-2 mb-4">
          <div class="card">
            <h3 class="mb-2">Add Repository Token</h3>
            <div class="flex flex-col gap-2">
              <input type="text" id="repo-name" placeholder="owner/repo" class="mb-2" />
              <input type="password" id="github-token" placeholder="GitHub Access Token" class="mb-2" />
              <button class="btn btn-primary" id="add-token-btn">Save Token</button>
              <p id="add-status" class="text-sm mt-2"></p>
            </div>
          </div>
          <div class="card">
            <h3 class="mb-2">Info</h3>
            <p class="text-sm text-muted">
              Configure GitHub Personal Access Tokens for private repositories.
              The token will be validated against the GitHub API before saving.
              Tokens are stored in Cloudflare KV and used to authenticate
              download proxy requests.
            </p>
          </div>
        </div>

        <div class="card mb-4">
          <h3 class="mb-2">Configured Repositories</h3>
          <div id="repos-list">
            <p class="text-muted text-sm">Loading...</p>
          </div>
        </div>

        <div class="card">
          <h3 class="mb-2">Download Statistics</h3>
          <div id="stats-content">
            <p class="text-muted text-sm">Loading...</p>
          </div>
        </div>
      </div>

      <script>{raw(`
(function() {
  var tokenKey = 'fire_admin_token';
  var token = sessionStorage.getItem(tokenKey) || '';
  var loginSection = document.getElementById('login-section');
  var adminContent = document.getElementById('admin-content');
  var loginStatus = document.getElementById('login-status');
  var adminToken = document.getElementById('admin-token');

  function apiHeaders() {
    return { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' };
  }

  function showAdmin() {
    loginSection.style.display = 'none';
    adminContent.style.display = 'block';
    loadRepos();
    loadStats();
  }

  function tryLogin() {
    token = adminToken.value.trim();
    if (!token) return;
    fetch('/admin/api/repos', { headers: apiHeaders() })
      .then(function(r) {
        if (r.ok) {
          sessionStorage.setItem(tokenKey, token);
          showAdmin();
        } else {
          loginStatus.textContent = 'Invalid token';
          loginStatus.style.color = '#cf222e';
        }
      })
      .catch(function() { loginStatus.textContent = 'Connection error'; });
  }

  document.getElementById('login-btn').addEventListener('click', tryLogin);
  adminToken.addEventListener('keydown', function(e) { if (e.key === 'Enter') tryLogin(); });

  if (token) {
    showAdmin();
  }

  function loadRepos() {
    fetch('/admin/api/repos', { headers: apiHeaders() })
      .then(function(r) { return r.json(); })
      .then(function(repos) {
        var container = document.getElementById('repos-list');
        if (!repos.length) {
          container.innerHTML = '<p class="text-muted text-sm">No repositories configured.</p>';
          return;
        }
        var html = '<table><thead><tr><th>Repository</th><th>Added</th><th>Updated</th><th></th></tr></thead><tbody>';
        repos.forEach(function(r) {
          html += '<tr><td><strong>' + escHtml(r.repo) + '</strong></td>'
            + '<td class="text-sm text-muted">' + new Date(r.created_at).toLocaleDateString() + '</td>'
            + '<td class="text-sm text-muted">' + new Date(r.updated_at).toLocaleDateString() + '</td>'
            + '<td style="text-align:right"><button class="btn btn-danger btn-sm" onclick="deleteRepo(\\'' + escHtml(r.repo) + '\\')">Delete</button></td></tr>';
        });
        html += '</tbody></table>';
        container.innerHTML = html;
      });
  }

  function loadStats() {
    fetch('/admin/api/stats', { headers: apiHeaders() })
      .then(function(r) { return r.json(); })
      .then(function(stats) {
        var container = document.getElementById('stats-content');
        if (!stats.length) {
          container.innerHTML = '<p class="text-muted text-sm">No download statistics yet.</p>';
          return;
        }
        var html = '<table><thead><tr><th>Repository</th><th>Total Downloads</th><th>Top Asset</th></tr></thead><tbody>';
        stats.forEach(function(s) {
          var topAsset = s.assets.sort(function(a,b) { return b.count - a.count; })[0];
          html += '<tr><td><strong>' + escHtml(s.repo) + '</strong></td>'
            + '<td>' + s.total_downloads + '</td>'
            + '<td class="text-sm text-muted">' + (topAsset ? escHtml(topAsset.asset) + ' (' + topAsset.count + ')' : '-') + '</td></tr>';
        });
        html += '</tbody></table>';
        container.innerHTML = html;
      });
  }

  document.getElementById('add-token-btn').addEventListener('click', function() {
    var repoName = document.getElementById('repo-name').value.trim();
    var ghToken = document.getElementById('github-token').value.trim();
    var status = document.getElementById('add-status');
    if (!repoName || !ghToken) {
      status.textContent = 'Both fields are required';
      status.style.color = '#cf222e';
      return;
    }
    var parts = repoName.split('/');
    if (parts.length !== 2) {
      status.textContent = 'Format: owner/repo';
      status.style.color = '#cf222e';
      return;
    }
    status.textContent = 'Validating...';
    status.style.color = '#57606a';
    fetch('/admin/api/repos/' + parts[0] + '/' + parts[1] + '/token', {
      method: 'PUT',
      headers: apiHeaders(),
      body: JSON.stringify({ token: ghToken })
    })
    .then(function(r) { return r.json().then(function(d) { return { ok: r.ok, data: d }; }); })
    .then(function(res) {
      if (res.ok) {
        status.textContent = 'Token saved for ' + repoName;
        status.style.color = '#1a7f37';
        document.getElementById('repo-name').value = '';
        document.getElementById('github-token').value = '';
        loadRepos();
      } else {
        status.textContent = res.data.error || 'Failed to save token';
        status.style.color = '#cf222e';
      }
    })
    .catch(function() { status.textContent = 'Connection error'; status.style.color = '#cf222e'; });
  });

  window.deleteRepo = function(repo) {
    if (!confirm('Delete token for ' + repo + '?')) return;
    var parts = repo.split('/');
    fetch('/admin/api/repos/' + parts[0] + '/' + parts[1] + '/token', {
      method: 'DELETE',
      headers: apiHeaders()
    })
    .then(function(r) {
      if (r.ok) loadRepos();
    });
  };

  function escHtml(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
})();
      `)}</script>
    </Layout>
  );
};
