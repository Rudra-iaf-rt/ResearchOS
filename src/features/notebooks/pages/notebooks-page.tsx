import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpDown,
  BookMarked,
  NotebookPen,
  SearchX,
  Star,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import type { Notebook } from "@/types";
import { projectsApi } from "@/features/projects/api";
import { notebooksApi } from "../api";
import { NotebookCard } from "../components/notebook-card";
import { NotebookFormDialog } from "../components/notebook-form-dialog";

type SortKey = "recent" | "title" | "entries";

const sortLabels: Record<SortKey, string> = {
  recent: "Last edited",
  title: "Title",
  entries: "Most entries",
};

export function NotebooksPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState<SortKey>("recent");
  const [createOpen, setCreateOpen] = useState(false);
  const [deleting, setDeleting] = useState<Notebook | undefined>();

  const { data: notebooks = [], isLoading } = useQuery({
    queryKey: queryKeys.notebooks,
    queryFn: notebooksApi.list,
  });
  const { data: projects = [] } = useQuery({
    queryKey: queryKeys.projects,
    queryFn: projectsApi.list,
  });

  const projectTitle = (id: string | null) =>
    projects.find((project) => project.id === id)?.title;

  const remove = useMutation({
    mutationFn: (id: string) => notebooksApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notebooks });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      void queryClient.invalidateQueries({ queryKey: queryKeys.activity });
      toast.success("Notebook deleted");
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return notebooks
      .filter((notebook) => {
        const matchesQuery =
          !q ||
          notebook.title.toLowerCase().includes(q) ||
          notebook.description.toLowerCase().includes(q) ||
          notebook.tags.some((tag) => tag.toLowerCase().includes(q)) ||
          notebook.entries.some((entry) => entry.title.toLowerCase().includes(q));
        const matchesProject =
          projectFilter === "all" ||
          (projectFilter === "none"
            ? !notebook.projectId
            : notebook.projectId === projectFilter);
        const matchesFavorite = !favoritesOnly || notebook.favorite;
        return matchesQuery && matchesProject && matchesFavorite;
      })
      .sort((a, b) => {
        switch (sort) {
          case "title":
            return a.title.localeCompare(b.title);
          case "entries":
            return b.entries.length - a.entries.length;
          default:
            return b.updatedAt.localeCompare(a.updatedAt);
        }
      });
  }, [notebooks, search, projectFilter, favoritesOnly, sort]);

  const totalEntries = notebooks.reduce((sum, notebook) => sum + notebook.entries.length, 0);
  const favoriteCount = notebooks.filter((notebook) => notebook.favorite).length;
  const hasFilters = Boolean(search.trim()) || projectFilter !== "all" || favoritesOnly;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notebooks"
        description={`${notebooks.length} notebooks · ${totalEntries} entries of protocols, analyses, and notes.`}
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <NotebookPen className="size-4" />
            New notebook
          </Button>
        }
      />

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search notebooks and entries…"
            ariaLabel="Search notebooks"
            className="w-full sm:w-64"
          />
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-[190px]" aria-label="Filter by project">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All projects</SelectItem>
              <SelectItem value="none">Standalone</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            type="button"
            onClick={() => setFavoritesOnly((value) => !value)}
            aria-pressed={favoritesOnly}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[12px] font-medium transition-colors",
              favoritesOnly
                ? "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            <Star
              className={cn("size-3.5", favoritesOnly && "fill-amber-400 text-amber-500")}
            />
            Favorites
            <span className="text-[10px] opacity-70">{favoriteCount}</span>
          </button>
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setProjectFilter("all");
                setFavoritesOnly(false);
              }}
              className="text-[11.5px] font-medium text-teal-700 hover:underline dark:text-teal-300"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-2">
                <ArrowUpDown className="size-3.5" />
                {sortLabels[sort]}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel>Sort notebooks</DropdownMenuLabel>
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

      {isLoading ? (
        <CardGridSkeleton count={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={hasFilters ? SearchX : BookMarked}
          title={hasFilters ? "No notebooks match this view" : "A blank page, ready when you are"}
          description={
            hasFilters
              ? "Try another search, project, or turn off the favorites filter."
              : "Notebooks hold the reasoning behind your research: protocols, analysis decisions, and reading notes."
          }
          action={
            hasFilters ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setProjectFilter("all");
                  setFavoritesOnly(false);
                }}
              >
                Clear filters
              </Button>
            ) : (
              <Button onClick={() => setCreateOpen(true)}>Create a notebook</Button>
            )
          }
        />
      ) : view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
          {filtered.map((notebook) => (
            <NotebookCard
              key={notebook.id}
              notebook={notebook}
              projectTitle={projectTitle(notebook.projectId)}
              onDelete={setDeleting}
            />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-subtle">
          {filtered.map((notebook) => (
            <NotebookCard
              key={notebook.id}
              notebook={notebook}
              view="list"
              projectTitle={projectTitle(notebook.projectId)}
              onDelete={setDeleting}
            />
          ))}
        </div>
      )}

      <NotebookFormDialog open={createOpen} onOpenChange={setCreateOpen} />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(undefined)}
        title="Delete this notebook?"
        description={
          <>
            <strong>{deleting?.title}</strong> and all of its entries will be removed from this
            demo workspace. This cannot be undone.
          </>
        }
        confirmLabel="Delete notebook"
        onConfirm={() => {
          if (deleting) remove.mutate(deleting.id);
        }}
      />
    </div>
  );
}
