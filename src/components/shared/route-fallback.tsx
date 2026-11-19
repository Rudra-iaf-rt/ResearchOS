import { CardGridSkeleton, PageHeaderSkeleton } from "@/components/shared/skeletons";
import { Logo } from "@/components/shared/logo";

/**
 * Shown while a lazily loaded workspace page is being fetched. It mirrors the
 * common page rhythm (header + card grid) so route transitions stay calm.
 */
export function RouteFallback() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading page</span>
      <PageHeaderSkeleton />
      <CardGridSkeleton count={6} />
    </div>
  );
}

/** Full-screen fallback for lazily loaded public routes. */
export function ScreenFallback() {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-background"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Loading ResearchOS</span>
      <div className="animate-pulse">
        <Logo />
      </div>
    </div>
  );
}
