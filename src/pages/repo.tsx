import { useEffect, useMemo, useState } from "react";
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  BoxIcon,
  ChevronRightIcon,
  DownloadIcon,
  GitForkIcon,
  PackageOpenIcon,
  RefreshCwIcon,
} from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import { downloadPath, getReleases, releasePath, repoPath } from "@/lib/api";
import { formatDate, formatSize } from "@/lib/format";
import type { GitHubRelease } from "@/types";

function ReleasesLoading() {
  return (
    <div className="flex flex-col gap-4" aria-label="Loading releases">
      {[0, 1, 2].map((item) => (
        <Card key={item} size="sm">
          <CardHeader>
            <Skeleton className="h-5 w-56" />
            <Skeleton className="h-4 w-36" />
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ReleaseCard({ owner, repo, release }: { owner: string; repo: string; release: GitHubRelease }) {
  const visibleAssets = release.assets.slice(0, 3);

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>
          <Link className="hover:text-primary" to={releasePath(owner, repo, release.tag_name)}>
            {release.name || release.tag_name}
          </Link>
        </CardTitle>
        <CardDescription>
          Published {formatDate(release.published_at)} · {release.assets.length} asset
          {release.assets.length === 1 ? "" : "s"}
        </CardDescription>
        <CardAction className="flex flex-wrap justify-end gap-1.5">
          <Badge variant={release.prerelease ? "secondary" : "outline"}>{release.tag_name}</Badge>
          {release.prerelease && <Badge variant="secondary">Pre-release</Badge>}
          {release.draft && <Badge variant="destructive">Draft</Badge>}
        </CardAction>
      </CardHeader>

      <CardContent>
        {visibleAssets.length > 0 ? (
          <ItemGroup>
            {visibleAssets.map((asset) => (
              <Item key={asset.id} size="sm" variant="muted" asChild>
                <a href={downloadPath(owner, repo, release.tag_name, asset.name)}>
                  <ItemMedia variant="icon">
                    <BoxIcon />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>{asset.name}</ItemTitle>
                    <ItemDescription>{formatSize(asset.size)} · {asset.content_type}</ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <DownloadIcon />
                  </ItemActions>
                </a>
              </Item>
            ))}
            {release.assets.length > visibleAssets.length && (
              <Item size="sm" asChild>
                <Link to={releasePath(owner, repo, release.tag_name)}>
                  <ItemContent>
                    <ItemTitle>View {release.assets.length - visibleAssets.length} more assets</ItemTitle>
                  </ItemContent>
                  <ItemActions>
                    <ChevronRightIcon />
                  </ItemActions>
                </Link>
              </Item>
            )}
          </ItemGroup>
        ) : (
          <p className="text-sm text-muted-foreground">This release has no downloadable assets.</p>
        )}
      </CardContent>
    </Card>
  );
}

export function RepoPage() {
  const { owner = "", repo = "" } = useParams();
  const [searchParams] = useSearchParams();
  const requestedPage = Number(searchParams.get("page") ?? "1");
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const [releases, setReleases] = useState<GitHubRelease[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    document.title = `${owner}/${repo} · FireRepoDownloader`;
    const controller = new AbortController();
    setLoading(true);
    setError("");

    getReleases(owner, repo, page, controller.signal)
      .then((result) => {
        setReleases(result.releases);
        setHasMore(result.has_more);
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setError(reason instanceof Error ? reason.message : "Unable to load releases.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [owner, repo, page, reloadKey]);

  const assetCount = useMemo(
    () => releases.reduce((total, release) => total + release.assets.length, 0),
    [releases],
  );

  return (
    <div className="flex flex-col gap-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link to="/">Browse</Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>{owner}/{repo}</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary"><GitForkIcon data-icon="inline-start" />Repository</Badge>
            <Badge variant="outline">Page {page}</Badge>
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              {owner}<span className="text-muted-foreground">/</span>{repo}
            </h1>
            <p className="text-muted-foreground">
              {loading ? "Loading release history…" : `${releases.length} releases and ${assetCount} assets on this page.`}
            </p>
          </div>
        </div>
        <Button variant="outline" asChild>
          <a href={`https://github.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`} target="_blank" rel="noreferrer">
            View on GitHub
            <GitForkIcon data-icon="inline-end" />
          </a>
        </Button>
      </section>

      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>Couldn&apos;t load this repository</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <ReleasesLoading />
      ) : error ? (
        <div>
          <Button variant="outline" onClick={() => setReloadKey((key) => key + 1)}>
            <RefreshCwIcon data-icon="inline-start" />
            Try again
          </Button>
        </div>
      ) : releases.length === 0 ? (
        <Empty className="min-h-80 border">
          <EmptyHeader>
            <EmptyMedia variant="icon"><PackageOpenIcon /></EmptyMedia>
            <EmptyTitle>No releases found</EmptyTitle>
            <EmptyDescription>
              This repository has no published releases, or it needs a private repository token.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="flex-row justify-center">
            <Button variant="outline" asChild><Link to="/">Browse another repo</Link></Button>
            <Button asChild><Link to="/admin">Open Admin</Link></Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="flex flex-col gap-4">
          {releases.map((release) => (
            <ReleaseCard key={release.id} owner={owner} repo={repo} release={release} />
          ))}
        </div>
      )}

      {!loading && !error && (page > 1 || hasMore) && (
        <nav className="flex items-center justify-between" aria-label="Release pagination">
          <div>
            {page > 1 && (
              <Button variant="outline" asChild>
                <Link to={`${repoPath(owner, repo)}?page=${page - 1}`}>
                  <ArrowLeftIcon data-icon="inline-start" />
                  Previous
                </Link>
              </Button>
            )}
          </div>
          <Badge variant="outline">Page {page}</Badge>
          <div>
            {hasMore && (
              <Button variant="outline" asChild>
                <Link to={`${repoPath(owner, repo)}?page=${page + 1}`}>
                  Next
                  <ArrowRightIcon data-icon="inline-end" />
                </Link>
              </Button>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}
