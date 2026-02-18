import { Hono } from "hono";
import type { Bindings } from "../types";
import {
  resolveRelease,
  downloadAsset,
  GitHubError,
} from "../services/github";
import { getToken } from "../services/token-store";
import { incrementDownloadCount } from "../services/stats";

const download = new Hono<{ Bindings: Bindings }>();

// Download asset by tag
download.get("/:owner/:repo/:tag/:asset", async (c) => {
  const { owner, repo, tag, asset: assetName } = c.req.param();
  const token = await getToken(c.env.REPO_TOKENS, owner, repo);

  try {
    const release = await resolveRelease(owner, repo, tag, token);

    const asset = release.assets.find((a) => a.name === assetName);
    if (!asset) {
      return c.json(
        {
          error: `Asset '${assetName}' not found in release '${release.tag_name}'`,
          available_assets: release.assets.map((a) => a.name),
        },
        404
      );
    }

    const response = await downloadAsset(asset.url, token);

    // Record download asynchronously
    const actualTag = release.tag_name;
    c.executionCtx.waitUntil(
      incrementDownloadCount(c.env.DOWNLOAD_STATS, owner, repo, actualTag, assetName)
    );

    // Stream the response back
    return new Response(response.body, {
      headers: {
        "Content-Type": asset.content_type || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${asset.name}"`,
        ...(response.headers.get("Content-Length")
          ? { "Content-Length": response.headers.get("Content-Length")! }
          : {}),
      },
    });
  } catch (e) {
    if (e instanceof GitHubError) {
      if (e.isRateLimited) {
        return c.json({ error: "Rate limited by GitHub" }, 429);
      }
      if (e.isNotFound) {
        return c.json(
          {
            error: `Release '${tag}' not found in ${owner}/${repo}. If this is a private repo, configure a token via Admin API.`,
          },
          404
        );
      }
    }
    throw e;
  }
});

export default download;
