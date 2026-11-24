import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Bell,
  BookPlus,
  Camera,
  CheckSquare,
  CloudUpload,
  FileText,
  FlaskConical,
  FolderKanban,
  FolderOpen,
  Library,
  Lightbulb,
  Loader2,
  Microscope,
  Network,
  NotebookPen,
  Rss,
  Scale,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  SquareCheckBig,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useUiStore } from "@/store/ui-store";
import { searchApi } from "@/features/search/api";
import { cn } from "@/lib/utils";
import type { SearchResultType } from "@/types/search";
import { useCreateDialogs, type CreateKind } from "./create-dialogs-provider";

interface CommandItem {
  id: string;
  label: string;
  sublabel?: string;
  group: string;
  icon: typeof Search;
  keywords?: string;
  action: () => void;
}

const typeIcons: Record<SearchResultType, typeof Search> = {
  project: FolderKanban,
  task: CheckSquare,
  notebook: NotebookPen,
  paper: Library,
  file: FileText,
};

export function CommandPalette() {
  const open = useUiStore((state) => state.commandOpen);
  const setOpen = useUiStore((state) => state.setCommandOpen);
  const navigate = useNavigate();
  const { openCreate } = useCreateDialogs();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const { data, isFetching } = useQuery({
    queryKey: ["search", query.trim()],
    queryFn: () => searchApi.search(query.trim()),
    enabled: open && query.trim().length > 1,
  });

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
    }
  }, [open]);

  const close = useCallback(() => setOpen(false), [setOpen]);

  const go = useCallback(
    (href: string) => {
      close();
      navigate(href);
    },
    [close, navigate],
  );

  const create = useCallback(
    (kind: CreateKind) => {
      close();
      window.setTimeout(() => openCreate(kind), 140);
    },
    [close, openCreate],
  );

  const commands = useMemo<CommandItem[]>(() => {
    const navigation: CommandItem[] = [
      {
        id: "nav-overview",
        label: "Overview",
        sublabel: "Dashboard",
        group: "Navigate",
        icon: Activity,
        action: () => go("/app"),
      },
      {
        id: "nav-projects",
        label: "Projects",
        group: "Navigate",
        icon: FolderKanban,
        action: () => go("/app/projects"),
      },
      {
        id: "nav-experiments",
        label: "Experiments",
        sublabel: "Parameters, runs, and results",
        group: "Navigate",
        icon: FlaskConical,
        action: () => go("/app/experiments"),
      },
      {
        id: "nav-hypotheses",
        label: "Hypotheses",
        sublabel: "Evidence and status board",
        group: "Navigate",
        icon: Lightbulb,
        action: () => go("/app/hypotheses"),
      },
      {
        id: "nav-decisions",
        label: "Decisions",
        sublabel: "ADR-style research records",
        group: "Navigate",
        icon: Scale,
        action: () => go("/app/decisions"),
      },
      {
        id: "nav-snapshots",
        label: "Research snapshots",
        sublabel: "Frozen project manifests",
        group: "Navigate",
        icon: Camera,
        action: () => go("/app/snapshots"),
      },
      {
        id: "nav-tasks",
        label: "Tasks & Milestones",
        group: "Navigate",
        icon: SquareCheckBig,
        action: () => go("/app/tasks"),
      },
      {
        id: "nav-notebooks",
        label: "Notebooks",
        group: "Navigate",
        icon: NotebookPen,
        action: () => go("/app/notebooks"),
      },
      {
        id: "nav-library",
        label: "Research Library",
        group: "Navigate",
        icon: Library,
        action: () => go("/app/library"),
      },
      {
        id: "nav-files",
        label: "Files",
        group: "Navigate",
        icon: FolderOpen,
        action: () => go("/app/files"),
      },
      {
        id: "nav-knowledge",
        label: "Knowledge Graph",
        sublabel: "Links between artifacts",
        group: "Navigate",
        icon: Network,
        action: () => go("/app/knowledge"),
      },
      {
        id: "nav-activity",
        label: "Activity",
        group: "Navigate",
        icon: Activity,
        action: () => go("/app/activity"),
      },
      {
        id: "nav-research-log",
        label: "Research Log",
        sublabel: "Daily research time",
        group: "Navigate",
        icon: Microscope,
        action: () => go("/app/log"),
      },
      {
        id: "nav-feed",
        label: "Research Feed",
        sublabel: "Timeline of research events",
        group: "Navigate",
        icon: Rss,
        action: () => go("/app/feed"),
      },
      {
        id: "nav-notifications",
        label: "Notifications",
        sublabel: "Mentions, reviews, and deadlines",
        group: "Navigate",
        icon: Bell,
        action: () => go("/app/notifications"),
      },
      {
        id: "nav-settings",
        label: "Settings",
        group: "Navigate",
        icon: Settings,
        action: () => go("/app/settings"),
      },
    ];

    const actions: CommandItem[] = [
      {
        id: "log-activity",
        label: "Log research activity",
        sublabel: "Quick capture · press C",
        group: "Quick actions",
        icon: Microscope,
        action: () => create("log"),
      },
      {
        id: "new-project",
        label: "New project",
        sublabel: "Start a research project",
        group: "Quick actions",
        icon: Sparkles,
        action: () => create("project"),
      },
      {
        id: "new-task",
        label: "New task",
        sublabel: "Capture the next action",
        group: "Quick actions",
        icon: CheckSquare,
        action: () => create("task"),
      },
      {
        id: "new-notebook",
        label: "New notebook",
        sublabel: "Open a writing space",
        group: "Quick actions",
        icon: NotebookPen,
        action: () => create("notebook"),
      },
      {
        id: "new-paper",
        label: "Add research paper",
        sublabel: "Save a citation",
        group: "Quick actions",
        icon: BookPlus,
        action: () => create("paper"),
      },
      {
        id: "upload",
        label: "Upload file",
        sublabel: "Add a dataset or document",
        group: "Quick actions",
        icon: CloudUpload,
        action: () => create("upload"),
      },
      {
        id: "new-experiment",
        label: "New experiment",
        sublabel: "Capture parameters and queue runs",
        group: "Quick actions",
        icon: FlaskConical,
        action: () => create("experiment"),
      },
      {
        id: "new-hypothesis",
        label: "New hypothesis",
        sublabel: "Add a testable prediction",
        group: "Quick actions",
        icon: Lightbulb,
        action: () => create("hypothesis"),
      },
      {
        id: "new-decision",
        label: "New decision",
        sublabel: "Record context and alternatives",
        group: "Quick actions",
        icon: Scale,
        action: () => create("decision"),
      },
      {
        id: "create-snapshot",
        label: "Create snapshot",
        sublabel: "Freeze a project manifest",
        group: "Quick actions",
        icon: Camera,
        action: () => create("snapshot"),
      },
    ];

    const list: CommandItem[] = [...actions, ...navigation];

    if (data) {
      const searchItems: CommandItem[] = [
        ...data.projects.map((item) => ({
          id: `search-project-${item.id}`,
          label: item.title,
          sublabel: `Project · ${item.subtitle}`,
          group: "Projects",
          icon: typeIcons.project,
          action: () => go(item.href),
        })),
        ...data.notebooks.map((item) => ({
          id: `search-notebook-${item.id}`,
          label: item.title,
          sublabel: `Notebook · ${item.subtitle}`,
          group: "Notebooks",
          icon: typeIcons.notebook,
          action: () => go(item.href),
        })),
        ...data.papers.map((item) => ({
          id: `search-paper-${item.id}`,
          label: item.title,
          sublabel: `Paper · ${item.subtitle}`,
          group: "Research papers",
          icon: typeIcons.paper,
          action: () => go(item.href),
        })),
        ...data.files.map((item) => ({
          id: `search-file-${item.id}`,
          label: item.title,
          sublabel: `File · ${item.subtitle}`,
          group: "Files",
          icon: typeIcons.file,
          action: () => go(item.href),
        })),
        ...data.tasks.map((item) => ({
          id: `search-task-${item.id}`,
          label: item.title,
          sublabel: `Task · ${item.subtitle}`,
          group: "Tasks",
          icon: typeIcons.task,
          action: () => go(item.href),
        })),
      ];
      return [...searchItems, ...list];
    }

    return list;
  }, [data, go, create]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    if (data) return commands;
    return commands.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.sublabel?.toLowerCase().includes(q),
    );
  }, [commands, query, data]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  useEffect(() => {
    const node = listRef.current?.querySelector<HTMLElement>(
      `[data-command-index="${activeIndex}"]`,
    );
    node?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const groups = filtered.reduce<{ name: string; items: CommandItem[] }[]>((acc, item) => {
    const group = acc.find((entry) => entry.name === item.group);
    if (group) group.items.push(item);
    else acc.push({ name: item.group, items: [item] });
    return acc;
  }, []);

  const flatItems = groups.flatMap((group) => group.items);
  const showEmpty = query.trim().length > 1 && !isFetching && flatItems.length === 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        hideClose
        className="top-[15%] max-w-2xl translate-y-0 gap-0 overflow-hidden p-0"
        aria-describedby={undefined}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActiveIndex((index) => (index + 1) % Math.max(flatItems.length, 1));
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((index) =>
              (index - 1 + Math.max(flatItems.length, 1)) % Math.max(flatItems.length, 1),
            );
          } else if (event.key === "Enter") {
            event.preventDefault();
            flatItems[activeIndex]?.action();
          }
        }}
      >
        <DialogTitle className="sr-only">Search ResearchOS</DialogTitle>
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search projects, notebooks, papers, files…"
            aria-label="Search workspace"
            className="h-14 flex-1 bg-transparent text-[14px] outline-none placeholder:text-muted-foreground/60"
          />
          {isFetching && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            Esc
          </kbd>
        </div>

        <div ref={listRef} className="max-h-[min(460px,60vh)] overflow-y-auto p-2 scrollbar-thin">
          {showEmpty ? (
            <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
              <Search className="mb-3 size-6 text-muted-foreground/60" />
              <p className="text-[13.5px] font-medium">No results for “{query}”</p>
              <p className="mt-1 max-w-xs text-[12px] text-muted-foreground">
                Try a project title, author name, notebook, or file. You can also create
                something new from the actions above.
              </p>
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.name} className="mb-1.5">
                <p className="px-2.5 pb-1 pt-2 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  {group.name}
                </p>
                {group.items.map((item) => {
                  const index = flatItems.findIndex((entry) => entry.id === item.id);
                  const Icon = item.icon;
                  const isActive = index === activeIndex;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      data-command-index={index}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={item.action}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition-colors",
                        isActive ? "bg-muted" : "hover:bg-muted/60",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-card text-muted-foreground",
                          isActive && "border-teal-200 text-teal-700 dark:border-teal-500/30 dark:text-teal-300",
                        )}
                      >
                        <Icon className="size-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium">
                          {item.label}
                        </span>
                        {item.sublabel && (
                          <span className="block truncate text-[11.5px] text-muted-foreground">
                            {item.sublabel}
                          </span>
                        )}
                      </span>
                      <ArrowRight
                        className={cn(
                          "size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity",
                          isActive && "opacity-100",
                        )}
                      />
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border bg-muted/30 px-4 py-2.5 text-[10.5px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-card px-1 py-0.5">↑</kbd>
              <kbd className="rounded border border-border bg-card px-1 py-0.5">↓</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-card px-1 py-0.5">↵</kbd>
              open
            </span>
          </div>
          <span className="flex items-center gap-1">
            <ShieldCheck className="size-3" /> Local demo
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
