import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/app-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const AdminPage = lazy(() => import("@/pages/admin").then((module) => ({ default: module.AdminPage })));
const HomePage = lazy(() => import("@/pages/home").then((module) => ({ default: module.HomePage })));
const NotFoundPage = lazy(() =>
  import("@/pages/not-found").then((module) => ({ default: module.NotFoundPage })),
);
const ReleasePage = lazy(() =>
  import("@/pages/release").then((module) => ({ default: module.ReleasePage })),
);
const RepoPage = lazy(() => import("@/pages/repo").then((module) => ({ default: module.RepoPage })));

function RouteLoading() {
  return (
    <div className="flex flex-col gap-4" aria-label="Loading page">
      <Skeleton className="h-5 w-48" />
      <Skeleton className="h-10 w-80 max-w-full" />
      <Skeleton className="h-56 w-full" />
    </div>
  );
}

export function App() {
  return (
    <TooltipProvider>
      <Suspense fallback={<RouteLoading />}>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<HomePage />} />
            <Route path="admin" element={<AdminPage />} />
            <Route path=":owner/:repo" element={<RepoPage />} />
            <Route path=":owner/:repo/:tag" element={<ReleasePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
      <Toaster richColors closeButton />
    </TooltipProvider>
  );
}
