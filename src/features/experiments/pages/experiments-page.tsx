import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowUpDown,
  Eye,
  FlaskConical,
  MoreHorizontal,
  Pencil,
  Plus,
  SearchX,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { GridListToggle } from "@/components/shared/grid-list-toggle";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { AvatarGroup } from "@/components/shared/avatar-group";
import { ExperimentStatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
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
import { experimentStatusMeta } from "@/lib/constants";
import { formatDate, fromNow, truncate } from "@/lib/format";
import { experimentsApi } from "../api";
import { runsApi } from "@/features/runs/api";
import { hypothesesApi } from "@/features/hypotheses/api";
import { projectsApi } from "@/features/projects/api";
import { ExperimentModal } from "../components/experiment-modal";
import type { Experiment } from "@/types";

type SortKey = "updated" | "title" | "status";
type Layout = "table" | "grid";

const sortLabels: Record<SortKey, string> = {
  updated: "Last updated",
  title: "Title",
  status: "Status",
};

const statusOrder: Record<Experiment["status"], number> = {
  running: 0,
  queued: 1,
  draft: 2,
  failed: 3,
  succeeded: 4,
};

export function ExperimentsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState<SortKey>("updated");
  const [layout, setLayout] = useState<Layout>("table");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Experiment | null>(null);
  const [deleting, setDeleting] = useState<Experiment | null>(null);

  const { data: experiments = [], isLoading } = useQuery({
    queryKey: queryKeys.experiments,
    queryFn: experimentsApi.list,
  });
  const { data: projects = [] } = useQuery({
    queryKey: queryKeys.projects,
    queryFn: projectsApi.list,
  });
  const { data: hypotheses = [] } = useQuery({
    queryKey: queryKeys.hypotheses,
    queryFn: hypothesesApi.list,
  });
  const { data: runs = [] } = useQuery({
    queryKey: queryKeys.runs("all"),
    queryFn: runsApi.listAll,
  });

  const projectById = useMemo(
    () => new Map(projects.map((project) => [project.id, project])),
    [projects],
  );
  const hypothesisById = useMemo(
    () => new Map(hypotheses.map((hypothesis) => [hypothesis.id, hypothesis])),
    [hypotheses],
  );
  const runCounts = useMemo(() => {
    const counts = new Map<string, number>();
    runs.forEach((run) => {
      counts.set(run.experimentId, (counts.get(run.experimentId) ?? 0) + 1);
    });
    return counts;
  }, [runs]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const list = experiments.filter((experiment) => {
      const matchesSearch =
        !query ||
        experiment.title.toLowerCase().includes(query) ||
        experiment.description.toLowerCase().includes(query);
      const matchesProject =
        projectFilter === "all" || experiment.projectId === projectFilter;
      const matchesStatus = statusFilter === "all" || experiment.status === statusFilter;
      return matchesSearch && matchesProject && matchesStatus;
    });

    return [...list].sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title);
      if (sort === "status") {
        const order = statusOrder[a.status] - statusOrder[b.status];
        return order !== 0 ? order : a.title.localeCompare(b.title);
      }
      return b.updatedAt.localeCompare(a.updatedAt);
    });
  }, [experiments, search, projectFilter, statusFilter, sort]);

  const deleteMutation = useMutation({
    mutationFn: (experiment: Experiment) => experimentsApi.remove(experiment.id),
    onSuccess: () => {
      toast.success("Experiment deleted", {
        description: "Its runs and version history were removed as well.",
      });
      setDeleting(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.experiments });
      queryClient.invalidateQueries({ queryKey: queryKeys.hypotheses });
      queryClient.invalidateQueries({ queryKey: queryKeys.graph });
      queryClient.invalidateQueries({ queryKey: queryKeys.activity });
      queryClient.invalidateQueries({ queryKey: queryKeys.feed });
    },
    onError: (error: Error) => {
      toast.error("Could not delete experiment", { description: error.message });
    },
  });

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (experiment: Experiment) => {
    setEditing(experiment);
    setModalOpen(true);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Scientific reasoning"
        title="Experiments"
        description="Design experiments, freeze parameter sets, and follow every run from queued to a recorded outcome."
        actions={
          <>
            <GridListToggle value={layout === "grid" ? "grid" : "list"} onChange={(value) => setLayout(value === "grid" ? "grid" : "table")} />
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              New experiment
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search experiments…"
          ariaLabel="Search experiments"
          className="sm:w-64"
        />
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-full sm:w-52" aria-label="Filter by project">
            <SelectValue placeholder="All projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All projects</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40" aria-label="Filter by status">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {Object.entries(experimentStatusMeta).map(([value, meta]) => (
              <SelectItem key={value} value={value}>
                {meta.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="sm:ml-auto">
              <ArrowUpDown className="size-3.5" />
              {sortLabels[sort]}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Sort experiments</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={sort} onValueChange={(value) => setSort(value as SortKey)}>
              {(Object.keys(sortLabels) as SortKey[]).map((key) => (
                <DropdownMenuRadioItem key={key} value={key}>
                  {sortLabels[key]}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isLoading ? (
        <div className="space-y-2" aria-busy="true" aria-label="Loading experiments">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-14 animate-pulse rounded-lg border border-border bg-muted/40" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={experiments.length === 0 ? FlaskConical : SearchX}
          title={experiments.length === 0 ? "No experiments yet" : "No experiments match these filters"}
          description={
            experiments.length === 0
              ? "Create the first experiment to capture parameters, runs, and results in one reproducible record."
              : "Adjust the search, project, or status filter to see more experiments."
          }
          action={
            experiments.length === 0 ? (
              <Button onClick={openCreate}>
                <Plus className="size-4" />
                New experiment
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setProjectFilter("all");
                  setStatusFilter("all");
                }}
              >
                Reset filters
              </Button>
            )
          }
        />
      ) : layout === "table" ? (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-subtle">
          <table className="w-full min-w-[760px] text-left text-[13px]">
            <caption className="sr-only">Experiments</caption>
            <thead className="border-b border-border bg-muted/40 text-[11.5px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-2.5 font-medium">Experiment</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Project</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Hypothesis</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Status</th>
                <th scope="col" className="px-4 py-2.5 text-center font-medium">Runs</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Updated</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Owner</th>
                <th scope="col" className="px-2 py-2.5">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((experiment) => {
                const project = projectById.get(experiment.projectId);
                const hypothesis = experiment.hypothesisId
                  ? hypothesisById.get(experiment.hypothesisId)
                  : null;
                return (
                  <tr key={experiment.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Link
                        to={`/app/experiments/${experiment.id}`}
                        className="font-medium text-foreground hover:text-teal-700 dark:hover:text-teal-300"
                      >
                        {experiment.title}
                      </Link>
                      <p className="mt-0.5 max-w-[26ch] text-[12px] text-muted-foreground">
                        {truncate(experiment.description, 64)}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {project ? (
                        <Link
                          to={`/app/projects/${project.id}`}
                          className="hover:text-teal-700 dark:hover:text-teal-300"
                        >
                          {project.title}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {hypothesis ? (
                        <Link
                          to={`/app/hypotheses?focus=${hypothesis.id}`}
                          className="line-clamp-2 max-w-[22ch] text-[12.5px] text-muted-foreground hover:text-teal-700 dark:hover:text-teal-300"
                        >
                          {hypothesis.statement}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <ExperimentStatusBadge status={experiment.status} />
                    </td>
                    <td className="px-4 py-3 text-center tabular-nums text-muted-foreground">
                      {runCounts.get(experiment.id) ?? 0}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground" title={formatDate(experiment.updatedAt)}>
                      {fromNow(experiment.updatedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <AvatarGroup people={[experiment.owner]} max={1} />
                        <span className="max-w-[14ch] truncate text-[12.5px] text-muted-foreground">
                          {experiment.owner.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Actions for ${experiment.title}`}
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/app/experiments/${experiment.id}`)}>
                            <Eye className="size-3.5" />
                            Open
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(experiment)}>
                            <Pencil className="size-3.5" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleting(experiment)}
                          >
                            <Trash2 className="size-3.5" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((experiment) => {
            const project = projectById.get(experiment.projectId);
            return (
              <article
                key={experiment.id}
                className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-subtle transition-colors hover:border-navy-300 dark:hover:border-navy-600"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      to={`/app/experiments/${experiment.id}`}
                      className="line-clamp-2 text-[14.5px] font-semibold text-foreground hover:text-teal-700 dark:hover:text-teal-300"
                    >
                      {experiment.title}
                    </Link>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">
                      {project?.title ?? "No project"}
                    </p>
                  </div>
                  <ExperimentStatusBadge status={experiment.status} />
                </div>
                <p className="line-clamp-3 text-[12.5px] leading-relaxed text-muted-foreground">
                  {experiment.description}
                </p>
                <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3 text-[12px] text-muted-foreground">
                  <span>{runCounts.get(experiment.id) ?? 0} runs</span>
                  <span>{fromNow(experiment.updatedAt)}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AvatarGroup people={[experiment.owner]} max={1} />
                    <span className="text-[12px] text-muted-foreground">{experiment.owner.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon-sm" aria-label={`Edit ${experiment.title}`} onClick={() => openEdit(experiment)}>
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground hover:text-destructive"
                      aria-label={`Delete ${experiment.title}`}
                      onClick={() => setDeleting(experiment)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <ExperimentModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        experiment={editing}
        defaultProjectId={projectFilter === "all" ? undefined : projectFilter}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete this experiment?"
        description={
          deleting
            ? `“${deleting.title}”, its runs, and its version history will be permanently removed. Decisions that reference it will keep their other artifact links.`
            : ""
        }
        confirmLabel="Delete experiment"
        onConfirm={async () => {
          if (deleting) await deleteMutation.mutateAsync(deleting);
        }}
      />
    </div>
  );
}
