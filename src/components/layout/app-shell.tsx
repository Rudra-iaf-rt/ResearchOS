import { Suspense, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Sidebar, SidebarContent } from "./sidebar";
import { Header } from "./header";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { RouteFallback } from "@/components/shared/route-fallback";
import { useCreateDialogs } from "@/components/navigation/create-dialogs-provider";
import { useUiStore } from "@/store/ui-store";

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return (
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    target.isContentEditable
  );
}

export function AppShell() {
  const location = useLocation();
  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  const mobileNavOpen = useUiStore((state) => state.mobileNavOpen);
  const setMobileNavOpen = useUiStore((state) => state.setMobileNavOpen);
  const commandOpen = useUiStore((state) => state.commandOpen);
  const setCommandOpen = useUiStore((state) => state.setCommandOpen);
  const { openCreate } = useCreateDialogs();

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname, setMobileNavOpen]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(!commandOpen);
        return;
      }

      // Quick capture. Ignore typing, modifier chords, and open dialogs.
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key.toLowerCase() !== "c") return;
      if (isTypingTarget(event.target)) return;
      if (document.querySelector('[role="dialog"][data-state="open"]')) return;
      event.preventDefault();
      openCreate("log");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [commandOpen, setCommandOpen, openCreate]);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent
          side="left"
          hideClose
          className="w-[280px] border-r-0 bg-sidebar p-0 text-sidebar-foreground"
        >
          <SheetTitle className="sr-only">Workspace navigation</SheetTitle>
          <SidebarContent
            mobile
            onNavigate={() => setMobileNavOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <div
        className="flex min-h-screen flex-col transition-[padding] duration-200 ease-out"
        style={
          {
            "--sidebar-width": collapsed ? "76px" : "260px",
          } as React.CSSProperties
        }
      >
        <div className="flex min-h-screen flex-col lg:pl-[var(--sidebar-width)]">
          <Header />
          <main className="flex-1">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
            >
              <Suspense fallback={<RouteFallback />}>
                <Outlet />
              </Suspense>
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
}
