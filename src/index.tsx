import { Hono } from "hono";
import type { Bindings } from "./types";
import { GitHubError } from "./services/github";
import adminRoutes from "./routes/admin";
import releasesRoutes from "./routes/releases";
import downloadRoutes from "./routes/download";

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

app.route("/admin", adminRoutes);
app.route("/api/releases", releasesRoutes);
app.route("/download", downloadRoutes);

app.notFound((c) => c.json({ error: "API route not found" }, 404));

export default app;
