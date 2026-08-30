import { useEffect, useState } from "react";
import { FlameIcon, GitForkIcon, MoonIcon, ShieldCheckIcon, SunIcon } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={isDark ? "Use light theme" : "Use dark theme"}
          onClick={() => setTheme(isDark ? "light" : "dark")}
        >
          {isDark ? <SunIcon data-icon="inline-start" /> : <MoonIcon data-icon="inline-start" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{isDark ? "Light theme" : "Dark theme"}</TooltipContent>
    </Tooltip>
  );
}

export function AppShell() {
  const { pathname } = useLocation();
  const isAdmin = pathname === "/admin";
  const isHome = pathname === "/";

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 border-b bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link className="flex min-w-0 items-center gap-2.5" to="/" aria-label="FireRepoDownloader home">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <FlameIcon className="size-5" aria-hidden="true" />
            </span>
            <span className="hidden truncate font-heading text-base font-semibold tracking-tight sm:inline">
              FireRepoDownloader
            </span>
          </Link>

          <nav className="flex items-center gap-1" aria-label="Main navigation">
            <Button variant={isHome ? "secondary" : "ghost"} size="sm" asChild>
              <Link to="/">
                <GitForkIcon data-icon="inline-start" />
                Browse
              </Link>
            </Button>
            <Button variant={isAdmin ? "secondary" : "ghost"} size="sm" asChild>
              <Link to="/admin">
                <ShieldCheckIcon data-icon="inline-start" />
                Admin
              </Link>
            </Button>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-12">
        <Outlet />
      </main>

      <footer className="mt-auto">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <Separator />
          <div className="flex flex-col gap-2 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>GitHub release delivery, accelerated by Cloudflare Workers.</p>
            <p className="flex items-center gap-1.5">
              <SunIcon className="size-3.5" aria-hidden="true" />
              Built for fast, direct downloads.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
