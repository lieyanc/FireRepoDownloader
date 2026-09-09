import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CircleAlertIcon,
  DownloadIcon,
  PackageOpenIcon,
  RefreshCwIcon,
  TagIcon,
} from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router-dom";
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
  CardFooter,
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
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { downloadPath, getReleases, releasePath, repoPath } from "@/lib/api";
import { assetIcon } from "@/lib/asset";
import { formatDate, formatRelative, formatSize } from "@/lib/format";
import { rememberRepo } from "@/lib/recent";
import type { GitHubAsset, GitHubRelease } from "@/types";

/** Assets shown on the featured card before deferring to the release page. */
const featuredAssetLimit = 6;

function totalSize(release: GitHubRelease): number {
  return release.assets.reduce((total, asset) => total + asset.size, 0);
}

function StatusBadges({ release, isLatest }: { release: GitHubRelease; isLatest?: boolean }) {
  return (
    <>
      {isLatest && <Badge>Latest</Badge>}
      {release.prerelease && <Badge variant="secondary">Pre-release</Badge>}
      {release.draft && <Badge variant="destructive">Draft</Badge>}
    </>
  );
}

function ReleasesSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-label="Loading releases">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-40" />
        </CardHeader>
        <CardContent className="flex flex-col gap-2.5">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="flex flex-col gap-2.5">
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

function FeaturedRelease({
  owner,
  repo,
  release,
}: {
  owner: string;
  repo: string;
  release: GitHubRelease;
}) {
  const detailPath = releasePath(owner, repo, release.tag_name);
  const visible = release.assets.slice(0, featuredAssetLimit);
  const hidden = release.assets.length - visible.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          <Link className="transition-colors hover:text-link" to={detailPath}>
            {release.name || release.tag_name}
          </Link>
        </CardTitle>
        <CardDescription className="tabular-nums">
          <span title={formatDate(release.published_at)}>{formatRelative(release.published_at)}</span>
          {release.assets.length > 0 && ` · ${release.assets.length} assets · ${formatSize(totalSize(release))}`}
        </CardDescription>
        <CardAction className="flex flex-wrap justify-end gap-1.5">
          <StatusBadges release={release} isLatest />
          <Badge variant="outline">{release.tag_name}</Badge>
        </CardAction>
      </CardHeader>

      {release.assets.length > 0 && (
        <CardContent>
          <ItemGroup>
            {visible.map((asset) => (
              <AssetRow
                key={asset.id}
                asset={asset}
                href={downloadPath(owner, repo, release.tag_name, asset.name)}
              />
            ))}
          </ItemGroup>
        </CardContent>
      )}

      <CardFooter>
        <Button variant="ghost" size="sm" className="w-full" asChild>
          <Link to={detailPath}>
            {hidden > 0 ? `${hidden} more assets and notes` : "Release notes"}
            <ChevronRightIcon data-icon="inline-end" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

function AssetRow({ href, asset }: { href: string; asset: GitHubAsset }) {
  const Icon = assetIcon(asset.name);

  return (
    <Item variant="outline" size="sm" asChild>
      <a href={href}>
        <ItemMedia variant="icon">
          <Icon />
        </ItemMedia>
        <ItemContent>
          <ItemTitle className="break-all">{asset.name}</ItemTitle>
        </ItemContent>
        <ItemActions>
          <span className="text-xs tabular-nums text-muted-foreground">{formatSize(asset.size)}</span>
          <DownloadIcon className="size-4 text-muted-foreground" aria-hidden="true" />
        </ItemActions>
      </a>
    </Item>
  );
}

function ReleaseRow({
  owner,
  repo,
  release,
  isLatest,
}: {
  owner: string;
  repo: string;
  release: GitHubRelease;
  isLatest: boolean;
}) {
  return (
    <Item variant="outline" size="sm" asChild>
      <Link to={releasePath(owner, repo, release.tag_name)}>
        <ItemMedia variant="icon">
          <TagIcon />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>{release.name || release.tag_name}</ItemTitle>
          <ItemDescription className="tabular-nums">
            <span title={formatDate(release.published_at)}>{formatRelative(release.published_at)}</span>
            {release.assets.length > 0 &&
              ` · ${release.assets.length} assets · ${formatSize(totalSize(release))}`}
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          <StatusBadges release={release} isLatest={isLatest} />
          <ChevronRightIcon className="size-4 text-muted-foreground" aria-hidden="true" />
        </ItemActions>
      </Link>
    </Item>
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
        rememberRepo(owner, repo);
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
  // GitHub marks the newest stable release as "latest"; drafts and pre-releases never qualify.
  const featured = useMemo(
    () => (page === 1 ? releases.find((release) => !release.draft && !release.prerelease) : undefined),
    [page, releases],
  );
  const rest = useMemo(
    () => releases.filter((release) => release.id !== featured?.id),
    [featured, releases],
  );

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/">Browse</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              {owner}/{repo}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1.5">
          <h1 className="font-heading text-3xl font-semibold tracking-tight break-words sm:text-4xl">
            {owner}
            <span className="text-muted-foreground">/</span>
            {repo}
          </h1>
          {loading ? (
            <Skeleton className="h-5 w-44" />
          ) : (
            <p className="text-sm tabular-nums text-muted-foreground">
              {releases.length} releases · {assetCount} assets
            </p>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Reload releases"
                disabled={loading}
                onClick={() => setReloadKey((key) => key + 1)}
              >
                <RefreshCwIcon className={loading ? "animate-spin" : undefined} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reload</TooltipContent>
          </Tooltip>
          <Button variant="outline" size="sm" asChild>
            <a
              href={`https://github.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`}
              target="_blank"
              rel="noreferrer"
            >
              GitHub
              <ArrowUpRightIcon data-icon="inline-end" />
            </a>
          </Button>
        </div>
      </header>

      {loading ? (
        <ReleasesSkeleton />
      ) : error ? (
        <Empty className="min-h-64 border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CircleAlertIcon />
            </EmptyMedia>
            <EmptyTitle>Couldn&apos;t load releases</EmptyTitle>
            <EmptyDescription>{error}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="flex-row justify-center">
            <Button variant="outline" size="sm" onClick={() => setReloadKey((key) => key + 1)}>
              <RefreshCwIcon data-icon="inline-start" />
              Try again
            </Button>
          </EmptyContent>
        </Empty>
      ) : releases.length === 0 ? (
        <Empty className="min-h-64 border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <PackageOpenIcon />
            </EmptyMedia>
            <EmptyTitle>No releases</EmptyTitle>
            <EmptyDescription>This repository has no published releases.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="flex-row justify-center">
            <Button variant="outline" size="sm" asChild>
              <Link to="/">Browse another</Link>
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="flex flex-col gap-4">
          {featured && <FeaturedRelease owner={owner} repo={repo} release={featured} />}

          {rest.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{featured ? "Earlier releases" : "Releases"}</CardTitle>
                <CardAction>
                  <Badge variant="outline">{rest.length}</Badge>
                </CardAction>
              </CardHeader>
              <CardContent>
                <ItemGroup>
                  {rest.map((release) => (
                    <ReleaseRow
                      key={release.id}
                      owner={owner}
                      repo={repo}
                      release={release}
                      isLatest={false}
                    />
                  ))}
                </ItemGroup>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {!loading && !error && (page > 1 || hasMore) && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              {page > 1 ? (
                <Button variant="ghost" size="sm" asChild>
                  <Link to={`${repoPath(owner, repo)}?page=${page - 1}`}>
                    <ChevronLeftIcon data-icon="inline-start" />
                    Previous
                  </Link>
                </Button>
              ) : (
                <Button variant="ghost" size="sm" disabled>
                  <ChevronLeftIcon data-icon="inline-start" />
                  Previous
                </Button>
              )}
            </PaginationItem>
            <PaginationItem>
              <span className="px-3 text-sm tabular-nums text-muted-foreground">Page {page}</span>
            </PaginationItem>
            <PaginationItem>
              {hasMore ? (
                <Button variant="ghost" size="sm" asChild>
                  <Link to={`${repoPath(owner, repo)}?page=${page + 1}`}>
                    Next
                    <ChevronRightIcon data-icon="inline-end" />
                  </Link>
                </Button>
              ) : (
                <Button variant="ghost" size="sm" disabled>
                  Next
                  <ChevronRightIcon data-icon="inline-end" />
                </Button>
              )}
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
