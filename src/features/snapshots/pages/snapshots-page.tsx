import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Camera,
  Copy,
  Download,
  Eye,
  FileJson,
  FolderKanban,
  MoreHorizontal,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { queryKeys } from "@/lib/query-keys";
import { downloadBlob, formatDate, fromNow, slugify } from "@/lib/format";
import { projectsApi } from "@/features/projects/api";
import { snapshotsApi } from "../api";
import { SnapshotModal } from "../components/snapshot-modal";
import { SnapshotManifest } from "../components/snapshot-manifest";
import type { ResearchSnapshot } from "@/types";

function maskDoi(snapshot: ResearchSnapshot) {
  if (!snapshot.doi) return <span className="text-muted-foreground">DOI not assigned</span>;
  return <span className="font-mono text-[11.5px]">{snapshot.doi}</span>;
}

export function SnapshotsPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [detail, setDetail] = useState<ResearchSnapshot | null>(null);
  const [deleting, setDeleting] = useState<ResearchSnapshot | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);

  const { data: snapshots = [], isLoading } = useQuery({
    queryKey: queryKeys.snapshots,
    queryFn: snapshotsApi.list,
  });
  const { data: projects = [] } = useQuery({
    queryKey: queryKeys.projects,
    queryFn: projectsApi.list,
  });

  const projectById = useMemo(
    () => new Map(projects.map((project) => [project.id, project])),
    [projects],
  );

  const groups = useMemo(() => {
    const byProject = new Map<string, ResearchSnapshot[]>();
    snapshots.forEach((snapshot) => {
      const list = byProject.get(snapshot.projectId) ?? [];
      list.push(snapshot);
      byProject.set(snapshot.projectId, list);
    });
    return Array.from(byProject.entries())
      .map(([projectId, items]) => ({
        projectId,
        project: projectById.get(projectId),
        items: items.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      }))
      .sort((a, b) => (a.project?.title ?? "").localeCompare(b.project?.title ?? ""));
  }, [snapshots, projectById]);

  const deleteMutation = useMutation({
    mutationFn: (snapshot: ResearchSnapshot) => snapshotsApi.remove(snapshot.id),
    onSuccess: () => {
      toast.success("Snapshot deleted", {
        description: "The saved manifest was removed. Source artifacts were not affected.",
      });
      setDeleting(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.snapshots });
      queryClient.invalidateQueries({ queryKey: queryKeys.activity });
      queryClient.invalidateQueries({ queryKey: queryKeys.feed });
    },
    onError: (error: Error) => {
      toast.error("Could not delete snapshot", { description: error.message });
    },
  });

  const exportManifest = async (snapshot: ResearchSnapshot) => {
    setExportingId(snapshot.id);
    try {
      const payload = await snapshotsApi.manifestExport(snapshot);
      downloadBlob(
        JSON.stringify(payload, null, 2),
        `${slugify(snapshot.label)}-manifest.json`,
        "application/json",
      );
      toast.success("Manifest exported", {
        description: "Metadata only — binary files and datasets are not bundled.",
      });
    } catch (error) {
      toast.error("Could not export manifest", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setExportingId(null);
    }
  };

  const copyDoi = async (snapshot: ResearchSnapshot) => {
    if (!snapshot.doi) return;
    try {
      await navigator.clipboard.writeText(snapshot.doi);
      toast.success("DOI copied", { description: snapshot.doi });
    } catch {
      toast.error("Could not copy the DOI", {
        description: "Your browser blocked clipboard access.",
      });
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Scientific reasoning"
        title="Research snapshots"
        description="Freeze the metadata of a meaningful research state so its manifest stays auditable even after the source artifacts change."
        actions={
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="size-4" />
            Create snapshot
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-3" aria-busy="true" aria-label="Loading snapshots">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-xl border border-border bg-muted/40" />
          ))}
        </div>
      ) : snapshots.length === 0 ? (
        <EmptyState
          icon={Camera}
          title="No snapshots yet"
          description="Create a snapshot to preserve the manifest of a project’s notebooks, experiments, datasets, files, and decisions."
          action={
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="size-4" />
              Create snapshot
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <section key={group.projectId} className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <FolderKanban className="size-4 text-muted-foreground" aria-hidden="true" />
                {group.project ? (
                  <Link
                    to={`/app/projects/${group.project.id}`}
                    className="text-[14px] font-semibold hover:text-teal-700 dark:hover:text-teal-300"
                  >
                    {group.project.title}
                  </Link>
                ) : (
                  <span className="text-[14px] font-semibold">Unknown project</span>
                )}
                <Badge variant="outline">
                  {group.items.length} snapshot{group.items.length === 1 ? "" : "s"}
                </Badge>
              </div>

              <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-subtle">
                <table className="w-full min-w-[720px] text-left text-[13px]">
                  <caption className="sr-only">
                    Snapshots for {group.project?.title ?? "this project"}
                  </caption>
                  <thead className="border-b border-border bg-muted/40 text-[11px] uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th scope="col" className="px-4 py-2.5 font-medium">Snapshot</th>
                      <th scope="col" className="px-4 py-2.5 font-medium">Created</th>
                      <th scope="col" className="px-4 py-2.5 text-center font-medium">Manifest</th>
                      <th scope="col" className="px-4 py-2.5 font-medium">DOI</th>
                      <th scope="col" className="px-2 py-2.5">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {group.items.map((snapshot) => (
                      <tr key={snapshot.id} className="transition-colors hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => setDetail(snapshot)}
                            className="text-left font-medium text-foreground hover:text-teal-700 dark:hover:text-teal-300"
                          >
                            {snapshot.label}
                          </button>
                          <p className="mt-0.5 max-w-[46ch] truncate text-[12px] text-muted-foreground">
                            {snapshot.description || "No description"}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground" title={formatDate(snapshot.createdAt, "MMM d, yyyy HH:mm")}>
                          {fromNow(snapshot.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-center tabular-nums text-muted-foreground">
                          {snapshot.manifest.length}
                        </td>
                        <td className="px-4 py-3">{maskDoi(snapshot)}</td>
                        <td className="px-2 py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Actions for snapshot ${snapshot.label}`}
                              >
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setDetail(snapshot)}>
                                <Eye className="size-3.5" />
                                View manifest
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={!snapshot.doi}
                                onClick={() => copyDoi(snapshot)}
                              >
                                <Copy className="size-3.5" />
                                Copy DOI
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={exportingId === snapshot.id}
                                onClick={() => exportManifest(snapshot)}
                              >
                                <FileJson className="size-3.5" />
                                Export manifest (JSON)
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setDeleting(snapshot)}
                              >
                                <Trash2 className="size-3.5" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}

      <SnapshotModal open={modalOpen} onOpenChange={setModalOpen} />

      <Dialog open={Boolean(detail)} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle>{detail.label}</DialogTitle>
                <DialogDescription>
                  {detail.description || "No description"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <dl className="grid gap-3 text-[12.5px] sm:grid-cols-3">
                  <div>
                    <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Project</dt>
                    <dd className="mt-0.5 font-medium">
                      {projectById.get(detail.projectId)?.title ?? detail.projectId}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Created</dt>
                    <dd className="mt-0.5">{formatDate(detail.createdAt, "MMM d, yyyy HH:mm")}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">DOI</dt>
                    <dd className="mt-0.5">{detail.doi ?? "Not assigned"}</dd>
                  </div>
                </dl>
                <div>
                  <h3 className="mb-2 text-[13px] font-semibold">
                    Manifest · {detail.manifest.length} entries
                  </h3>
                  <SnapshotManifest manifest={detail.manifest} />
                </div>
                <p className="text-[11.5px] text-muted-foreground">
                  Manifest metadata is frozen at creation time. Editing a source artifact does not
                  change this snapshot.
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDetail(null)}>
                  Close
                </Button>
                <Button onClick={() => exportManifest(detail)} disabled={exportingId === detail.id}>
                  <Download className="size-4" />
                  Export manifest (JSON)
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete this snapshot?"
        description={
          deleting
            ? `“${deleting.label}” and its ${deleting.manifest.length} manifest entries will be removed. The original notebooks, experiments, files, and decisions are not affected.`
            : ""
        }
        confirmLabel="Delete snapshot"
        onConfirm={async () => {
          if (deleting) await deleteMutation.mutateAsync(deleting);
        }}
      />
    </div>
  );
}
