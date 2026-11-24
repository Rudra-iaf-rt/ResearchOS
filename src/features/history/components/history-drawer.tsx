import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GitCompareArrows, History, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PersonAvatar } from "@/components/shared/avatar-group";
import { fromNow } from "@/lib/format";
import { cn } from "@/lib/utils";
import { queryKeys } from "@/lib/query-keys";
import { historyApi } from "../api";
import { DiffViewer, type DiffMode } from "./diff-viewer";
import type { VersionArtifactType } from "@/types";

export interface HistoryDrawerProps {
  artifactType: "notebook" | "experiment" | "project" | "document";
  artifactId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const typeTitle: Record<VersionArtifactType, string> = {
  notebook: "Notebook history",
  experiment: "Experiment history",
  project: "Project history",
  document: "Document history",
};

const defaultMode: Record<VersionArtifactType, DiffMode> = {
  notebook: "markdown",
  experiment: "text",
  project: "text",
  document: "text",
};

const modes: DiffMode[] = ["text", "markdown", "table"];

function invalidateArtifact(
  queryClient: ReturnType<typeof useQueryClient>,
  artifactType: VersionArtifactType,
  artifactId: string,
) {
  queryClient.invalidateQueries({ queryKey: queryKeys.history(artifactType, artifactId) });
  if (artifactType === "notebook") {
    queryClient.invalidateQueries({ queryKey: queryKeys.notebook(artifactId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.notebooks });
  }
  if (artifactType === "experiment") {
    queryClient.invalidateQueries({ queryKey: queryKeys.experiment(artifactId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.experiments });
  }
  if (artifactType === "project") {
    queryClient.invalidateQueries({ queryKey: queryKeys.project(artifactId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    queryClient.invalidateQueries({ queryKey: queryKeys.projectSummaries });
  }
  queryClient.invalidateQueries({ queryKey: queryKeys.graph });
  queryClient.invalidateQueries({ queryKey: queryKeys.activity });
  queryClient.invalidateQueries({ queryKey: queryKeys.feed });
  queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
}

export function HistoryDrawer({
  artifactType,
  artifactId,
  open,
  onOpenChange,
}: HistoryDrawerProps) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string[]>([]);
  const [comparing, setComparing] = useState(false);
  const [mode, setMode] = useState<DiffMode>(defaultMode[artifactType]);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const { data: versions = [], isLoading } = useQuery({
    queryKey: queryKeys.history(artifactType, artifactId),
    queryFn: () => historyApi.list(artifactType, artifactId),
    enabled: open,
  });

  useEffect(() => {
    if (!open) {
      setSelected([]);
      setComparing(false);
      setRestoringId(null);
      setMode(defaultMode[artifactType]);
    }
  }, [open, artifactType]);

  const chronological = useMemo(
    () => [...versions].sort((a, b) => a.versionNumber - b.versionNumber),
    [versions],
  );
  const current = chronological[chronological.length - 1];

  const selectedVersions = useMemo(
    () =>
      selected
        .map((id) => chronological.find((version) => version.id === id))
        .filter((version): version is NonNullable<typeof version> => Boolean(version)),
    [selected, chronological],
  );

  const canCompare = selected.length === 2;
  const canRestore = selected.length === 1 && selected[0] !== current?.id;

  const toggle = (versionId: string) => {
    setComparing(false);
    setSelected((currentSelection) => {
      if (currentSelection.includes(versionId)) {
        return currentSelection.filter((id) => id !== versionId);
      }
      if (currentSelection.length >= 2) {
        toast.info("Select at most two versions", {
          description: "Clear a selection before choosing a third version.",
        });
        return currentSelection;
      }
      return [...currentSelection, versionId];
    });
  };

  const restoreMutation = useMutation({
    mutationFn: (versionId: string) => historyApi.restore(versionId),
    onSuccess: (version) => {
      invalidateArtifact(queryClient, artifactType, artifactId);
      toast.success("Version restored", {
        description: `Restored ${version.label}. A new version was created; earlier history is unchanged.`,
      });
      setSelected([]);
      setComparing(false);
      setRestoringId(null);
    },
    onError: (error: Error) => {
      toast.error("Could not restore version", { description: error.message });
    },
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="size-4 text-teal-600" aria-hidden="true" />
            {typeTitle[artifactType]}
          </SheetTitle>
          <SheetDescription>
            Versions are listed oldest first. Select one to restore, or two to compare. Restoring
            never deletes earlier versions.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-3 p-6 pt-4">
          {isLoading ? (
            <div className="space-y-2" aria-busy="true" aria-label="Loading version history">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-20 animate-pulse rounded-lg border border-border bg-muted/40" />
              ))}
            </div>
          ) : chronological.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-10 text-center">
              <History className="mx-auto mb-2 size-5 text-muted-foreground" aria-hidden="true" />
              <p className="text-[13px] font-medium">No versions yet</p>
              <p className="mx-auto mt-1 max-w-sm text-[12px] text-muted-foreground">
                A version is recorded when this artifact is saved, or when someone restores an
                earlier version.
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[12px] text-muted-foreground">
                  {selected.length} of 2 selected
                </p>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!canCompare}
                    onClick={() => setComparing(true)}
                  >
                    <GitCompareArrows className="size-3.5" />
                    Compare
                  </Button>
                  <Button
                    size="sm"
                    disabled={!canRestore}
                    onClick={() => canRestore && setRestoringId(selected[0])}
                  >
                    <RotateCcw className="size-3.5" />
                    Restore
                  </Button>
                </div>
              </div>

              {comparing && selectedVersions.length === 2 && (
                <div className="space-y-2">
                  <div
                    className="flex items-center gap-1"
                    role="group"
                    aria-label="Diff mode"
                  >
                    {modes.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setMode(option)}
                        aria-pressed={mode === option}
                        className={cn(
                          "rounded-md border px-2 py-0.5 text-[11.5px] font-medium capitalize transition-colors",
                          mode === option
                            ? "border-teal-500/50 bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300"
                            : "border-border bg-card text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  <DiffViewer
                    left={{ label: selectedVersions[0].label, content: selectedVersions[0].content }}
                    right={{ label: selectedVersions[1].label, content: selectedVersions[1].content }}
                    mode={mode}
                  />
                </div>
              )}

              <ol className="space-y-2">
                {chronological.map((version) => {
                  const isCurrent = version.id === current?.id;
                  const checked = selected.includes(version.id);
                  return (
                    <li
                      key={version.id}
                      className={cn(
                        "rounded-lg border bg-card p-3 transition-colors",
                        checked ? "border-teal-500/50 ring-1 ring-teal-500/20" : "border-border",
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggle(version.id)}
                          aria-label={`Select ${version.label}`}
                          className="mt-0.5"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[12.5px] font-semibold">{version.label}</span>
                            {isCurrent && <Badge variant="success">Current</Badge>}
                          </div>
                          <p className="mt-1 text-[12px] text-muted-foreground">{version.summary}</p>
                          <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <PersonAvatar person={version.author} className="size-4 border-0" />
                            <span>{version.author.name}</span>
                            <span aria-hidden="true">·</span>
                            <span title={version.createdAt}>{fromNow(version.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </>
          )}
        </div>

        <div className="border-t border-border px-6 py-3 text-[11.5px] text-muted-foreground">
          Restore creates a new version from the selected snapshot. Existing versions are never
          rewritten or deleted.
        </div>
      </SheetContent>

      <ConfirmDialog
        open={Boolean(restoringId)}
        onOpenChange={(openState) => !openState && setRestoringId(null)}
        title="Restore this version?"
        description={
          <>
            This applies the selected snapshot to the current {artifactType} and creates a new
            version on top of the existing history. Earlier versions remain available.
          </>
        }
        confirmLabel={restoreMutation.isPending ? "Restoring…" : "Restore version"}
        destructive={false}
        onConfirm={async () => {
          if (restoringId) await restoreMutation.mutateAsync(restoringId);
        }}
      />

      {restoreMutation.isPending && (
        <span className="sr-only" role="status">
          <Loader2 className="size-3 animate-spin" /> Restoring version
        </span>
      )}
    </Sheet>
  );
}
