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

  function setStatusColor(el, cls) {
    el.className = el.className.replace(/ ?status-\\S+/g, '');
    if (cls) el.className += ' ' + cls;
  }

  function setLoginStatus(message, cls) {
    loginStatus.textContent = message || '';
    setStatusColor(loginStatus, cls);
  }

  function clearSession() {
    token = '';
    sessionStorage.removeItem(tokenKey);
  }

  function showLogin(message) {
    loginSection.style.display = 'block';
    adminContent.style.display = 'none';
    setLoginStatus(message || '', message ? 'status-danger' : '');
  }

  function showAdmin() {
    loginSection.style.display = 'none';
    adminContent.style.display = 'block';
    setLoginStatus('', '');
    loadRepos();
    loadStats();
  }

  function readResponse(r) {
    return r.text().then(function(text) {
      if (!text) {
        return { ok: r.ok, status: r.status, data: null };
      }
      try {
        return { ok: r.ok, status: r.status, data: JSON.parse(text) };
      } catch (_) {
        return { ok: r.ok, status: r.status, data: { error: text } };
      }
    });
  }

  function handleAuthFailure(status) {
    if (status === 401 || status === 403) {
      clearSession();
      showLogin('Session expired, please login again');
      return true;
    }
    return false;
  }

  function tryLogin() {
    var inputToken = adminToken.value.trim();
    if (!inputToken) {
      setLoginStatus('Token is required', 'status-danger');
      return;
    }
    token = inputToken;
    setLoginStatus('Verifying...', 'status-muted');
    fetch('/admin/api/auth', { headers: apiHeaders() })
      .then(readResponse)
      .then(function(res) {
        if (res.ok) {
          sessionStorage.setItem(tokenKey, token);
          showAdmin();
        } else if (res.status === 500 && res.data && res.data.error === 'Admin authentication is not configured') {
          clearSession();
          setLoginStatus('Server ADMIN_TOKEN is not configured', 'status-danger');
        } else {
          clearSession();
          setLoginStatus((res.data && res.data.error) || 'Invalid token', 'status-danger');
        }
      })
      .catch(function() {
        clearSession();
        setLoginStatus('Connection error', 'status-danger');
      });
  }

  document.getElementById('login-btn').addEventListener('click', tryLogin);
  adminToken.addEventListener('keydown', function(e) { if (e.key === 'Enter') tryLogin(); });

  function verifyStoredToken() {
    if (!token) {
      showLogin('');
      return;
    }
    fetch('/admin/api/auth', { headers: apiHeaders() })
      .then(readResponse)
      .then(function(res) {
        if (res.ok) {
          showAdmin();
        } else if (res.status === 500 && res.data && res.data.error === 'Admin authentication is not configured') {
          clearSession();
          showLogin('Server ADMIN_TOKEN is not configured');
        } else {
          clearSession();
          showLogin('Please login');
        }
      })
      .catch(function() {
        clearSession();
        showLogin('Connection error');
      });
  }

  function loadRepos() {
    var container = document.getElementById('repos-list');
    fetch('/admin/api/repos', { headers: apiHeaders() })
      .then(readResponse)
      .then(function(res) {
        if (!res.ok) {
          if (handleAuthFailure(res.status)) return;
          container.innerHTML = '<p class="text-muted text-sm">Failed to load repositories.</p>';
          return;
        }
        var repos = Array.isArray(res.data) ? res.data : [];
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
      })
      .catch(function() {
        container.innerHTML = '<p class="text-muted text-sm">Failed to load repositories.</p>';
      });
  }

  function loadStats() {
    var container = document.getElementById('stats-content');
    fetch('/admin/api/stats', { headers: apiHeaders() })
      .then(readResponse)
      .then(function(res) {
        if (!res.ok) {
          if (handleAuthFailure(res.status)) return;
          container.innerHTML = '<p class="text-muted text-sm">Failed to load statistics.</p>';
          return;
        }
        var stats = Array.isArray(res.data) ? res.data : [];
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
      })
      .catch(function() {
        container.innerHTML = '<p class="text-muted text-sm">Failed to load statistics.</p>';
      });
  }

  document.getElementById('add-token-btn').addEventListener('click', function() {
    var repoName = document.getElementById('repo-name').value.trim();
    var ghToken = document.getElementById('github-token').value.trim();
    var status = document.getElementById('add-status');
    if (!repoName || !ghToken) {
      status.textContent = 'Both fields are required';
      setStatusColor(status, 'status-danger');
      return;
    }
    var parts = repoName.split('/');
    if (parts.length !== 2) {
      status.textContent = 'Format: owner/repo';
      setStatusColor(status, 'status-danger');
      return;
    }
    status.textContent = 'Validating...';
    setStatusColor(status, 'status-muted');
    fetch('/admin/api/repos/' + parts[0] + '/' + parts[1] + '/token', {
      method: 'PUT',
      headers: apiHeaders(),
      body: JSON.stringify({ token: ghToken })
    })
    .then(readResponse)
    .then(function(res) {
      if (res.ok) {
        status.textContent = 'Token saved for ' + repoName;
        setStatusColor(status, 'status-success');
        document.getElementById('repo-name').value = '';
        document.getElementById('github-token').value = '';
        loadRepos();
      } else {
        if (handleAuthFailure(res.status)) return;
        status.textContent = (res.data && res.data.error) || 'Failed to save token';
        setStatusColor(status, 'status-danger');
      }
    })
    .catch(function() { status.textContent = 'Connection error'; setStatusColor(status, 'status-danger'); });
  });

  window.deleteRepo = function(repo) {
    if (!confirm('Delete token for ' + repo + '?')) return;
    var parts = repo.split('/');
    fetch('/admin/api/repos/' + parts[0] + '/' + parts[1] + '/token', {
      method: 'DELETE',
      headers: apiHeaders()
    })
    .then(readResponse)
    .then(function(res) {
      if (res.ok) {
        loadRepos();
      } else if (!handleAuthFailure(res.status)) {
        alert((res.data && res.data.error) || 'Failed to delete token');
      }
    })
    .catch(function() {
      alert('Connection error');
    });
  };

  verifyStoredToken();

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
