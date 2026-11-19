import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpDown,
  FolderKanban,
  FolderPlus,
  LayoutGrid,
  Plus,
  SearchX,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { GridListToggle } from "@/components/shared/grid-list-toggle";
import { EmptyState } from "@/components/shared/empty-state";
import { CardGridSkeleton } from "@/components/shared/skeletons";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { queryKeys } from "@/lib/query-keys";
import { projectStatusMeta } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Project, ProjectStatus } from "@/types";
import { projectsApi } from "../api";
import { ProjectCard } from "../components/project-card";
import { ProjectFormDialog } from "../components/project-form-dialog";

type SortKey = "updated" | "progress" | "title" | "target";

const sortLabels: Record<SortKey, string> = {
  updated: "Last updated",
  progress: "Progress",
  title: "Title",
  target: "Target date",
};

const statusFilters: ("all" | ProjectStatus)[] = [
  "all",
  "active",
  "planning",
  "on-hold",
  "completed",
];

export function ProjectsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | ProjectStatus>("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState<SortKey>("updated");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Project | undefined>();
  const [deleting, setDeleting] = useState<Project | undefined>();

  const { data: summaries = [], isLoading } = useQuery({
    queryKey: queryKeys.projectSummaries,
    queryFn: projectsApi.summaries,
  });

  const remove = useMutation({
    mutationFn: (id: string) => projectsApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      void queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
      void queryClient.invalidateQueries({ queryKey: queryKeys.activity });
      toast.success("Project deleted", {
        description: "Linked tasks and milestones were removed from this demo workspace.",
      });
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = summaries.filter(({ project }) => {
      const matchesQuery =
        !q ||
        project.title.toLowerCase().includes(q) ||
        project.description.toLowerCase().includes(q) ||
        project.tags.some((tag) => tag.toLowerCase().includes(q));
      const matchesStatus = status === "all" || project.status === status;
      return matchesQuery && matchesStatus;
    });

    return list.sort((a, b) => {
      switch (sort) {
        case "progress":
          return b.project.progress - a.project.progress;
        case "title":
          return a.project.title.localeCompare(b.project.title);
        case "target":
          return a.project.targetDate.localeCompare(b.project.targetDate);
        default:
          return b.project.updatedAt.localeCompare(a.project.updatedAt);
      }
    });
  }, [summaries, search, status, sort]);

  const counts = useMemo(() => {
    const result: Record<string, number> = { all: summaries.length };
    summaries.forEach(({ project }) => {
      result[project.status] = (result[project.status] ?? 0) + 1;
    });
    return result;
  }, [summaries]);

  const activeCount = counts.active ?? 0;
  const isFiltered = Boolean(search.trim()) || status !== "all";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description={`${summaries.length} research projects across the workspace · ${activeCount} active right now.`}
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <FolderPlus className="size-4" />
            New project
          </Button>
        }
      />

      <div className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by status">
            {statusFilters.map((value) => {
              const label = value === "all" ? "All projects" : projectStatusMeta[value].label;
              const count = counts[value] ?? 0;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStatus(value)}
                  aria-pressed={status === value}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-colors",
                    status === value
                      ? "border-navy-900 bg-navy-900 text-white dark:border-teal-500/40 dark:bg-teal-500/15 dark:text-teal-200"
                      : "border-border bg-card text-muted-foreground hover:border-navy-300 hover:text-foreground dark:hover:border-navy-500",
                  )}
                >
                  {label}
                  <span
                    className={cn(
                      "rounded-full px-1.5 text-[10px] tabular-nums",
                      status === value ? "bg-white/15" : "bg-muted",
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search projects or tags…"
              ariaLabel="Search projects"
              className="w-full sm:w-64"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-2">
                  <ArrowUpDown className="size-3.5" />
                  {sortLabels[sort]}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel>Sort projects</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={sort}
                  onValueChange={(value) => setSort(value as SortKey)}
                >
                  {Object.entries(sortLabels).map(([value, label]) => (
                    <DropdownMenuRadioItem key={value} value={value}>
                      {label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <GridListToggle value={view} onChange={setView} />
          </div>
        </div>

        {isFiltered && (
          <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
            <LayoutGrid className="size-3.5" />
            Showing {filtered.length} of {summaries.length} projects
            <button
              type="button"
              className="font-medium text-teal-700 hover:underline dark:text-teal-300"
              onClick={() => {
                setSearch("");
                setStatus("all");
              }}
            >
              Clear filters
            </button>
          </div>
        )}

        {isLoading ? (
          <CardGridSkeleton count={6} className={view === "list" ? "grid-cols-1 xl:grid-cols-1" : ""} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={isFiltered ? SearchX : FolderKanban}
            title={isFiltered ? "No projects match those filters" : "Your first project starts here"}
            description={
              isFiltered
                ? "Try a different search term or status. You can also clear the filters to see the full portfolio."
                : "Create a project to hold your objectives, tasks, milestones, notebooks, papers, and files."
            }
            action={
              isFiltered ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch("");
                    setStatus("all");
                  }}
                >
                  Clear filters
                </Button>
              ) : (
                <Button onClick={() => setFormOpen(true)}>
                  <Plus className="size-4" /> Create project
                </Button>
              )
            }
          />
        ) : view === "grid" ? (
          <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
            {filtered.map((summary) => (
              <ProjectCard
                key={summary.project.id}
                summary={summary}
                onEdit={(project) => {
                  setEditing(project);
                  setFormOpen(true);
                }}
                onDelete={setDeleting}
              />
            ))}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-subtle">
            <div className="hidden items-center gap-4 border-b border-border bg-muted/40 px-4 py-2 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground md:flex">
              <span className="w-2.5" />
              <span className="flex-1">Project</span>
              <span className="w-36">Progress</span>
              <span className="w-24">Tasks</span>
              <span className="w-20">Team</span>
              <span className="w-7" />
            </div>
            {filtered.map((summary) => (
              <ProjectCard
                key={summary.project.id}
                summary={summary}
                view="list"
                onEdit={(project) => {
                  setEditing(project);
                  setFormOpen(true);
                }}
                onDelete={setDeleting}
              />
            ))}
          </div>
        )}
      </div>

      <ProjectFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(undefined);
        }}
        project={editing}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(undefined)}
        title="Delete this project?"
        description={
          <>
            <strong>{deleting?.title}</strong> and its tasks and milestones will be removed from
            this demo workspace. Notebooks and papers will be unlinked but kept. This cannot be
            undone.
          </>
        }
        confirmLabel="Delete project"
        onConfirm={() => {
          if (deleting) remove.mutate(deleting.id);
        }}
      />
    </div>
  );
}
