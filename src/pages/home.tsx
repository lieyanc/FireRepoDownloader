import { useEffect, useState } from "react";
import { ArrowRightIcon, HistoryIcon, SparklesIcon, XIcon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Field, FieldError } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { repoPath } from "@/lib/api";
import { forgetRepo, getRecentRepos } from "@/lib/recent";
import { parseRepository, type RepoRef } from "@/lib/repo";

const suggestions: RepoRef[] = [
  { owner: "oven-sh", repo: "bun" },
  { owner: "denoland", repo: "deno" },
  { owner: "cli", repo: "cli" },
];

export function HomePage() {
  const navigate = useNavigate();
  const [repository, setRepository] = useState("");
  const [error, setError] = useState("");
  const [recent, setRecent] = useState<RepoRef[]>([]);

  useEffect(() => {
    document.title = "FireRepoDownloader";
    setRecent(getRecentRepos());
  }, []);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseRepository(repository);

    if (!parsed) {
      setError("Use owner/repository or a GitHub URL.");
      return;
    }

    setError("");
    navigate(repoPath(parsed.owner, parsed.repo));
  }

  const shortcuts = recent.length > 0 ? recent : suggestions;

  return (
    <section className="my-auto flex flex-col items-center gap-10 py-16 text-center sm:py-24">
      <h1 className="max-w-3xl font-heading text-4xl leading-[1.05] font-semibold tracking-[-0.04em] text-balance sm:text-6xl">
        GitHub releases, <span className="text-brand">directly</span>.
      </h1>

      <form className="w-full max-w-xl text-left" onSubmit={handleSubmit} noValidate>
        <Field data-invalid={error ? true : undefined}>
          <InputGroup className="h-12 rounded-xl">
            <InputGroupInput
              id="repository"
              value={repository}
              onChange={(event) => {
                setRepository(event.target.value);
                if (error) setError("");
              }}
              className="text-base"
              placeholder="owner/repository"
              aria-label="GitHub repository"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              autoFocus
              aria-invalid={error ? true : undefined}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton type="submit" variant="default" size="sm">
                Browse
                <ArrowRightIcon data-icon="inline-end" />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          {error && <FieldError>{error}</FieldError>}
        </Field>
      </form>

      <div className="flex max-w-2xl flex-wrap items-center justify-center gap-2">
        <span className="flex items-center gap-1.5 pr-1 text-xs text-muted-foreground">
          {recent.length > 0 ? (
            <HistoryIcon className="size-3.5" aria-hidden="true" />
          ) : (
            <SparklesIcon className="size-3.5" aria-hidden="true" />
          )}
          {recent.length > 0 ? "Recent" : "Try"}
        </span>

        {shortcuts.map((entry) => (
          <span key={`${entry.owner}/${entry.repo}`} className="group/chip relative">
            <Button variant="outline" size="sm" asChild>
              <Link to={repoPath(entry.owner, entry.repo)}>
                <span>
                  {entry.owner}
                  <span className="text-muted-foreground">/</span>
                  {entry.repo}
                </span>
              </Link>
            </Button>
            {recent.length > 0 && (
              <Button
                variant="secondary"
                size="icon-xs"
                aria-label={`Remove ${entry.owner}/${entry.repo} from recent`}
                className="absolute -top-2 -right-2 opacity-0 transition-opacity group-hover/chip:opacity-100 focus-visible:opacity-100"
                onClick={() => setRecent(forgetRepo(entry.owner, entry.repo))}
              >
                <XIcon />
              </Button>
            )}
          </span>
        ))}
      </div>
    </section>
  );
}
