import { useState } from "react";
import {
  ArrowRightIcon,
  CloudDownloadIcon,
  GitForkIcon,
  KeyRoundIcon,
  PackageSearchIcon,
  ShieldCheckIcon,
  SparklesIcon,
  ZapIcon,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";
import { repoPath } from "@/lib/api";

function parseRepository(value: string): { owner: string; repo: string } | null {
  const normalized = value
    .trim()
    .replace(/^https?:\/\/(?:www\.)?github\.com\//i, "")
    .replace(/\.git$/i, "")
    .replace(/^\/+|\/+$/g, "");
  const [owner, repo, ...rest] = normalized.split("/");

  if (!owner || !repo || rest.length > 0 || !/^[\w.-]+$/.test(owner) || !/^[\w.-]+$/.test(repo)) {
    return null;
  }

  return { owner, repo };
}

const features = [
  {
    icon: CloudDownloadIcon,
    title: "Direct asset streaming",
    description: "Release files are streamed through the edge without buffering the full payload.",
    badge: "Low latency",
  },
  {
    icon: KeyRoundIcon,
    title: "Private repository access",
    description: "Repository-scoped GitHub tokens stay in Cloudflare KV and never reach the browser.",
    badge: "Secure by design",
  },
  {
    icon: ZapIcon,
    title: "Release-aware routing",
    description: "Browse tagged releases or resolve latest and pre-release assets with stable URLs.",
    badge: "Automation ready",
  },
];

export function HomePage() {
  const navigate = useNavigate();
  const [repository, setRepository] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseRepository(repository);

    if (!parsed) {
      setError("Enter a repository as owner/repo or paste its GitHub URL.");
      return;
    }

    setError("");
    navigate(repoPath(parsed.owner, parsed.repo));
  }

  return (
    <div className="flex flex-col gap-16">
      <section className="flex flex-col items-center gap-8 py-8 text-center sm:py-14">
        <Badge variant="outline">
          <SparklesIcon data-icon="inline-start" />
          GitHub releases, delivered from the edge
        </Badge>

        <div className="flex max-w-4xl flex-col items-center gap-5">
          <h1 className="font-heading text-4xl leading-tight font-semibold tracking-tight text-balance sm:text-6xl">
            Find the release. Get the asset. <span className="text-primary">Skip the friction.</span>
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg">
            Browse public or private GitHub releases and stream their assets through a fast,
            predictable Cloudflare download endpoint.
          </p>
        </div>

        <Card className="w-full max-w-3xl text-left">
          <CardHeader>
            <CardTitle>Browse a repository</CardTitle>
            <CardDescription>Use the canonical owner/repository name or paste a GitHub URL.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} noValidate>
              <FieldGroup>
                <Field data-invalid={error ? true : undefined}>
                  <FieldLabel htmlFor="repository" className="sr-only">
                    GitHub repository
                  </FieldLabel>
                  <InputGroup className="h-11">
                    <InputGroupInput
                      id="repository"
                      value={repository}
                      onChange={(event) => {
                        setRepository(event.target.value);
                        if (error) setError("");
                      }}
                      placeholder="cloudflare/workers-sdk"
                      autoComplete="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      aria-invalid={error ? true : undefined}
                    />
                    <InputGroupAddon align="inline-start">
                      <GitForkIcon />
                    </InputGroupAddon>
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton type="submit" variant="default" size="sm">
                        Browse
                        <ArrowRightIcon data-icon="inline-end" />
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                  {error ? (
                    <FieldError>{error}</FieldError>
                  ) : (
                    <FieldDescription>
                      Try{" "}
                      <button
                        type="button"
                        className="font-medium text-foreground underline-offset-4 hover:underline"
                        onClick={() => setRepository("cloudflare/workers-sdk")}
                      >
                        cloudflare/workers-sdk
                      </button>
                    </FieldDescription>
                  )}
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <ShieldCheckIcon className="size-4" aria-hidden="true" />
            Tokens stay server-side
          </span>
          <Separator orientation="vertical" className="hidden h-4 sm:block" />
          <span className="flex items-center gap-1.5">
            <PackageSearchIcon className="size-4" aria-hidden="true" />
            No account required to browse
          </span>
        </div>
      </section>

      <section className="flex flex-col gap-6" aria-labelledby="capabilities-title">
        <div className="flex flex-col gap-2">
          <Badge variant="secondary" className="w-fit">Core capabilities</Badge>
          <h2 id="capabilities-title" className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            A clean path from release to download
          </h2>
          <p className="max-w-2xl text-muted-foreground">
            Designed for people browsing manually and systems that need stable, scriptable asset URLs.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {features.map(({ icon: Icon, title, description, badge }) => (
            <Card key={title}>
              <CardHeader>
                <span className="mb-2 flex size-9 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant="outline">{badge}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>One URL pattern, every release</CardTitle>
            <CardDescription>
              Keep download links readable while the Worker handles GitHub authentication and redirects.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="rounded-lg bg-muted p-4 font-mono text-sm break-all text-muted-foreground">
              /download/:owner/:repo/:tag/:asset
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge>latest</Badge>
              <Badge variant="secondary">pre-release</Badge>
              <Badge variant="outline">any tag</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ready for private repositories</CardTitle>
            <CardDescription>
              Authenticate in the Admin workspace, add a repository-scoped token, and browse normally.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <Link to="/admin">
                Open Admin
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
