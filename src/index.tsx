import { Hono } from "hono";
import type { Bindings } from "./types";
import { GitHubError } from "./services/github";
import { getToken } from "./services/token-store";
import { listReleases, getRelease } from "./services/github";
import adminRoutes from "./routes/admin";
import releasesRoutes from "./routes/releases";
import downloadRoutes from "./routes/download";
import { HomePage } from "./pages/home";
import { RepoPage } from "./pages/repo";
import { ReleasePage } from "./pages/release";
import { AdminPage } from "./pages/admin";

const app = new Hono<{ Bindings: Bindings }>();

// Global error handler
app.onError((err, c) => {
  if (err instanceof GitHubError) {
    if (err.isRateLimited) {
      return c.json({ error: "Rate limited by GitHub. Please try again later." }, 429);
    }
    return c.json({ error: `GitHub API error: ${err.status}` }, err.status as 500);
  }
  console.error("Unhandled error:", err);
  return c.json({ error: "Internal server error" }, 500);
});

// --- API routes (matched first) ---

app.route("/admin", adminRoutes);
app.route("/api/releases", releasesRoutes);
app.route("/download", downloadRoutes);

// --- Web UI pages ---

// Home page
app.get("/", (c) => {
  return c.html(<HomePage />);
});

// Admin page
app.get("/admin", (c) => {
  return c.html(<AdminPage />);
});

// Repo releases page
app.get("/:owner/:repo", async (c) => {
  const { owner, repo } = c.req.param();
  const page = Number(c.req.query("page") ?? "1");
  const token = await getToken(c.env.REPO_TOKENS, owner, repo);

  try {
    const result = await listReleases(owner, repo, page, 10, token);
    return c.html(
      <RepoPage
        owner={owner}
        repo={repo}
        releases={result.releases}
        page={page}
        hasMore={result.hasMore}
      />
    );
  } catch (e) {
    if (e instanceof GitHubError && e.isNotFound) {
      return c.html(
        <RepoPage owner={owner} repo={repo} releases={[]} page={1} hasMore={false} />,
        404
      );
    }
    throw e;
  }
});

// Release detail page
app.get("/:owner/:repo/:tag", async (c) => {
  const { owner, repo, tag } = c.req.param();
  const token = await getToken(c.env.REPO_TOKENS, owner, repo);

  try {
    const release = await getRelease(owner, repo, tag, token);
    return c.html(<ReleasePage owner={owner} repo={repo} release={release} />);
  } catch (e) {
    if (e instanceof GitHubError && e.isNotFound) {
      return c.notFound();
    }
    throw e;
  }
});

export default app;
