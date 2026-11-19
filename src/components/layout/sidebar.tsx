import { useQuery } from "@tanstack/react-query";
import {
  Activity as ActivityIcon,
  Bell,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  FolderKanban,
  FolderOpen,
  HardDrive,
  LayoutDashboard,
  Library,
  LogOut,
  Microscope,
  NotebookPen,
  Rss,
  Search,
  Settings,
  SquareCheckBig,
  UserRound,
  X,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Logo } from "@/components/shared/logo";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/format";
import { STORAGE_LIMIT_BYTES } from "@/lib/constants";
import { queryKeys } from "@/lib/query-keys";
import { useAuthStore } from "@/store/auth-store";
import { useUiStore } from "@/store/ui-store";
import { settingsApi } from "@/features/settings/api";
import { tasksApi } from "@/features/tasks/api";
import { filesApi } from "@/features/files/api";

interface NavItem {
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
  badge?: number;
}

const workspaceNav = (pendingTasks: number): NavItem[] => [
  { label: "Overview", to: "/app", icon: LayoutDashboard, end: true },
  { label: "Research Log", to: "/app/log", icon: Microscope },
  { label: "Research Feed", to: "/app/feed", icon: Rss },
  { label: "Projects", to: "/app/projects", icon: FolderKanban },
  {
    label: "Tasks & Milestones",
    to: "/app/tasks",
    icon: SquareCheckBig,
    badge: pendingTasks,
  },
  { label: "Notebooks", to: "/app/notebooks", icon: NotebookPen },
  { label: "Research Library", to: "/app/library", icon: Library },
  { label: "Files", to: "/app/files", icon: FolderOpen },
];

const manageNav: NavItem[] = [
  { label: "Notifications", to: "/app/notifications", icon: Bell },
  { label: "Activity", to: "/app/activity", icon: ActivityIcon },
  { label: "Settings", to: "/app/settings", icon: Settings },
];

function SidebarLink({
  item,
  collapsed,
  onNavigate,
  active,
}: {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: () => void;
  active: boolean;
}) {
  const Icon = item.icon;
  const link = (
    <Link
      to={item.to}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn("sidebar-link group", active && "sidebar-link-active", collapsed && "justify-center px-0")}
    >
      {active && (
        <span className="absolute inset-y-1.5 left-0 w-[3px] rounded-r-full bg-teal-400" />
      )}
      <Icon
        className={cn(
          "size-[17px] shrink-0 transition-colors",
          active ? "text-teal-300" : "text-sidebar-muted group-hover:text-white/90",
        )}
      />
      {!collapsed && <span className="truncate">{item.label}</span>}
      {!collapsed && item.badge !== undefined && item.badge > 0 && (
        <span className="ml-auto rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-white/80">
          {item.badge}
        </span>
      )}
    </Link>
  );

  if (!collapsed) return link;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right" className="ml-1">
        {item.label}
        {item.badge ? ` · ${item.badge}` : ""}
      </TooltipContent>
    </Tooltip>
  );
}

export function SidebarContent({
  collapsed = false,
  onNavigate,
  onToggleCollapse,
  mobile = false,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
  onToggleCollapse?: () => void;
  mobile?: boolean;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const setCommandOpen = useUiStore((state) => state.setCommandOpen);
  const signOut = useAuthStore((state) => state.signOut);

  const { data: profile } = useQuery({
    queryKey: queryKeys.profile,
    queryFn: settingsApi.profile,
  });
  const { data: workspace } = useQuery({
    queryKey: queryKeys.workspace,
    queryFn: settingsApi.workspace,
  });
  const { data: tasks = [] } = useQuery({
    queryKey: queryKeys.tasks,
    queryFn: tasksApi.list,
  });
  const { data: files = [] } = useQuery({
    queryKey: queryKeys.files,
    queryFn: filesApi.list,
  });

  const pendingTasks = tasks.filter((task) => task.status !== "completed").length;
  const storageUsed = files.reduce((sum, file) => sum + file.size, 0);
  const storagePercent = Math.min((storageUsed / STORAGE_LIMIT_BYTES) * 100, 100);

  const isActive = (item: NavItem) =>
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to);

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div
        className={cn(
          "flex h-16 shrink-0 items-center border-b border-white/[0.07]",
          collapsed ? "justify-center px-3" : "justify-between px-4",
        )}
      >
        <Link
          to="/app"
          onClick={onNavigate}
          className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
          aria-label="ResearchOS workspace home"
        >
          <Logo inverted compact={collapsed} />
        </Link>
        {mobile && (
          <button
            type="button"
            onClick={onNavigate}
            className="rounded-md p-1.5 text-sidebar-muted transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close navigation"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <div className={cn("shrink-0 pt-3", collapsed ? "px-2" : "px-3")}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg border border-white/[0.07] bg-white/[0.04] p-2 text-left transition-colors hover:bg-white/[0.08] focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-0",
                collapsed && "justify-center border-transparent bg-transparent p-1.5",
              )}
              aria-label="Switch workspace"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-teal-600/90 text-[11px] font-bold text-white">
                NC
              </span>
              {!collapsed && (
                <>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] font-medium text-white">
                      {workspace?.name ?? "Northlight Cognition Lab"}
                    </span>
                    <span className="block truncate text-[10.5px] text-sidebar-muted">
                      {workspace?.plan ?? "Research Lab"} workspace
                    </span>
                  </span>
                  <ChevronDown className="size-3.5 shrink-0 text-sidebar-muted" />
                </>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64" sideOffset={8}>
            <DropdownMenuLabel>Current workspace</DropdownMenuLabel>
            <div className="px-2.5 pb-2">
              <p className="text-[13px] font-semibold">{workspace?.name}</p>
              <p className="text-[11px] text-muted-foreground">
                {workspace?.description}
              </p>
              <span className="mt-2 inline-flex rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-medium text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
                Demo data · stored locally
              </span>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                onNavigate?.();
                navigate("/app/settings?tab=workspace");
              }}
            >
              <Settings />
              Workspace settings
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className={cn("mt-2", collapsed && "flex justify-center")}>
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setCommandOpen(true)}
                  className="flex size-9 items-center justify-center rounded-lg text-sidebar-muted transition-colors hover:bg-white/[0.07] hover:text-white"
                  aria-label="Search workspace"
                >
                  <Search className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="ml-1">
                Search · Ctrl K
              </TooltipContent>
            </Tooltip>
          ) : (
            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              className="flex w-full items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-1.5 text-[11.5px] text-sidebar-muted transition-colors hover:border-white/10 hover:bg-white/[0.06] hover:text-white/80"
            >
              <Search className="size-3.5" />
              <span className="flex-1 text-left">Search…</span>
              <kbd className="rounded border border-white/10 bg-white/5 px-1 py-0.5 text-[9px] font-medium">
                Ctrl K
              </kbd>
            </button>
          )}
        </div>
      </div>

      <nav
        className={cn(
          "flex-1 overflow-y-auto overflow-x-hidden py-4 scrollbar-thin",
          collapsed ? "px-2" : "px-3",
        )}
        aria-label="Primary navigation"
      >
        {!collapsed && (
          <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/30">
            Workspace
          </p>
        )}
        <div className="space-y-0.5">
          {workspaceNav(pendingTasks).map((item) => (
            <SidebarLink
              key={item.to}
              item={item}
              collapsed={collapsed}
              onNavigate={onNavigate}
              active={isActive(item)}
            />
          ))}
        </div>

        <div className={cn("mb-1.5 mt-5", collapsed ? "px-0" : "px-2.5")}>
          {!collapsed ? (
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/30">
              Manage
            </p>
          ) : (
            <div className="mx-auto mb-2 h-px w-6 bg-white/10" />
          )}
        </div>
        <div className="space-y-0.5">
          {manageNav.map((item) => (
            <SidebarLink
              key={item.to}
              item={item}
              collapsed={collapsed}
              onNavigate={onNavigate}
              active={isActive(item)}
            />
          ))}
        </div>
      </nav>

      {!collapsed && (
        <div className="mx-3 mb-3 rounded-lg border border-white/[0.07] bg-white/[0.03] p-3">
          <div className="flex items-center justify-between text-[10.5px]">
            <span className="flex items-center gap-1.5 font-medium text-white/70">
              <HardDrive className="size-3" /> Storage
            </span>
            <span className="tabular-nums text-sidebar-muted">
              {formatBytes(storageUsed, 0)} / {formatBytes(STORAGE_LIMIT_BYTES, 0)}
            </span>
          </div>
          <Progress
            value={storagePercent}
            className="mt-2 h-1 bg-white/10"
            indicatorClassName="bg-teal-400"
          />
          <Link
            to="/app/files"
            onClick={onNavigate}
            className="mt-1.5 block text-[10px] text-sidebar-muted transition-colors hover:text-white"
          >
            Manage files
          </Link>
        </div>
      )}

      <div
        className={cn(
          "flex shrink-0 items-center gap-1 border-t border-white/[0.07] py-2.5",
          collapsed ? "flex-col px-2" : "px-3",
        )}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex min-w-0 flex-1 items-center gap-2.5 rounded-lg p-1.5 text-left transition-colors hover:bg-white/[0.06] focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-0",
                collapsed && "flex-none justify-center",
              )}
              aria-label="Account menu"
            >
              <Avatar className="size-8 ring-1 ring-white/15">
                <AvatarFallback
                  style={{ backgroundColor: profile?.avatarColor ?? "#0D9488" }}
                  className="text-[11px] font-semibold text-white"
                >
                  {profile?.initials ?? "MC"}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12px] font-medium text-white">
                    {profile?.name ?? "Dr. Maya Chen"}
                  </span>
                  <span className="block truncate text-[10px] text-sidebar-muted">
                    {profile?.role ?? "Principal Investigator"}
                  </span>
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top" className="w-60">
            <DropdownMenuLabel className="normal-case tracking-normal">
              <span className="block text-[12.5px] font-semibold">{profile?.name}</span>
              <span className="block truncate text-[11px] font-normal text-muted-foreground">
                {profile?.email}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                onNavigate?.();
                navigate("/app/settings?tab=profile");
              }}
            >
              <UserRound />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                onNavigate?.();
                navigate("/app/settings");
              }}
            >
              <Settings />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              destructive
              onSelect={() => {
                signOut();
                navigate("/");
              }}
            >
              <LogOut />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {!mobile && onToggleCollapse && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onToggleCollapse}
                className="flex size-8 shrink-0 items-center justify-center rounded-md text-sidebar-muted transition-colors hover:bg-white/[0.07] hover:text-white"
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {collapsed ? (
                  <ChevronsRight className="size-4" />
                ) : (
                  <ChevronsLeft className="size-4" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="ml-1">
              {collapsed ? "Expand sidebar" : "Collapse sidebar"}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}

export function Sidebar() {
  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 hidden shrink-0 border-r border-black/20 transition-[width] duration-200 ease-out lg:block",
        collapsed ? "w-[76px]" : "w-[260px]",
      )}
    >
      <SidebarContent collapsed={collapsed} onToggleCollapse={toggleSidebar} />
    </aside>
  );
}
