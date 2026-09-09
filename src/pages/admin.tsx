import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChartColumnIcon,
  EyeIcon,
  EyeOffIcon,
  LogOutIcon,
  PackageCheckIcon,
  PlusIcon,
  RefreshCwIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
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
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
import { parseRepository } from "@/lib/repo";
import type { RepoStatsSummary } from "@/types";

const tokenStorageKey = "fire_admin_token";

function SecretInput({
  id,
  value,
  onChange,
  placeholder,
  autoComplete,
  disabled,
  invalid,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoComplete: string;
  disabled?: boolean;
  invalid?: boolean;
}) {
  const [revealed, setRevealed] = useState(false);

  return (
    <InputGroup>
      <InputGroupInput
        id={id}
        type={revealed ? "text" : "password"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        autoCapitalize="none"
        spellCheck={false}
        disabled={disabled}
        aria-invalid={invalid || undefined}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          size="icon-xs"
          aria-label={revealed ? "Hide token" : "Show token"}
          onClick={() => setRevealed((current) => !current)}
        >
          {revealed ? <EyeOffIcon /> : <EyeIcon />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}

function AdminLogin({ onAuthenticated }: { onAuthenticated: (token: string) => void }) {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const candidate = token.trim();

    if (!candidate) {
      setError("Enter your admin token.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await verifyAdmin(candidate);
      sessionStorage.setItem(tokenStorageKey, candidate);
      onAuthenticated(candidate);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Authentication failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="my-auto flex items-center justify-center py-12">
      <form className="w-full max-w-sm" onSubmit={handleSubmit} noValidate>
        <Card>
          <CardHeader>
            <CardTitle>Admin</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field data-invalid={error ? true : undefined}>
                <FieldLabel htmlFor="admin-token">Token</FieldLabel>
                <SecretInput
                  id="admin-token"
                  value={token}
                  onChange={(next) => {
                    setToken(next);
                    if (error) setError("");
                  }}
                  placeholder="ADMIN_TOKEN"
                  autoComplete="current-password"
                  disabled={submitting}
                  invalid={Boolean(error)}
                />
                {error && <FieldError>{error}</FieldError>}
              </Field>
            </FieldGroup>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Spinner data-icon="inline-start" />}
              Unlock
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

function AdminChecking() {
  return (
    <div className="my-auto flex items-center justify-center py-12" aria-label="Checking admin session">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <Skeleton className="h-5 w-16" />
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
        <CardFooter>
          <Skeleton className="h-8 w-full" />
        </CardFooter>
      </Card>
    </div>
  );
}

function RepoTokenForm({
  adminToken,
  onSaved,
}: {
  adminToken: string;
  onSaved: () => Promise<void>;
}) {
  const [repository, setRepository] = useState("");
  const [githubToken, setGithubToken] = useState("");
  const [repositoryError, setRepositoryError] = useState("");
  const [tokenError, setTokenError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseRepository(repository);
    const nextRepositoryError = parsed ? "" : "Use owner/repository.";
    const nextTokenError = githubToken.trim() ? "" : "Required.";
    setRepositoryError(nextRepositoryError);
    setTokenError(nextTokenError);

    if (!parsed || nextTokenError) return;

    setSaving(true);
    try {
      const result = await saveRepoToken(adminToken, parsed.owner, parsed.repo, githubToken.trim());
      setRepository("");
      setGithubToken("");
      toast.success(`Saved ${result.repo}.`);
      await onSaved();
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Unable to save the token.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Card>
        <CardHeader>
          <CardTitle>Add repository</CardTitle>
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
              </InputGroup>
              {repositoryError && <FieldError>{repositoryError}</FieldError>}
            </Field>

            <Field data-invalid={tokenError ? true : undefined}>
              <FieldLabel htmlFor="github-token">GitHub token</FieldLabel>
              <SecretInput
                id="github-token"
                value={githubToken}
                onChange={(next) => {
                  setGithubToken(next);
                  if (tokenError) setTokenError("");
                }}
                placeholder="github_pat_…"
                autoComplete="new-password"
                disabled={saving}
                invalid={Boolean(tokenError)}
              />
              {tokenError && <FieldError>{tokenError}</FieldError>}
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? <Spinner data-icon="inline-start" /> : <PlusIcon data-icon="inline-start" />}
            Save
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

function RepositoriesTable({
  adminToken,
  repos,
  loading,
  onChanged,
}: {
  adminToken: string;
  repos: ConfiguredRepo[];
  loading: boolean;
  onChanged: () => Promise<void>;
}) {
  async function handleDelete(repoName: string) {
    const parsed = parseRepository(repoName);
    if (!parsed) return;

    try {
      await removeRepoToken(adminToken, parsed.owner, parsed.repo);
      toast.success(`Removed ${repoName}.`);
      await onChanged();
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Unable to remove the token.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Repositories</CardTitle>
        <CardAction>
          <Badge variant="outline">{repos.length}</Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex flex-col gap-2">
            {[0, 1, 2].map((item) => (
              <Skeleton key={item} className="h-10 w-full" />
            ))}
          </div>
        ) : repos.length === 0 ? (
          <Empty className="min-h-48 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <PackageCheckIcon />
              </EmptyMedia>
              <EmptyTitle>Nothing configured</EmptyTitle>
              <EmptyDescription>Add a repository to unlock private downloads.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Repository</TableHead>
                <TableHead className="hidden md:table-cell">Added</TableHead>
                <TableHead className="hidden sm:table-cell">Updated</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {repos.map((repo) => (
                <TableRow key={repo.repo}>
                  <TableCell className="font-medium">{repo.repo}</TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {formatDate(repo.created_at)}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {formatDate(repo.updated_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Remove ${repo.repo}`}
                            >
                              <Trash2Icon />
                            </Button>
                          </AlertDialogTrigger>
                        </TooltipTrigger>
                        <TooltipContent>Remove</TooltipContent>
                      </Tooltip>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove {repo.repo}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Its token is deleted from KV and private downloads stop immediately.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            variant="destructive"
                            onClick={() => void handleDelete(repo.repo)}
                          >
                            Remove
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

function StatCard({ label, value, loading }: { label: string; value: string; loading: boolean }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="truncate font-heading text-2xl tabular-nums">
          {loading ? <Skeleton className="h-8 w-20" /> : value}
        </CardTitle>
      </CardHeader>
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
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Downloads" value={compactNumber(totals.downloads)} loading={loading} />
        <StatCard label="Tracked assets" value={compactNumber(totals.assets)} loading={loading} />
        <StatCard label="Top repository" value={totals.top?.repo ?? "—"} loading={loading} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Downloads by repository</CardTitle>
          <CardAction>
            <Badge variant="outline">{stats.length}</Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col gap-2">
              {[0, 1, 2].map((item) => (
                <Skeleton key={item} className="h-10 w-full" />
              ))}
            </div>
          ) : stats.length === 0 ? (
            <Empty className="min-h-48 border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ChartColumnIcon />
                </EmptyMedia>
                <EmptyTitle>No activity yet</EmptyTitle>
                <EmptyDescription>Counters start after the first download.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Repository</TableHead>
                  <TableHead className="hidden sm:table-cell">Top asset</TableHead>
                  <TableHead className="text-right">Downloads</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.map((summary) => {
                  const topAsset = [...summary.assets].sort((a, b) => b.count - a.count)[0];
                  return (
                    <TableRow key={summary.repo}>
                      <TableCell className="font-medium">{summary.repo}</TableCell>
                      <TableCell className="hidden max-w-80 sm:table-cell">
                        <div className="truncate text-muted-foreground" title={topAsset?.asset}>
                          {topAsset?.asset ?? "—"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {compactNumber(summary.total_downloads)}
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
        signOut("Session expired. Authenticate again.");
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
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-4">
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Admin</h1>
        <div className="flex items-center gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Reload admin data"
                onClick={() => void loadData()}
                disabled={loadingData}
              >
                <RefreshCwIcon className={loadingData ? "animate-spin" : undefined} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reload</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Sign out" onClick={() => signOut()}>
                <LogOutIcon />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Sign out</TooltipContent>
          </Tooltip>
        </div>
      </header>

      <Tabs defaultValue="repositories" className="gap-4">
        <TabsList variant="line">
          <TabsTrigger value="repositories">
            <PackageCheckIcon data-icon="inline-start" />
            Repositories
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <ChartColumnIcon data-icon="inline-start" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="repositories">
          <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
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
