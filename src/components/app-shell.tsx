import { Suspense, useEffect, useState } from "react";
import { FlameIcon, MonitorIcon, MoonIcon, SearchIcon, SunIcon } from "lucide-react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Skeleton } from "@/components/ui/skeleton";
import { repoPath } from "@/lib/api";
import { parseRepository } from "@/lib/repo";

function RouteFallback() {
  return (
    <div className="flex flex-col gap-4" aria-label="Loading">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-10 w-72 max-w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

function ThemeMenu() {
  const [mounted, setMounted] = useState(false);
  const { theme, resolvedTheme, setTheme } = useTheme();

  useEffect(() => setMounted(true), []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Change theme">
          {mounted && resolvedTheme === "dark" ? <MoonIcon /> : <SunIcon />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
          <DropdownMenuRadioItem value="light">
            <SunIcon data-icon="inline-start" />
            Light
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            <MoonIcon data-icon="inline-start" />
            Dark
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">
            <MonitorIcon data-icon="inline-start" />
            System
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function RepoSwitcher() {
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const [invalid, setInvalid] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseRepository(value);

    if (!parsed) {
      setInvalid(true);
      return;
    }

    setValue("");
    setInvalid(false);
    navigate(repoPath(parsed.owner, parsed.repo));
  }

  return (
    <form className="hidden w-full max-w-72 md:block" onSubmit={handleSubmit} noValidate>
      <InputGroup>
        <InputGroupInput
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            if (invalid) setInvalid(false);
          }}
          placeholder="Jump to owner/repository"
          aria-label="Jump to a repository"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          aria-invalid={invalid || undefined}
        />
        <InputGroupAddon align="inline-start">
          <SearchIcon />
        </InputGroupAddon>
      </InputGroup>
    </form>
  );
}

export function AppShell() {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith("/admin");
  // The switcher only earns its place while browsing a repository.
  const showSwitcher = pathname !== "/" && !isAdmin;

  return (
    <div className="relative flex min-h-svh flex-col">
      <div className="brand-wash" aria-hidden="true" />

      <header className="sticky top-0 z-40 border-b bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-3 px-4 sm:px-6">
          <Link
            className="flex shrink-0 items-center gap-2 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            to="/"
            aria-label="FireRepoDownloader home"
          >
            <span className="flex size-7 items-center justify-center rounded-lg bg-brand text-brand-foreground">
              <FlameIcon className="size-4" aria-hidden="true" />
            </span>
            <span className="hidden font-heading text-sm font-semibold tracking-tight sm:inline">
              FireRepoDownloader
            </span>
          </Link>

          <div className="flex flex-1 justify-center">{showSwitcher && <RepoSwitcher />}</div>

          <nav className="flex shrink-0 items-center gap-1" aria-label="Main">
            <Button variant={isAdmin ? "secondary" : "ghost"} size="sm" asChild>
              <Link to="/admin" aria-current={isAdmin ? "page" : undefined}>
                Admin
              </Link>
            </Button>
            <ThemeMenu />
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10">
        <Suspense fallback={<RouteFallback />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
