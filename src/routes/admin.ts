import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import type { Bindings } from "../types";
import { getToken, setToken, deleteToken, listRepos } from "../services/token-store";
import { getRepo, GitHubError } from "../services/github";
import { getAllStats } from "../services/stats";

const admin = new Hono<{ Bindings: Bindings }>();

// Bearer token auth for all /admin/api routes
admin.use(
  "/api/*",
  async (c, next) => {
    const auth = bearerAuth({ token: c.env.ADMIN_TOKEN });
    return auth(c, next);
  }
);

// List all repos with configured tokens
admin.get("/api/repos", async (c) => {
  const repos = await listRepos(c.env.REPO_TOKENS);
  return c.json(
    repos.map((r) => ({
      repo: `${r.metadata.owner}/${r.metadata.repo}`,
      created_at: r.metadata.created_at,
      updated_at: r.metadata.updated_at,
    }))
  );
});

// Set token for a repo
admin.put("/api/repos/:owner/:repo/token", async (c) => {
  const { owner, repo } = c.req.param();
  const body = await c.req.json<{ token: string }>();

  if (!body.token) {
    return c.json({ error: "token is required" }, 400);
  }

  // Validate the token by calling GitHub API
  try {
    await getRepo(owner, repo, body.token);
  } catch (e) {
    if (e instanceof GitHubError) {
      if (e.isNotFound) {
        return c.json(
          { error: `Repository ${owner}/${repo} not found or token lacks access` },
          404
        );
      }
      return c.json({ error: `GitHub API error: ${e.status}` }, 400);
    }
    throw e;
  }

  await setToken(c.env.REPO_TOKENS, owner, repo, body.token);
  return c.json({ ok: true, repo: `${owner}/${repo}` });
});

// Delete token for a repo
admin.delete("/api/repos/:owner/:repo/token", async (c) => {
  const { owner, repo } = c.req.param();
  const existing = await getToken(c.env.REPO_TOKENS, owner, repo);
  if (!existing) {
    return c.json({ error: "No token configured for this repo" }, 404);
  }
  await deleteToken(c.env.REPO_TOKENS, owner, repo);
  return c.json({ ok: true, repo: `${owner}/${repo}` });
});

// Get download stats
admin.get("/api/stats", async (c) => {
  const stats = await getAllStats(c.env.DOWNLOAD_STATS);
  return c.json(stats);
});

export default admin;
