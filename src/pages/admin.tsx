import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangleIcon,
  BarChart3Icon,
  DownloadIcon,
  GitForkIcon,
  KeyRoundIcon,
  LockKeyholeIcon,
  LogOutIcon,
  PackageCheckIcon,
  PlusIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
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
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ApiError,
  type ConfiguredRepo,
  getConfiguredRepos,
  getStats,
  removeRepoToken,
  saveRepoToken,
  verifyAdmin,
} from "@/lib/api";
import { compactNumber, formatDate } from "@/lib/format";
import type { RepoStatsSummary } from "@/types";

const tokenStorageKey = "fire_admin_token";

function splitRepository(value: string): { owner: string; repo: string } | null {
  const parts = value.trim().replace(/^\/+|\/+$/g, "").split("/");
  if (parts.length !== 2 || parts.some((part) => !part || !/^[\w.-]+$/.test(part))) return null;
  return { owner: parts[0], repo: parts[1] };
}

function AdminLogin({ onAuthenticated }: { onAuthenticated: (token: string) => void }) {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const candidate = token.trim();

    if (!candidate) {
      setError("Admin token is required.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await verifyAdmin(candidate);
      sessionStorage.setItem(tokenStorageKey, candidate);
      onAuthenticated(candidate);
      toast.success("Admin workspace unlocked.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Authentication failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="my-auto flex min-h-[32rem] items-center justify-center">
      <form className="w-full max-w-md" onSubmit={handleSubmit} noValidate>
        <Card>
          <CardHeader>
            <span className="mb-2 flex size-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
              <LockKeyholeIcon className="size-5" aria-hidden="true" />
            </span>
            <CardTitle>Admin workspace</CardTitle>
            <CardDescription>
              Authenticate to manage private repository tokens and inspect download activity.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field data-invalid={error ? true : undefined}>
                <FieldLabel htmlFor="admin-token">Admin token</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="admin-token"
                    type="password"
                    value={token}
                    onChange={(event) => {
                      setToken(event.target.value);
                      if (error) setError("");
                    }}
                    placeholder="Enter your ADMIN_TOKEN"
                    autoComplete="current-password"
                    aria-invalid={error ? true : undefined}
                    disabled={submitting}
                  />
                  <InputGroupAddon align="inline-start"><KeyRoundIcon /></InputGroupAddon>
                </InputGroup>
                {error ? (
                  <FieldError>{error}</FieldError>
                ) : (
                  <FieldDescription>The token stays in this tab&apos;s session storage.</FieldDescription>
                )}
              </Field>
            </FieldGroup>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? <Spinner data-icon="inline-start" /> : <ShieldCheckIcon data-icon="inline-start" />}
              {submitting ? "Verifying…" : "Unlock workspace"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

function AdminChecking() {
  return (
    <div className="my-auto flex min-h-[32rem] items-center justify-center" aria-label="Checking admin session">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Skeleton className="size-10" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent><Skeleton className="h-9 w-full" /></CardContent>
        <CardFooter><Skeleton className="h-8 w-full" /></CardFooter>
      </Card>
    </div>
  );
}

interface RepoTokenFormProps {
  adminToken: string;
  onSaved: () => Promise<void>;
}

function RepoTokenForm({ adminToken, onSaved }: RepoTokenFormProps) {
  const [repository, setRepository] = useState("");
  const [githubToken, setGithubToken] = useState("");
  const [repositoryError, setRepositoryError] = useState("");
  const [tokenError, setTokenError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = splitRepository(repository);
    const nextRepositoryError = parsed ? "" : "Use the owner/repository format.";
    const nextTokenError = githubToken.trim() ? "" : "A GitHub access token is required.";
    setRepositoryError(nextRepositoryError);
    setTokenError(nextTokenError);

    if (!parsed || nextTokenError) return;

    setSaving(true);
    try {
      const result = await saveRepoToken(adminToken, parsed.owner, parsed.repo, githubToken.trim());
      setRepository("");
      setGithubToken("");
      toast.success(`Token saved for ${result.repo}.`);
      await onSaved();
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Unable to save repository token.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Card>
        <CardHeader>
          <CardTitle>Add repository access</CardTitle>
          <CardDescription>
            Store a repository-scoped token after validating it against the GitHub API.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field data-invalid={repositoryError ? true : undefined}>
              <FieldLabel htmlFor="repo-name">Repository</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="repo-name"
                  value={repository}
                  onChange={(event) => {
                    setRepository(event.target.value);
                    if (repositoryError) setRepositoryError("");
                  }}
                  placeholder="owner/repository"
                  autoCapitalize="none"
                  autoComplete="off"
                  spellCheck={false}
                  aria-invalid={repositoryError ? true : undefined}
                  disabled={saving}
                />
                <InputGroupAddon align="inline-start"><GitForkIcon /></InputGroupAddon>
              </InputGroup>
              {repositoryError && <FieldError>{repositoryError}</FieldError>}
            </Field>

            <Field data-invalid={tokenError ? true : undefined}>
              <FieldLabel htmlFor="github-token">GitHub access token</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="github-token"
                  type="password"
                  value={githubToken}
                  onChange={(event) => {
                    setGithubToken(event.target.value);
                    if (tokenError) setTokenError("");
                  }}
                  placeholder="github_pat_…"
                  autoComplete="new-password"
                  aria-invalid={tokenError ? true : undefined}
                  disabled={saving}
                />
                <InputGroupAddon align="inline-start"><KeyRoundIcon /></InputGroupAddon>
              </InputGroup>
              {tokenError ? (
                <FieldError>{tokenError}</FieldError>
              ) : (
                <FieldDescription>Fine-grained, read-only Content access is sufficient.</FieldDescription>
              )}
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={saving}>
            {saving ? <Spinner data-icon="inline-start" /> : <PlusIcon data-icon="inline-start" />}
            {saving ? "Validating…" : "Save repository"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

interface RepoTableProps {
  adminToken: string;
  repos: ConfiguredRepo[];
  loading: boolean;
  onChanged: () => Promise<void>;
}

function RepositoriesTable({ adminToken, repos, loading, onChanged }: RepoTableProps) {
  async function handleDelete(repoName: string) {
    const parsed = splitRepository(repoName);
    if (!parsed) return;

    try {
      await removeRepoToken(adminToken, parsed.owner, parsed.repo);
      toast.success(`Removed access for ${repoName}.`);
      await onChanged();
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Unable to remove repository token.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configured repositories</CardTitle>
        <CardDescription>Repositories with server-side GitHub credentials in Cloudflare KV.</CardDescription>
        <CardAction><Badge variant="outline">{repos.length}</Badge></CardAction>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map((item) => <Skeleton key={item} className="h-10 w-full" />)}
          </div>
        ) : repos.length === 0 ? (
          <Empty className="min-h-56 border">
            <EmptyHeader>
              <EmptyMedia variant="icon"><PackageCheckIcon /></EmptyMedia>
              <EmptyTitle>No repositories configured</EmptyTitle>
              <EmptyDescription>Add your first private repository with the form.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Repository</TableHead>
                <TableHead className="hidden md:table-cell">Added</TableHead>
                <TableHead className="hidden sm:table-cell">Updated</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {repos.map((repo) => (
                <TableRow key={repo.repo}>
                  <TableCell>{repo.repo}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-muted-foreground">{formatDate(repo.created_at)}</span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span className="text-muted-foreground">{formatDate(repo.updated_at)}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon-sm" aria-label={`Remove ${repo.repo}`}>
                          <Trash2Icon data-icon="inline-start" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogMedia><AlertTriangleIcon /></AlertDialogMedia>
                          <AlertDialogTitle>Remove repository access?</AlertDialogTitle>
                          <AlertDialogDescription>
                            The token for {repo.repo} will be deleted from Cloudflare KV. Private release downloads will stop working immediately.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction variant="destructive" onClick={() => void handleDelete(repo.repo)}>
                            Remove token
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function Analytics({ stats, loading }: { stats: RepoStatsSummary[]; loading: boolean }) {
  const totals = useMemo(() => {
    const downloads = stats.reduce((sum, item) => sum + item.total_downloads, 0);
    const assets = stats.reduce((sum, item) => sum + item.assets.length, 0);
    const top = [...stats].sort((a, b) => b.total_downloads - a.total_downloads)[0];
    return { downloads, assets, top };
  }, [stats]);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card size="sm">
          <CardHeader>
            <CardTitle>Total downloads</CardTitle>
            <CardDescription>Across proxied assets</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-3xl font-semibold tracking-tight">
              {loading ? <Skeleton className="h-9 w-24" /> : compactNumber(totals.downloads)}
            </p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>Tracked assets</CardTitle>
            <CardDescription>With recorded activity</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-3xl font-semibold tracking-tight">
              {loading ? <Skeleton className="h-9 w-20" /> : compactNumber(totals.assets)}
            </p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>Top repository</CardTitle>
            <CardDescription>By proxy downloads</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="truncate font-heading text-lg font-semibold">
              {loading ? <Skeleton className="h-7 w-32" /> : totals.top?.repo ?? "No data"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Download statistics</CardTitle>
          <CardDescription>Aggregated from download events recorded in Cloudflare KV.</CardDescription>
          <CardAction><Badge variant="outline">{stats.length} repositories</Badge></CardAction>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col gap-3">
              {[0, 1, 2].map((item) => <Skeleton key={item} className="h-10 w-full" />)}
            </div>
          ) : stats.length === 0 ? (
            <Empty className="min-h-56 border">
              <EmptyHeader>
                <EmptyMedia variant="icon"><BarChart3Icon /></EmptyMedia>
                <EmptyTitle>No download activity yet</EmptyTitle>
                <EmptyDescription>Statistics appear after an asset is downloaded through the proxy.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Repository</TableHead>
                  <TableHead>Downloads</TableHead>
                  <TableHead className="hidden sm:table-cell">Top asset</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.map((summary) => {
                  const topAsset = [...summary.assets].sort((a, b) => b.count - a.count)[0];
                  return (
                    <TableRow key={summary.repo}>
                      <TableCell>{summary.repo}</TableCell>
                      <TableCell><Badge>{compactNumber(summary.total_downloads)}</Badge></TableCell>
                      <TableCell className="hidden max-w-80 sm:table-cell">
                        <div className="truncate text-muted-foreground" title={topAsset?.asset}>
                          {topAsset ? `${topAsset.asset} · ${compactNumber(topAsset.count)}` : "—"}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function AdminPage() {
  const [authState, setAuthState] = useState<"checking" | "signed-out" | "signed-in">("checking");
  const [adminToken, setAdminToken] = useState("");
  const [repos, setRepos] = useState<ConfiguredRepo[]>([]);
  const [stats, setStats] = useState<RepoStatsSummary[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const signOut = useCallback((message?: string) => {
    sessionStorage.removeItem(tokenStorageKey);
    setAdminToken("");
    setAuthState("signed-out");
    setRepos([]);
    setStats([]);
    if (message) toast.error(message);
  }, []);

  const loadData = useCallback(async () => {
    if (!adminToken) return;
    setLoadingData(true);
    try {
      const [nextRepos, nextStats] = await Promise.all([
        getConfiguredRepos(adminToken),
        getStats(adminToken),
      ]);
      setRepos(nextRepos);
      setStats(nextStats);
    } catch (reason) {
      if (reason instanceof ApiError && (reason.status === 401 || reason.status === 403)) {
        signOut("Your admin session expired. Please authenticate again.");
      } else {
        toast.error(reason instanceof Error ? reason.message : "Unable to load admin data.");
      }
    } finally {
      setLoadingData(false);
    }
  }, [adminToken, signOut]);

  useEffect(() => {
    document.title = "Admin · FireRepoDownloader";
    const storedToken = sessionStorage.getItem(tokenStorageKey);
    if (!storedToken) {
      setAuthState("signed-out");
      return;
    }

    const controller = new AbortController();
    verifyAdmin(storedToken, controller.signal)
      .then(() => {
        setAdminToken(storedToken);
        setAuthState("signed-in");
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        sessionStorage.removeItem(tokenStorageKey);
        setAuthState("signed-out");
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (authState === "signed-in" && adminToken) void loadData();
  }, [adminToken, authState, loadData]);

  if (authState === "checking") return <AdminChecking />;
  if (authState === "signed-out") {
    return (
      <AdminLogin
        onAuthenticated={(token) => {
          setAdminToken(token);
          setAuthState("signed-in");
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-3">
          <Badge variant="secondary" className="w-fit">
            <ShieldCheckIcon data-icon="inline-start" />
            Authenticated
          </Badge>
          <div className="flex flex-col gap-2">
            <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Admin workspace</h1>
            <p className="max-w-2xl text-muted-foreground">
              Manage repository credentials and monitor proxied download activity from one place.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void loadData()} disabled={loadingData}>
            {loadingData ? <Spinner data-icon="inline-start" /> : <RefreshCwIcon data-icon="inline-start" />}
            Refresh
          </Button>
          <Button variant="ghost" onClick={() => signOut()}>
            <LogOutIcon data-icon="inline-start" />
            Sign out
          </Button>
        </div>
      </section>

      <Alert>
        <ShieldCheckIcon />
        <AlertTitle>Credentials stay on the server</AlertTitle>
        <AlertDescription>
          GitHub tokens are stored in Cloudflare KV and are only attached to GitHub API and asset requests inside the Worker.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="repositories" className="flex flex-col gap-4">
        <TabsList>
          <TabsTrigger value="repositories">
            <PackageCheckIcon data-icon="inline-start" />
            Repositories
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <DownloadIcon data-icon="inline-start" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="repositories">
          <div className="grid items-start gap-4 lg:grid-cols-[0.8fr_1.2fr]">
            <RepoTokenForm adminToken={adminToken} onSaved={loadData} />
            <RepositoriesTable
              adminToken={adminToken}
              repos={repos}
              loading={loadingData}
              onChanged={loadData}
            />
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <Analytics stats={stats} loading={loadingData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
