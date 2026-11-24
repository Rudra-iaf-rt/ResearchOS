import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Camera,
  ExternalLink,
  FlaskConical,
  History,
  MoreHorizontal,
  Pencil,
  Plus,
  Save,
  Trash2,
  Unlink,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { AvatarGroup } from "@/components/shared/avatar-group";
import {
  ExperimentStatusBadge,
  HypothesisStatusBadge,
} from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import { experimentStatusMeta, experimentTransitions, runStatusMeta } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { experimentsApi } from "../api";
import { runsApi } from "@/features/runs/api";
import { formatDurationSeconds } from "@/features/runs/lib";
import { RunList } from "@/features/runs/components/run-list";
import { RunStatusStrip } from "@/features/runs/components/run-status-strip";
import { historyApi } from "@/features/history/api";
import { HistoryDrawer } from "@/features/history/components/history-drawer";
import { SnapshotModal } from "@/features/snapshots/components/snapshot-modal";
import { hypothesesApi } from "@/features/hypotheses/api";
import { evidenceApi } from "@/features/evidence/api";
import { projectsApi } from "@/features/projects/api";
import { artifactsApi } from "@/features/artifacts/api";
import { ExperimentModal } from "../components/experiment-modal";
import { ExperimentNotes } from "../components/experiment-notes";
import { ParameterEditor } from "../components/parameter-editor";
import type { ArtifactRef, ExperimentStatus, ParameterEntry } from "@/types";

const tabs = ["overview", "runs", "parameters", "artifacts", "notes"] as const;
type TabValue = (typeof tabs)[number];

export function ExperimentDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const [editOpen, setEditOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [snapshotOpen, setSnapshotOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [parameters, setParameters] = useState<ParameterEntry[] | null>(null);
  const [artifactKey, setArtifactKey] = useState("");

  const tabParam = searchParams.get("tab") as TabValue | null;
  const tab: TabValue = tabParam && tabs.includes(tabParam) ? tabParam : "overview";
  const focusRunId = searchParams.get("run");

  const {
    data: experiment,
    isLoading,
    isError,
  } = useQuery({
    queryKey: queryKeys.experiment(id),
    queryFn: () => experimentsApi.get(id),
    enabled: Boolean(id),
  });

  const { data: runs = [] } = useQuery({
    queryKey: queryKeys.runs(id),
    queryFn: () => runsApi.list(id),
    enabled: Boolean(id),
  });
  const { data: projects = [] } = useQuery({
    queryKey: queryKeys.projects,
    queryFn: projectsApi.list,
  });
  const { data: hypotheses = [] } = useQuery({
    queryKey: queryKeys.hypotheses,
    queryFn: hypothesesApi.list,
  });
  const { data: artifacts = [] } = useQuery({
    queryKey: queryKeys.artifacts,
    queryFn: artifactsApi.list,
    enabled: Boolean(experiment),
  });

  const hypothesis = experiment?.hypothesisId
    ? hypotheses.find((item) => item.id === experiment.hypothesisId)
    : null;
  const project = projects.find((item) => item.id === experiment?.projectId);

  const { data: evidence = [] } = useQuery({
    queryKey: queryKeys.evidence(experiment?.hypothesisId ?? ""),
    queryFn: () => evidenceApi.list(experiment!.hypothesisId!),
    enabled: Boolean(experiment?.hypothesisId),
  });

  useEffect(() => {
    if (experiment) setParameters(structuredClone(experiment.parameters));
  }, [experiment]);

  const setTab = (value: string) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (value === "overview") next.delete("tab");
      else next.set("tab", value);
      if (value !== "runs") next.delete("run");
      return next;
    });
  };

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.experiment(id) });
    queryClient.invalidateQueries({ queryKey: queryKeys.experiments });
    queryClient.invalidateQueries({ queryKey: queryKeys.runs(id) });
    queryClient.invalidateQueries({ queryKey: queryKeys.graph });
    queryClient.invalidateQueries({ queryKey: queryKeys.activity });
    queryClient.invalidateQueries({ queryKey: queryKeys.feed });
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
    queryClient.invalidateQueries({ queryKey: queryKeys.hypotheses });
  };

  const statusMutation = useMutation({
    mutationFn: (status: ExperimentStatus) => experimentsApi.setStatus(id, status),
    onSuccess: (result) => {
      invalidate();
      toast.success(`Experiment ${experimentStatusMeta[result.status].label.toLowerCase()}`, {
        description: `“${result.title}” moved to ${result.status}.`,
      });
    },
    onError: (error: Error) => {
      toast.error("Could not change status", { description: error.message });
    },
  });

  const saveParametersMutation = useMutation({
    mutationFn: (next: ParameterEntry[]) => experimentsApi.saveParameters(id, next),
    onSuccess: (result) => {
      invalidate();
      setParameters(structuredClone(result.parameters));
      toast.success("Parameters saved", {
        description: "Existing runs keep their original parameter snapshots.",
      });
    },
    onError: (error: Error) => {
      toast.error("Could not save parameters", { description: error.message });
    },
  });

  const saveVersionMutation = useMutation({
    mutationFn: () =>
      historyApi.create("experiment", id, {
        label: `Manual version · ${new Date().toLocaleDateString()}`,
        summary: "Saved an explicit experiment version from the Parameters tab.",
      }),
    onSuccess: (version) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.history("experiment", id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.activity });
      queryClient.invalidateQueries({ queryKey: queryKeys.feed });
      toast.success("Version saved", {
        description: `${version.label} was added to the experiment history.`,
      });
    },
    onError: (error: Error) => {
      toast.error("Could not save version", { description: error.message });
    },
  });

  const linkMutation = useMutation({
    mutationFn: ({ type, artifactId }: { type: "notebook" | "file"; artifactId: string }) =>
      experimentsApi.linkArtifact(id, type, artifactId),
    onSuccess: (result, variables) => {
      invalidate();
      setArtifactKey("");
      toast.success("Artifact linked", {
        description: `${variables.type === "notebook" ? "Notebook" : "File"} attached to “${result.title}”.`,
      });
    },
    onError: (error: Error) => {
      toast.error("Could not link artifact", { description: error.message });
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: (artifact: ArtifactRef) =>
      experimentsApi.unlinkArtifact(id, artifact.type, artifact.id),
    onSuccess: () => {
      invalidate();
      toast.success("Artifact unlinked", {
        description: "The original artifact was not deleted.",
      });
    },
    onError: (error: Error) => {
      toast.error("Could not unlink artifact", { description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => experimentsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.experiments });
      queryClient.invalidateQueries({ queryKey: queryKeys.graph });
      queryClient.invalidateQueries({ queryKey: queryKeys.activity });
      queryClient.invalidateQueries({ queryKey: queryKeys.feed });
      toast.success("Experiment deleted");
      navigate("/app/experiments");
    },
    onError: (error: Error) => {
      toast.error("Could not delete experiment", { description: error.message });
    },
  });

  const linkOptions = useMemo(
    () =>
      artifacts.filter(
        (artifact) =>
          (artifact.type === "notebook" || artifact.type === "file") &&
          !experiment?.artifactRefs.some(
            (ref) => ref.type === artifact.type && ref.id === artifact.id,
          ),
      ),
    [artifacts, experiment],
  );

  const latestRun = useMemo(
    () => [...runs].sort((a, b) => b.runNumber - a.runNumber)[0] ?? null,
    [runs],
  );

  if (isLoading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading experiment">
        <div className="h-8 w-64 animate-pulse rounded-md bg-muted/60" />
        <div className="h-24 animate-pulse rounded-xl border border-border bg-muted/40" />
        <div className="h-64 animate-pulse rounded-xl border border-border bg-muted/40" />
      </div>
    );
  }

  if (isError || !experiment) {
    return (
      <EmptyState
        icon={FlaskConical}
        title="Experiment not found"
        description="This experiment may have been deleted. Its runs and version history were removed with it."
        action={
          <Button asChild>
            <Link to="/app/experiments">Back to experiments</Link>
          </Button>
        }
      />
    );
  }

  const transitions = experimentTransitions[experiment.status];
  const evidenceFor = evidence.filter((item) => item.stance === "supports").length;
  const against = evidence.filter((item) => item.stance === "contradicts").length;

  return (
    <div className="space-y-5">
      <div>
        <Link
          to="/app/experiments"
          className="mb-2 inline-flex items-center gap-1 text-[12.5px] text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Experiments
        </Link>
        <PageHeader
          eyebrow={project ? project.title : "Experiment"}
          title={experiment.title}
          description={experiment.description}
          actions={
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" disabled={transitions.length === 0}>
                    <ExperimentStatusBadge status={experiment.status} />
                    {transitions.length > 0 && <span className="text-muted-foreground">· Move</span>}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Allowed transitions</DropdownMenuLabel>
                  {transitions.map((next) => (
                    <DropdownMenuItem
                      key={next}
                      onClick={() => statusMutation.mutate(next)}
                      disabled={statusMutation.isPending}
                    >
                      Move to {experimentStatusMeta[next].label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                <Pencil className="size-3.5" />
                Edit
              </Button>
              <Button variant="outline" onClick={() => setHistoryOpen(true)}>
                <History className="size-3.5" />
                History
              </Button>
              <Button variant="outline" onClick={() => setSnapshotOpen(true)}>
                <Camera className="size-3.5" />
                Snapshot
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="More experiment actions">
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => saveVersionMutation.mutate()}>
                    <Save className="size-3.5" />
                    Save version
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTab("artifacts")}>
                    <ExternalLink className="size-3.5" />
                    Manage artifacts
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setDeleteOpen(true)}
                  >
                    <Trash2 className="size-3.5" />
                    Delete experiment
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          }
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <ExperimentStatusBadge status={experiment.status} />
        {project && (
          <Link
            to={`/app/projects/${project.id}`}
            className="rounded-full border border-border bg-card px-2.5 py-0.5 text-[11.5px] text-muted-foreground hover:text-teal-700 dark:hover:text-teal-300"
          >
            {project.title}
          </Link>
        )}
        {hypothesis ? (
          <Link
            to={`/app/hypotheses?focus=${hypothesis.id}`}
            className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-0.5 text-[11.5px] text-muted-foreground hover:text-teal-700 dark:hover:text-teal-300"
          >
            <HypothesisStatusBadge status={hypothesis.status} />
            <span className="truncate">{hypothesis.statement}</span>
          </Link>
        ) : (
          <Badge variant="outline">No linked hypothesis</Badge>
        )}
        <span className="ml-auto flex items-center gap-2 text-[11.5px] text-muted-foreground">
          <AvatarGroup people={[experiment.owner]} max={1} />
          {experiment.owner.name}
        </span>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="runs">Runs ({runs.length})</TabsTrigger>
          <TabsTrigger value="parameters">Parameters ({experiment.parameters.length})</TabsTrigger>
          <TabsTrigger value="artifacts">Artifacts ({experiment.artifactRefs.length})</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Runs" value={runs.length} icon={FlaskConical} hint="All recorded attempts" />
            <StatCard label="Parameters" value={experiment.parameters.length} icon={Save} accent="indigo" hint="Current parameter set" />
            <StatCard
              label="Latest outcome"
              value={latestRun ? runStatusMeta[latestRun.status].label : "No runs"}
              icon={History}
              accent="amber"
              hint={latestRun ? `Run ${latestRun.runNumber}` : "Queue the first run"}
            />
            <StatCard
              label="Evidence"
              value={`${evidenceFor} / ${against}`}
              icon={Camera}
              accent="navy"
              hint="For / against linked hypothesis"
            />
          </div>

          <SectionCard
            title="Recent run outcomes"
            description="Last ten runs, oldest to newest."
            action={
              <Button variant="outline" size="sm" onClick={() => setTab("runs")}>
                View runs
              </Button>
            }
          >
            <RunStatusStrip runs={runs} />
          </SectionCard>

          <div className="grid gap-4 lg:grid-cols-2">
            <SectionCard title="Latest run" description={latestRun ? latestRun.label : "No runs yet"}>
              {latestRun ? (
                <dl className="space-y-2 text-[12.5px]">
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Status</dt>
                    <dd>
                      <Badge variant={latestRun.status === "failed" ? "danger" : latestRun.status === "succeeded" ? "success" : "info"}>
                        {latestRun.status}
                      </Badge>
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Started</dt>
                    <dd>{latestRun.startedAt ? formatDate(latestRun.startedAt, "MMM d, HH:mm") : "Not started"}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Duration</dt>
                    <dd>{formatDurationSeconds(latestRun.durationSeconds)}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Artifacts</dt>
                    <dd>{latestRun.artifactRefs.length}</dd>
                  </div>
                </dl>
              ) : (
                <p className="text-[12.5px] text-muted-foreground">
                  No run has been recorded. Open the Runs tab to queue one.
                </p>
              )}
            </SectionCard>

            <SectionCard title="Linked hypothesis" description="Evidence attached to the hypothesis this experiment tests.">
              {hypothesis ? (
                <div className="space-y-2.5">
                  <Link
                    to={`/app/hypotheses?focus=${hypothesis.id}`}
                    className="block text-[13px] font-medium hover:text-teal-700 dark:hover:text-teal-300"
                  >
                    {hypothesis.statement}
                  </Link>
                  <p className="text-[12px] text-muted-foreground">{hypothesis.researchQuestion}</p>
                  <div className="flex flex-wrap gap-1.5">
                    <HypothesisStatusBadge status={hypothesis.status} />
                    <Badge variant="success">{evidenceFor} supporting</Badge>
                    <Badge variant="danger">{against} contradicting</Badge>
                    <Badge variant="outline">
                      {evidence.filter((item) => item.stance === "neutral").length} neutral
                    </Badge>
                  </div>
                </div>
              ) : (
                <p className="text-[12.5px] text-muted-foreground">
                  This experiment is not linked to a hypothesis. Edit the experiment to link one.
                </p>
              )}
            </SectionCard>
          </div>

          <SectionCard
            title="Current parameters"
            action={
              <Button variant="outline" size="sm" onClick={() => setTab("parameters")}>
                Edit parameters
              </Button>
            }
          >
            {experiment.parameters.length === 0 ? (
              <p className="text-[12.5px] text-muted-foreground">No parameters are defined.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-left text-[12px]">
                  <thead className="bg-muted/40 text-[11px] uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th scope="col" className="px-3 py-1.5 font-medium">Key</th>
                      <th scope="col" className="px-3 py-1.5 font-medium">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border font-mono">
                    {experiment.parameters.map((parameter) => (
                      <tr key={parameter.id}>
                        <td className="px-3 py-1.5">{parameter.key}</td>
                        <td className="px-3 py-1.5 text-muted-foreground">{parameter.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="runs">
          <SectionCard title="Runs" description="Every attempt with its frozen parameters, logs, and artifacts.">
            <RunList experimentId={experiment.id} runs={runs} focusRunId={focusRunId} />
          </SectionCard>
        </TabsContent>

        <TabsContent value="parameters" className="space-y-4">
          <SectionCard
            title="Experiment parameters"
            description="Saving parameters changes the experiment record. Existing runs keep their original snapshots."
            action={
              <div className="flex gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => saveVersionMutation.mutate()}
                  disabled={saveVersionMutation.isPending}
                >
                  <Save className="size-3.5" />
                  Save version
                </Button>
                <Button
                  size="sm"
                  onClick={() => parameters && saveParametersMutation.mutate(parameters)}
                  disabled={!parameters || saveParametersMutation.isPending}
                >
                  Save parameters
                </Button>
              </div>
            }
          >
            <ParameterEditor
              value={parameters ?? []}
              onChange={setParameters}
              idPrefix="experiment-parameter"
            />
          </SectionCard>
        </TabsContent>

        <TabsContent value="artifacts" className="space-y-4">
          <SectionCard
            title="Linked artifacts"
            description="Notebooks and files attached to this experiment. Linking never duplicates the source artifact."
          >
            {experiment.artifactRefs.length === 0 ? (
              <p className="text-[12.5px] text-muted-foreground">
                No artifacts linked yet. Add a notebook or file below.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {experiment.artifactRefs.map((artifact) => (
                  <li
                    key={`${artifact.type}:${artifact.id}`}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[12.5px] font-medium">{artifact.label}</p>
                      <p className="text-[11px] text-muted-foreground">{artifact.type}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {artifact.type === "notebook" && (
                        <Button asChild variant="ghost" size="sm">
                          <Link to={`/app/notebooks/${artifact.id}`}>Open</Link>
                        </Button>
                      )}
                      {artifact.type === "file" && (
                        <Button asChild variant="ghost" size="sm">
                          <Link to={`/app/files?file=${artifact.id}`}>Open</Link>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Unlink ${artifact.label}`}
                        disabled={unlinkMutation.isPending}
                        onClick={() => unlinkMutation.mutate(artifact)}
                      >
                        <Unlink className="size-3.5" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="Link an artifact" description="Only notebooks and files can be linked to an experiment in this phase.">
            {linkOptions.length === 0 ? (
              <p className="text-[12.5px] text-muted-foreground">
                Every available notebook and file is already linked.
              </p>
            ) : (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="min-w-0 flex-1 space-y-1.5">
                  <label htmlFor="artifact-link" className="text-[12px] font-medium">
                    Artifact
                  </label>
                  <Select value={artifactKey} onValueChange={setArtifactKey}>
                    <SelectTrigger id="artifact-link">
                      <SelectValue placeholder="Choose a notebook or file" />
                    </SelectTrigger>
                    <SelectContent>
                      {linkOptions.map((artifact) => (
                        <SelectItem
                          key={`${artifact.type}:${artifact.id}`}
                          value={`${artifact.type}:${artifact.id}`}
                        >
                          {artifact.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  disabled={!artifactKey || linkMutation.isPending}
                  onClick={() => {
                    const [type, ...rest] = artifactKey.split(":");
                    const artifactId = rest.join(":");
                    if (!artifactId) return;
                    linkMutation.mutate({ type: type as "notebook" | "file", artifactId });
                  }}
                >
                  <Plus className="size-4" />
                  Link artifact
                </Button>
              </div>
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="notes">
          <SectionCard
            title="Experiment notes"
            description="Observations, protocol deviations, and next steps. Notes autosave to the experiment record."
          >
            <ExperimentNotes experimentId={experiment.id} notes={experiment.notes} />
          </SectionCard>
        </TabsContent>
      </Tabs>

      <ExperimentModal open={editOpen} onOpenChange={setEditOpen} experiment={experiment} />
      <HistoryDrawer
        artifactType="experiment"
        artifactId={experiment.id}
        open={historyOpen}
        onOpenChange={setHistoryOpen}
      />
      <SnapshotModal
        open={snapshotOpen}
        onOpenChange={setSnapshotOpen}
        defaultProjectId={experiment.projectId}
        defaultItemKey={`experiment:${experiment.id}`}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this experiment?"
        description={`“${experiment.title}”, its ${runs.length} runs, and its version history will be permanently removed.`}
        confirmLabel="Delete experiment"
        onConfirm={async () => {
          await deleteMutation.mutateAsync();
        }}
      />
    </div>
  );
}
