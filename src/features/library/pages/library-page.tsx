import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import {
  ArrowUpDown,
  BookOpen,
  BookPlus,
  FileInput,
  Library,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { queryKeys } from "@/lib/query-keys";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Paper, PaperReadStatus } from "@/types";
import { projectsApi } from "@/features/projects/api";
import { useUiStore } from "@/store/ui-store";
import { libraryApi } from "../api";
import { PaperCard } from "../components/paper-card";
import { PaperDetailSheet } from "../components/paper-detail-sheet";
import { PaperFormDialog } from "../components/paper-form-dialog";
import { ImportPaperDialog } from "../components/import-paper-dialog";

type StatusFilter = "all" | PaperReadStatus | "favorites";
type SortKey = "added" | "year" | "title" | "citations";

const sortLabels: Record<SortKey, string> = {
  added: "Recently added",
  year: "Newest publication",
  title: "Title A–Z",
  citations: "Most cited",
};

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All papers" },
  { value: "unread", label: "Unread" },
  { value: "reading", label: "Reading" },
  { value: "read", label: "Read" },
  { value: "favorites", label: "Favorites" },
];

export function LibraryPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [projectId, setProjectId] = useState("all");
  const [year, setYear] = useState("all");
  const [tag, setTag] = useState("all");
  const [sort, setSort] = useState<SortKey>("added");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Paper | undefined>();
  const [deleting, setDeleting] = useState<Paper | undefined>();
  const [importOpen, setImportOpen] = useState(false);

  const { data: papers = [], isLoading } = useQuery({
    queryKey: queryKeys.papers,
    queryFn: libraryApi.list,
  });
  const { data: projects = [] } = useQuery({
    queryKey: queryKeys.projects,
    queryFn: projectsApi.list,
  });

  const projectById = useMemo(
    () => new Map(projects.map((project) => [project.id, project])),
    [projects],
  );

  const selectedId = searchParams.get("paper");
  const selectedPaper = papers.find((paper) => paper.id === selectedId) ?? null;

  const recordArtifactView = useUiStore((state) => state.recordArtifactView);

  useEffect(() => {
    if (!selectedPaper) return;
    recordArtifactView({
      type: "paper",
      id: selectedPaper.id,
      label: selectedPaper.title,
      href: `/app/library?paper=${selectedPaper.id}`,
      projectId: selectedPaper.projectId,
    });
  }, [selectedPaper, recordArtifactView]);

  const openPaper = (paper: Paper) => {
    const next = new URLSearchParams(searchParams);
    next.set("paper", paper.id);
    setSearchParams(next, { replace: true });
  };

  const closePaper = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("paper");
    setSearchParams(next, { replace: true });
  };

  const startEdit = (paper: Paper) => {
    closePaper();
    setEditing(paper);
    setFormOpen(true);
  };

  const remove = useMutation({
    mutationFn: (id: string) => libraryApi.remove(id),
    onSuccess: (_, id) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.papers });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      void queryClient.invalidateQueries({ queryKey: queryKeys.activity });
      if (selectedId === id) closePaper();
      toast.success("Paper removed", {
        description: "The citation was removed from this local demo library.",
      });
    },
    onError: () => toast.error("Could not remove the paper"),
  });

  const years = useMemo(
    () => Array.from(new Set(papers.map((paper) => paper.year))).sort((a, b) => b - a),
    [papers],
  );
  const tags = useMemo(
    () => Array.from(new Set(papers.flatMap((paper) => paper.tags))).sort(),
    [papers],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = papers.filter((paper) => {
      const matchesQuery =
        !q ||
        paper.title.toLowerCase().includes(q) ||
        paper.authors.some((author) => author.toLowerCase().includes(q)) ||
        paper.journal.toLowerCase().includes(q) ||
        paper.abstract.toLowerCase().includes(q) ||
        paper.tags.some((item) => item.toLowerCase().includes(q));
      const matchesStatus =
        status === "all" ||
        (status === "favorites" ? paper.favorite : paper.readStatus === status);
      const matchesProject =
        projectId === "all" ||
        (projectId === "none" ? paper.projectId === null : paper.projectId === projectId);
      const matchesYear = year === "all" || String(paper.year) === year;
      const matchesTag = tag === "all" || paper.tags.includes(tag);
      return matchesQuery && matchesStatus && matchesProject && matchesYear && matchesTag;
    });

    return list.sort((a, b) => {
      switch (sort) {
        case "year":
          return b.year - a.year;
        case "title":
          return a.title.localeCompare(b.title);
        case "citations":
          return b.citations - a.citations;
        default:
          return b.addedAt.localeCompare(a.addedAt);
      }
    });
  }, [papers, search, status, projectId, year, tag, sort]);

  const counts = useMemo(() => {
    const result: Record<string, number> = {
      all: papers.length,
      unread: 0,
      reading: 0,
      read: 0,
      favorites: 0,
    };
    papers.forEach((paper) => {
      result[paper.readStatus] = (result[paper.readStatus] ?? 0) + 1;
      if (paper.favorite) result.favorites += 1;
    });
    return result;
  }, [papers]);

  const readingCount = counts.reading ?? 0;
  const isFiltered =
    Boolean(search.trim()) ||
    status !== "all" ||
    projectId !== "all" ||
    year !== "all" ||
    tag !== "all";

  const clearFilters = () => {
    setSearch("");
    setStatus("all");
    setProjectId("all");
    setYear("all");
    setTag("all");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Research Library"
        description={`${formatNumber(papers.length)} saved papers · ${formatNumber(
          counts.favorites ?? 0,
        )} favorites · ${formatNumber(readingCount)} currently reading.`}
        actions={
          <>
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <FileInput className="size-4" />
              Import BibTeX
            </Button>
            <Button
              onClick={() => {
                setEditing(undefined);
                setFormOpen(true);
              }}
            >
              <BookPlus className="size-4" />
              Add paper
            </Button>
          </>
        }
      />

      <div className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div
            className="flex flex-wrap items-center gap-1.5"
            role="group"
            aria-label="Filter by reading status"
          >
            {statusFilters.map((filter) => {
              const count = counts[filter.value] ?? 0;
              return (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setStatus(filter.value)}
                  aria-pressed={status === filter.value}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-colors",
                    status === filter.value
                      ? "border-navy-900 bg-navy-900 text-white dark:border-teal-500/40 dark:bg-teal-500/15 dark:text-teal-200"
                      : "border-border bg-card text-muted-foreground hover:border-navy-300 hover:text-foreground dark:hover:border-navy-500",
                  )}
                >
                  {filter.value === "favorites" && (
                    <Star
                      className={cn(
                        "size-3",
                        status === "favorites" && "fill-current",
                      )}
                    />
                  )}
                  {filter.label}
                  <span
                    className={cn(
                      "rounded-full px-1.5 text-[10px] tabular-nums",
                      status === filter.value ? "bg-white/15" : "bg-muted",
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
              placeholder="Search titles, authors, journals…"
              ariaLabel="Search library"
              className="w-full sm:w-64"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-2">
                  <ArrowUpDown className="size-3.5" />
                  {sortLabels[sort]}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Sort library</DropdownMenuLabel>
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

        <div className="flex flex-wrap items-center gap-2">
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger className="h-8 w-auto min-w-40 text-[12px]" aria-label="Filter by project">
              <SelectValue placeholder="Project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All projects</SelectItem>
              <SelectItem value="none">Unlinked</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="h-8 w-auto min-w-32 text-[12px]" aria-label="Filter by year">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All years</SelectItem>
              {years.map((value) => (
                <SelectItem key={value} value={String(value)}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={tag} onValueChange={setTag}>
            <SelectTrigger className="h-8 w-auto min-w-32 text-[12px]" aria-label="Filter by keyword">
              <SelectValue placeholder="Keyword" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All keywords</SelectItem>
              {tags.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {isFiltered && (
            <div className="ml-auto flex items-center gap-2 text-[12px] text-muted-foreground">
              Showing {filtered.length} of {papers.length}
              <button
                type="button"
                onClick={clearFilters}
                className="font-medium text-teal-700 hover:underline dark:text-teal-300"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        {isLoading ? (
          <CardGridSkeleton
            count={6}
            className={view === "list" ? "grid-cols-1 xl:grid-cols-1" : ""}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={isFiltered ? SearchX : Library}
            title={isFiltered ? "No papers match those filters" : "Build your research library"}
            description={
              isFiltered
                ? "Try a different keyword, year, or reading status — or clear the filters to see every saved paper."
                : "Save citations with abstracts, notes, reading status, and project links. Add a paper manually or import a BibTeX file."
            }
            action={
              isFiltered ? (
                <Button variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setImportOpen(true)}>
                    <FileInput className="size-4" /> Import BibTeX
                  </Button>
                  <Button onClick={() => setFormOpen(true)}>
                    <BookPlus className="size-4" /> Add paper
                  </Button>
                </div>
              )
            }
          />
        ) : view === "grid" ? (
          <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
            {filtered.map((paper) => (
              <PaperCard
                key={paper.id}
                paper={paper}
                projectTitle={
                  paper.projectId ? projectById.get(paper.projectId)?.title : undefined
                }
                onOpen={openPaper}
                onEdit={startEdit}
                onDelete={setDeleting}
              />
            ))}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-subtle">
            <div className="hidden items-center gap-3 border-b border-border bg-muted/40 px-4 py-2 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground lg:flex">
              <span className="w-9" />
              <span className="flex-1">Paper</span>
              <span className="w-40">Keywords</span>
              <span className="w-16 text-right">Cited</span>
              <span className="w-20">Status</span>
              <span className="w-14" />
            </div>
            {filtered.map((paper) => (
              <PaperCard
                key={paper.id}
                paper={paper}
                view="list"
                projectTitle={
                  paper.projectId ? projectById.get(paper.projectId)?.title : undefined
                }
                onOpen={openPaper}
                onEdit={startEdit}
                onDelete={setDeleting}
              />
            ))}
          </div>
        )}

        {papers.length > 0 && (
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <BookOpen className="size-3" />
            Reading status and notes are stored in your local demo workspace — no files leave
            this browser.
          </p>
        )}
      </div>

      <PaperDetailSheet
        paper={selectedPaper}
        projectTitle={
          selectedPaper?.projectId ? projectById.get(selectedPaper.projectId)?.title : undefined
        }
        open={Boolean(selectedPaper)}
        onOpenChange={(open) => !open && closePaper()}
        onEdit={startEdit}
      />

      <PaperFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(undefined);
        }}
        paper={editing}
      />

      <ImportPaperDialog open={importOpen} onOpenChange={setImportOpen} />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(undefined)}
        title="Remove this paper?"
        description={
          <>
            <strong>{deleting?.title}</strong> will be removed from your local demo library,
            including its reading notes. This cannot be undone.
          </>
        }
        confirmLabel="Remove paper"
        onConfirm={() => {
          if (deleting) remove.mutate(deleting.id);
        }}
      />
    </div>
  );
}
