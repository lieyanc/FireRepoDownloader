import { Hono } from "hono";
import type { Bindings } from "../types";
import { listReleases, resolveRelease, GitHubError } from "../services/github";
import { getToken } from "../services/token-store";

const releases = new Hono<{ Bindings: Bindings }>();

// List releases for a repo
releases.get("/:owner/:repo", async (c) => {
  const { owner, repo } = c.req.param();
  const page = Number(c.req.query("page") ?? "1");
  const perPage = Math.min(Number(c.req.query("per_page") ?? "10"), 100);

  const token = await getToken(c.env.REPO_TOKENS, owner, repo);

  try {
    const result = await listReleases(owner, repo, page, perPage, token);
    return c.json({
      releases: result.releases,
      page,
      per_page: perPage,
      has_more: result.hasMore,
    });
  } catch (e) {
    if (e instanceof GitHubError) {
      if (e.isRateLimited) {
        return c.json({ error: "Rate limited by GitHub" }, 429);
      }
      if (e.isNotFound) {
        return c.json(
          { error: `Repository ${owner}/${repo} not found. If this is a private repo, configure a token via Admin API.` },
          404
        );
      }
    }
    throw e;
  }
});

// Get specific release by tag
releases.get("/:owner/:repo/:tag", async (c) => {
  const { owner, repo, tag } = c.req.param();
  const token = await getToken(c.env.REPO_TOKENS, owner, repo);

  try {
    const release = await resolveRelease(owner, repo, tag, token);
    return c.json(release);
  } catch (e) {
    if (e instanceof GitHubError) {
      if (e.isRateLimited) {
        return c.json({ error: "Rate limited by GitHub" }, 429);
      }
      if (e.isNotFound) {
        return c.json(
          { error: `Release '${tag}' not found in ${owner}/${repo}. If this is a private repo, configure a token via Admin API.` },
          404
        );
      }
    }
    throw e;
  }
});

export default releases;
