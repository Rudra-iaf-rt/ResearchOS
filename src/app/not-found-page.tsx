import { ArrowLeft, Compass, Search } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";

export function NotFoundPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const session = useAuthStore((state) => state.session);
  const inWorkspace = location.pathname.startsWith("/app");
  const destination = inWorkspace ? "/app" : session ? "/app" : "/";

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <div
        className="pointer-events-none absolute inset-0 bg-radial-fade"
        aria-hidden="true"
      />
      <header className="relative flex items-center justify-between px-5 py-5 sm:px-8">
        <Logo />
        {session && (
          <Button variant="outline" size="sm" onClick={() => navigate("/app")}>
            <ArrowLeft className="size-4" />
            Back to workspace
          </Button>
        )}
      </header>

      <main className="relative flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-lg text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-border bg-card text-teal-700 shadow-subtle dark:text-teal-300">
            <Compass className="size-7" />
          </span>
          <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Error 404
          </p>
          <h1 className="mt-2 text-[30px] font-semibold tracking-[-0.04em] sm:text-[36px]">
            This page is outside the notebook.
          </h1>
          <p className="mx-auto mt-3 max-w-md text-[13px] leading-relaxed text-muted-foreground">
            The link may be outdated, or the route may have moved. Your workspace and saved
            research are still exactly where you left them.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
            <Button asChild>
              <Link to={destination}>
                <ArrowLeft className="size-4" />
                {inWorkspace ? "Workspace overview" : session ? "Open workspace" : "Back to home"}
              </Link>
            </Button>
            {session && !inWorkspace && (
              <Button variant="outline" asChild>
                <Link to="/app">
                  <Search className="size-4" />
                  Explore the demo
                </Link>
              </Button>
            )}
            {!session && (
              <Button variant="outline" asChild>
                <Link to="/login">Open demo workspace</Link>
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
