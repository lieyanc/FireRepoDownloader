import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeftIcon,
  ArrowUpRightIcon,
  CheckIcon,
  CircleAlertIcon,
  CopyIcon,
  DownloadIcon,
  FileTextIcon,
  PackageOpenIcon,
  RefreshCwIcon,
  SearchIcon,
  XIcon,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
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
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { downloadPath, getRelease, repoPath } from "@/lib/api";
import { assetIcon } from "@/lib/asset";
import { compactNumber, formatDate, formatRelative, formatSize } from "@/lib/format";
import type { GitHubAsset, GitHubRelease } from "@/types";

function ReleaseSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-label="Loading release">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-9 w-64 max-w-full" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        {[0, 1].map((item) => (
          <Card key={item}>
            <CardHeader>
              <Skeleton className="h-5 w-28" />
            </CardHeader>
            <CardContent className="flex flex-col gap-2.5">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AssetItem({ asset, href }: { asset: GitHubAsset; href: string }) {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const Icon = assetIcon(asset.name);

  useEffect(() => () => clearTimeout(resetTimer.current), []);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(new URL(href, window.location.origin).toString());
      setCopied(true);
      resetTimer.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Clipboard is unavailable in this browser.");
    }
  }, [href]);

  return (
    <Item variant="outline">
      <ItemMedia variant="icon">
        <Icon />
      </ItemMedia>
      <ItemContent>
        <ItemTitle className="break-all">{asset.name}</ItemTitle>
        <ItemDescription className="tabular-nums">
          {formatSize(asset.size)} · {compactNumber(asset.download_count)} downloads
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Copy link to ${asset.name}`}
              onClick={() => void copyLink()}
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{copied ? "Copied" : "Copy link"}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon-sm" asChild>
              <a href={href} aria-label={`Download ${asset.name}`}>
                <DownloadIcon />
              </a>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Download</TooltipContent>
        </Tooltip>
      </ItemActions>
    </Item>
  );
}

export function ReleasePage() {
  const { owner = "", repo = "", tag = "" } = useParams();
  const [release, setRelease] = useState<GitHubRelease | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    document.title = `${tag} · ${owner}/${repo} · FireRepoDownloader`;
    const controller = new AbortController();
    setLoading(true);
    setError("");

    getRelease(owner, repo, tag, controller.signal)
      .then(setRelease)
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setError(reason instanceof Error ? reason.message : "Unable to load this release.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [owner, repo, tag, reloadKey]);

  const totals = useMemo(() => {
    const assets = release?.assets ?? [];
    return {
      size: assets.reduce((total, asset) => total + asset.size, 0),
      downloads: assets.reduce((total, asset) => total + asset.download_count, 0),
    };
  }, [release]);

  const visibleAssets = useMemo(() => {
    const assets = release?.assets ?? [];
    const needle = filter.trim().toLowerCase();
    return needle ? assets.filter((asset) => asset.name.toLowerCase().includes(needle)) : assets;
  }, [filter, release]);

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
            <BreadcrumbLink asChild>
              <Link to={repoPath(owner, repo)}>
                {owner}/{repo}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{tag}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {loading ? (
        <ReleaseSkeleton />
      ) : error || !release ? (
        <Empty className="min-h-64 border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CircleAlertIcon />
            </EmptyMedia>
            <EmptyTitle>Couldn&apos;t load {tag}</EmptyTitle>
            <EmptyDescription>{error}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="flex-row justify-center">
            <Button variant="outline" size="sm" asChild>
              <Link to={repoPath(owner, repo)}>
                <ArrowLeftIcon data-icon="inline-start" />
                All releases
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setReloadKey((key) => key + 1)}>
              <RefreshCwIcon data-icon="inline-start" />
              Try again
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <>
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-heading text-3xl font-semibold tracking-tight break-words sm:text-4xl">
                  {release.name || release.tag_name}
                </h1>
                {release.name && release.name !== release.tag_name && (
                  <Badge variant="outline">{release.tag_name}</Badge>
                )}
                {release.prerelease && <Badge variant="secondary">Pre-release</Badge>}
                {release.draft && <Badge variant="destructive">Draft</Badge>}
              </div>
              <p className="text-sm tabular-nums text-muted-foreground">
                <span title={formatDate(release.published_at)}>{formatRelative(release.published_at)}</span>
                {" · "}
                {release.assets.length} files · {formatSize(totals.size)} ·{" "}
                {compactNumber(totals.downloads)} downloads
              </p>
            </div>

            <Button variant="outline" size="sm" asChild>
              <a href={release.html_url} target="_blank" rel="noreferrer">
                GitHub
                <ArrowUpRightIcon data-icon="inline-end" />
              </a>
            </Button>
          </header>

          <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <Card>
              <CardHeader>
                <CardTitle>Assets</CardTitle>
                <CardAction>
                  {release.assets.length > 8 ? (
                    <InputGroup className="w-40 sm:w-56">
                      <InputGroupInput
                        value={filter}
                        onChange={(event) => setFilter(event.target.value)}
                        placeholder="Filter files"
                        aria-label="Filter assets by name"
                        autoComplete="off"
                        spellCheck={false}
                      />
                      <InputGroupAddon align="inline-start">
                        <SearchIcon />
                      </InputGroupAddon>
                      {filter && (
                        <InputGroupAddon align="inline-end">
                          <InputGroupButton
                            size="icon-xs"
                            aria-label="Clear filter"
                            onClick={() => setFilter("")}
                          >
                            <XIcon />
                          </InputGroupButton>
                        </InputGroupAddon>
                      )}
                    </InputGroup>
                  ) : (
                    <Badge variant="outline">{release.assets.length}</Badge>
                  )}
                </CardAction>
              </CardHeader>
              <CardContent>
                {release.assets.length === 0 ? (
                  <Empty className="min-h-48 border">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <PackageOpenIcon />
                      </EmptyMedia>
                      <EmptyTitle>No attached files</EmptyTitle>
                      <EmptyDescription>Only source archives exist for this tag.</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : visibleAssets.length === 0 ? (
                  <Empty className="min-h-40 border">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <SearchIcon />
                      </EmptyMedia>
                      <EmptyTitle>No match for “{filter}”</EmptyTitle>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  <ItemGroup>
                    {visibleAssets.map((asset) => (
                      <AssetItem
                        key={asset.id}
                        asset={asset}
                        href={downloadPath(owner, repo, release.tag_name, asset.name)}
                      />
                    ))}
                  </ItemGroup>
                )}
              </CardContent>
            </Card>

            <Card className="lg:sticky lg:top-18">
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent className="lg:max-h-[calc(100svh-12rem)] lg:overflow-y-auto">
                {release.body ? (
                  <div className="release-notes">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{release.body}</ReactMarkdown>
                  </div>
                ) : (
                  <Empty className="min-h-48 border">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <FileTextIcon />
                      </EmptyMedia>
                      <EmptyTitle>No release notes</EmptyTitle>
                    </EmptyHeader>
                  </Empty>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
