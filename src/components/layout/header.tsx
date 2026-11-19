import { Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { CreateMenu } from "@/components/navigation/create-menu";
import { NotificationsMenu } from "@/components/navigation/notifications-menu";
import { HelpMenu } from "@/components/navigation/help-menu";
import { UserMenu } from "@/components/navigation/user-menu";
import { SyncIndicator } from "./sync-indicator";
import { useUiStore } from "@/store/ui-store";

export function Header() {
  const setMobileNavOpen = useUiStore((state) => state.setMobileNavOpen);
  const setCommandOpen = useUiStore((state) => state.setCommandOpen);

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/75">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Button
          variant="ghost"
          size="icon"
          className="-ml-1 shrink-0 text-muted-foreground lg:hidden"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open navigation menu"
        >
          <Menu className="size-5" />
        </Button>

        <div className="hidden min-w-0 md:block">
          <Breadcrumbs />
        </div>

        <div className="flex flex-1 items-center justify-end gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className="hidden h-9 w-[210px] items-center gap-2 rounded-lg border border-border bg-card px-3 text-left text-[12.5px] text-muted-foreground shadow-subtle transition-colors hover:border-navy-300 hover:text-foreground sm:flex lg:w-[250px] dark:hover:border-navy-500"
            aria-label="Open global search"
          >
            <Search className="size-3.5" />
            <span className="flex-1 truncate">Search workspace…</span>
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[9.5px] font-medium">
              Ctrl K
            </kbd>
          </button>

          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground sm:hidden"
            onClick={() => setCommandOpen(true)}
            aria-label="Open global search"
          >
            <Search className="size-[18px]" />
          </Button>

          <div className="mx-0.5 hidden h-5 w-px bg-border sm:block" />

          <SyncIndicator />
          <CreateMenu />
          <div className="flex items-center">
            <NotificationsMenu />
            <HelpMenu />
          </div>
          <div className="ml-1">
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
