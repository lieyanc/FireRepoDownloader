import { useEffect, useMemo, useState } from "react";
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  BoxIcon,
  CalendarDaysIcon,
  DownloadIcon,
  ExternalLinkIcon,
  FileArchiveIcon,
  GitForkIcon,
  PackageOpenIcon,
  RefreshCwIcon,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Link, useParams } from "react-router-dom";
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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { downloadPath, getRelease, repoPath } from "@/lib/api";
import { compactNumber, formatDate, formatSize } from "@/lib/format";
import type { GitHubRelease } from "@/types";

function ReleaseLoading() {
  return (
    <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]" aria-label="Loading release">
      {[0, 1].map((item) => (
        <Card key={item}>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ReleasePage() {
  const { owner = "", repo = "", tag = "" } = useParams();
  const [release, setRelease] = useState<GitHubRelease | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

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

  const totalSize = useMemo(
    () => release?.assets.reduce((total, asset) => total + asset.size, 0) ?? 0,
    [release],
  );
  const githubDownloads = useMemo(
    () => release?.assets.reduce((total, asset) => total + asset.download_count, 0) ?? 0,
    [release],
  );

  return (
    <div className="flex flex-col gap-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link to="/">Browse</Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link to={repoPath(owner, repo)}>{owner}/{repo}</Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>{tag}</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>Couldn&apos;t load this release</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <ReleaseLoading />
      ) : error || !release ? (
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to={repoPath(owner, repo)}>
              <ArrowLeftIcon data-icon="inline-start" />
              All releases
            </Link>
          </Button>
          <Button variant="outline" onClick={() => setReloadKey((key) => key + 1)}>
            <RefreshCwIcon data-icon="inline-start" />
            Try again
          </Button>
        </div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{release.name || release.tag_name}</CardTitle>
              <CardDescription>
                Published {formatDate(release.published_at)} in {owner}/{repo}
              </CardDescription>
              <CardAction className="flex flex-wrap justify-end gap-1.5">
                <Badge variant="outline">{release.tag_name}</Badge>
                {release.prerelease && <Badge variant="secondary">Pre-release</Badge>}
                {release.draft && <Badge variant="destructive">Draft</Badge>}
              </CardAction>
            </CardHeader>
            <CardContent>
              <ItemGroup className="grid gap-3 sm:grid-cols-3">
                <Item variant="muted">
                  <ItemMedia variant="icon"><BoxIcon /></ItemMedia>
                  <ItemContent>
                    <ItemTitle>{release.assets.length} assets</ItemTitle>
                    <ItemDescription>Attached files</ItemDescription>
                  </ItemContent>
                </Item>
                <Item variant="muted">
                  <ItemMedia variant="icon"><FileArchiveIcon /></ItemMedia>
                  <ItemContent>
                    <ItemTitle>{formatSize(totalSize)}</ItemTitle>
                    <ItemDescription>Total payload</ItemDescription>
                  </ItemContent>
                </Item>
                <Item variant="muted">
                  <ItemMedia variant="icon"><DownloadIcon /></ItemMedia>
                  <ItemContent>
                    <ItemTitle>{compactNumber(githubDownloads)}</ItemTitle>
                    <ItemDescription>GitHub downloads</ItemDescription>
                  </ItemContent>
                </Item>
              </ItemGroup>
            </CardContent>
            <CardFooter className="flex-wrap gap-2">
              <Button variant="outline" asChild>
                <Link to={repoPath(owner, repo)}>
                  <ArrowLeftIcon data-icon="inline-start" />
                  All releases
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <a href={release.html_url} target="_blank" rel="noreferrer">
                  <GitForkIcon data-icon="inline-start" />
                  GitHub release
                  <ExternalLinkIcon data-icon="inline-end" />
                </a>
              </Button>
            </CardFooter>
          </Card>

          <div className="grid items-start gap-4 lg:grid-cols-[0.85fr_1.15fr]">
            <Card>
              <CardHeader>
                <CardTitle>Release notes</CardTitle>
                <CardDescription className="flex items-center gap-1.5">
                  <CalendarDaysIcon className="size-3.5" aria-hidden="true" />
                  {formatDate(release.published_at)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {release.body ? (
                  <div className="release-notes">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{release.body}</ReactMarkdown>
                  </div>
                ) : (
                  <Empty className="min-h-52 border">
                    <EmptyHeader>
                      <EmptyMedia variant="icon"><PackageOpenIcon /></EmptyMedia>
                      <EmptyTitle>No release notes</EmptyTitle>
                      <EmptyDescription>The publisher did not include notes for this release.</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Download assets</CardTitle>
                <CardDescription>
                  Files stream through the Worker using the repository&apos;s configured access policy.
                </CardDescription>
                <CardAction><Badge>{release.assets.length}</Badge></CardAction>
              </CardHeader>
              <CardContent>
                {release.assets.length === 0 ? (
                  <Empty className="min-h-52 border">
                    <EmptyHeader>
                      <EmptyMedia variant="icon"><PackageOpenIcon /></EmptyMedia>
                      <EmptyTitle>No downloadable assets</EmptyTitle>
                      <EmptyDescription>This release only contains source archives on GitHub.</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>File</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead className="hidden sm:table-cell">Type</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {release.assets.map((asset) => (
                        <TableRow key={asset.id}>
                          <TableCell className="max-w-48 sm:max-w-72">
                            <div className="truncate" title={asset.name}>{asset.name}</div>
                          </TableCell>
                          <TableCell><span className="text-muted-foreground">{formatSize(asset.size)}</span></TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <Badge variant="outline">{asset.content_type}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="icon-sm" asChild>
                              <a
                                href={downloadPath(owner, repo, release.tag_name, asset.name)}
                                aria-label={`Download ${asset.name}`}
                              >
                                <DownloadIcon data-icon="inline-start" />
                              </a>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
