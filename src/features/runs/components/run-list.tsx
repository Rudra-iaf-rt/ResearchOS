import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Play, Plus } from "lucide-react";
import { toast } from "sonner";
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { queryKeys } from "@/lib/query-keys";
import { runStatusMeta, runTransitions } from "@/lib/constants";
import { runsApi } from "../api";
import { RunRow } from "./run-row";
import { ReproduceDialog } from "./reproduce-dialog";
import { runSchema, type RunFormValues } from "@/features/experiments/schema";
import type { ExperimentRun, RunStatus } from "@/types";

interface RunListProps {
  experimentId: string;
  runs: ExperimentRun[];
  focusRunId?: string | null;
}

export function RunList({ experimentId, runs, focusRunId }: RunListProps) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [creating, setCreating] = useState(false);
  const [reproducing, setReproducing] = useState<ExperimentRun | null>(null);
  const [pendingRunId, setPendingRunId] = useState<string | null>(null);

  const form = useForm<RunFormValues>({
    resolver: zodResolver(runSchema),
    defaultValues: { label: "" },
  });

  useEffect(() => {
    if (focusRunId) {
      setExpanded((current) => ({ ...current, [focusRunId]: true }));
    }
  }, [focusRunId]);

  const invalidate = (run: ExperimentRun) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.runs(experimentId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.runs("all") });
    queryClient.invalidateQueries({ queryKey: queryKeys.experiment(experimentId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.experiments });
    queryClient.invalidateQueries({ queryKey: queryKeys.hypotheses });
    queryClient.invalidateQueries({ queryKey: queryKeys.graph });
    queryClient.invalidateQueries({ queryKey: queryKeys.activity });
    queryClient.invalidateQueries({ queryKey: queryKeys.feed });
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
    return run;
  };

  const createMutation = useMutation({
    mutationFn: (values: RunFormValues) => runsApi.create(experimentId, values),
    onSuccess: (run) => {
      invalidate(run);
      toast.success("Run queued", {
        description: `${run.label} snapshotted the experiment’s current parameters.`,
      });
      setCreating(false);
      form.reset({ label: "" });
      setExpanded((current) => ({ ...current, [run.id]: true }));
    },
    onError: (error: Error) => {
      toast.error("Could not create run", { description: error.message });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ runId, status }: { runId: string; status: RunStatus }) =>
      runsApi.setStatus(runId, status),
    onMutate: ({ runId }) => setPendingRunId(runId),
    onSuccess: (run) => {
      invalidate(run);
      toast.success(`Run ${runStatusMeta[run.status].label.toLowerCase()}`, {
        description: `${run.label} is now ${run.status}.`,
      });
    },
    onError: (error: Error) => {
      toast.error("Could not change run status", { description: error.message });
    },
    onSettled: () => setPendingRunId(null),
  });

  const sorted = [...runs].sort((a, b) => a.runNumber - b.runNumber);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[12.5px] text-muted-foreground">
          {runs.length === 0
            ? "No runs recorded yet."
            : `${runs.length} run${runs.length === 1 ? "" : "s"} · queued → running → succeeded or failed`}
        </p>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus className="size-3.5" />
          New run
        </Button>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
          <Play className="mx-auto mb-2 size-5 text-muted-foreground" aria-hidden="true" />
          <p className="text-[13px] font-medium">No runs yet</p>
          <p className="mx-auto mt-1 max-w-md text-[12px] text-muted-foreground">
            Queue a run to freeze the current parameters, then move it through the lifecycle
            as work progresses.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((run) => (
            <RunRow
              key={run.id}
              run={run}
              expanded={Boolean(expanded[run.id]) || run.id === focusRunId}
              onToggle={() =>
                setExpanded((current) => ({ ...current, [run.id]: !current[run.id] }))
              }
              onStatusChange={(status) => statusMutation.mutate({ runId: run.id, status })}
              onReproduce={() => setReproducing(run)}
              pending={pendingRunId === run.id && statusMutation.isPending}
            />
          ))}
        </div>
      )}

      <p className="text-[11.5px] text-muted-foreground">
        Allowed transitions:{" "}
        {(["queued", "running", "succeeded", "failed"] as RunStatus[])
          .map((status) => `${status} → ${runTransitions[status].join(" / ") || "final"}`)
          .join("; ")}
        .
      </p>

      <Dialog
        open={creating}
        onOpenChange={(open) => {
          setCreating(open);
          if (!open) form.reset({ label: "" });
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Queue a run</DialogTitle>
            <DialogDescription>
              The run stores a copy of the experiment’s current parameters. Later parameter
              edits will not change this run.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Run label</FormLabel>
                    <FormControl>
                      <Input placeholder="cohort-b/coupling-v3" {...field} />
                    </FormControl>
                    <FormDescription>
                      A short identifier that distinguishes this attempt from earlier runs.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreating(false)}
                  disabled={createMutation.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="size-4 animate-spin" />}
                  Queue run
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ReproduceDialog
        run={reproducing}
        onOpenChange={(open) => !open && setReproducing(null)}
      />
    </div>
  );
}
