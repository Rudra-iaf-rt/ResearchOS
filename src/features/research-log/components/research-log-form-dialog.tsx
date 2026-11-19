import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Save } from "lucide-react";
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
import { Input, Textarea } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { queryKeys } from "@/lib/query-keys";
import { artifactTypeMeta, researchModeMeta, researchModes } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { ArtifactRef, ArtifactType } from "@/types";
import { artifactsApi } from "@/features/artifacts/api";
import { artifactKey, parseArtifactKey } from "@/features/artifacts/lib";
import { projectsApi } from "@/features/projects/api";
import { useSyncStore } from "@/store/sync-store";
import { researchLogApi } from "../api";
import { toDateTimeLocal, type ResearchLogView } from "../lib";
import { researchModeIcons } from "../mode-icons";
import { researchLogSchema, type ResearchLogFormValues } from "../schema";

interface ResearchLogFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: ResearchLogView | null;
  defaultProjectId?: string;
  variant?: "full" | "quick";
}

function defaults(
  entry?: ResearchLogView | null,
  defaultProjectId?: string,
): ResearchLogFormValues {
  return {
    mode: entry?.mode ?? "analysis",
    title: entry?.title ?? "",
    projectId: entry?.projectId ?? defaultProjectId ?? "none",
    artifactKey: artifactKey(entry?.artifact ?? null),
    durationMinutes: entry?.durationMinutes ?? 30,
    occurredAt: toDateTimeLocal(entry?.occurredAt ?? new Date()),
    notes: entry?.notes ?? "",
  };
}

const durationPresets = [15, 30, 45, 60, 90, 120];

export function ResearchLogFormDialog({
  open,
  onOpenChange,
  entry,
  defaultProjectId,
  variant = "full",
}: ResearchLogFormDialogProps) {
  const queryClient = useQueryClient();
  const beginSync = useSyncStore((state) => state.beginSync);
  const isQuick = variant === "quick";

  const { data: projects = [] } = useQuery({
    queryKey: queryKeys.projects,
    queryFn: projectsApi.list,
    enabled: open,
  });
  const { data: artifacts = [] } = useQuery({
    queryKey: queryKeys.artifacts,
    queryFn: artifactsApi.list,
    enabled: open,
  });

  const groupedArtifacts = useMemo(() => {
    const groups = new Map<ArtifactType, typeof artifacts>();
    artifacts.forEach((artifact) => {
      const list = groups.get(artifact.type) ?? [];
      list.push(artifact);
      groups.set(artifact.type, list);
    });
    return [...groups.entries()];
  }, [artifacts]);

  const form = useForm<ResearchLogFormValues>({
    resolver: zodResolver(researchLogSchema),
    defaultValues: defaults(entry, defaultProjectId),
  });

  useEffect(() => {
    if (open) form.reset(defaults(entry, defaultProjectId));
  }, [open, entry, defaultProjectId, form]);

  const mutation = useMutation({
    mutationFn: (values: ResearchLogFormValues) => {
      const parsed = parseArtifactKey(values.artifactKey);
      const artifact: ArtifactRef | null = parsed
        ? {
            ...parsed,
            label:
              artifacts.find(
                (option) => option.type === parsed.type && option.id === parsed.id,
              )?.label ?? parsed.id,
          }
        : null;

      const payload = {
        mode: values.mode,
        title: values.title,
        notes: values.notes,
        durationMinutes: values.durationMinutes,
        occurredAt: new Date(values.occurredAt).toISOString(),
        projectId: values.projectId === "none" ? null : values.projectId,
        artifact,
      };
      return entry ? researchLogApi.update(entry.id, payload) : researchLogApi.create(payload);
    },
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.researchLog });
      void queryClient.invalidateQueries({ queryKey: queryKeys.feed });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      void queryClient.invalidateQueries({ queryKey: queryKeys.activity });
      beginSync();
      toast.success(entry ? "Research log entry updated" : "Logged to your research log", {
        description: `“${result.title}” · ${result.durationMinutes} minutes saved locally.`,
      });
      onOpenChange(false);
    },
    onError: (error) =>
      toast.error("Could not save the research log entry", {
        description: error instanceof Error ? error.message : undefined,
      }),
  });

  const title = entry ? "Edit research log entry" : isQuick ? "Quick capture" : "Log research activity";
  const description = entry
    ? "Update what you worked on, how long it took, and what it connects to."
    : isQuick
      ? "Capture what you just worked on. Press C anywhere in the workspace to reopen this."
      : "Record focused research time so Today, your log, and the research feed stay accurate.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="mode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Activity mode</FormLabel>
                  <FormControl>
                    <div
                      role="group"
                      aria-label="Activity mode"
                      className="grid grid-cols-3 gap-1.5 sm:grid-cols-6"
                    >
                      {researchModes.map((mode) => {
                        const Icon = researchModeIcons[mode];
                        const active = field.value === mode;
                        return (
                          <button
                            key={mode}
                            type="button"
                            aria-pressed={active}
                            onClick={() => field.onChange(mode)}
                            className={cn(
                              "flex flex-col items-center gap-1 rounded-lg border px-1 py-2 text-[10.5px] font-medium transition-colors",
                              active
                                ? "border-teal-600 bg-teal-50 text-teal-800 dark:border-teal-400/60 dark:bg-teal-500/15 dark:text-teal-200"
                                : "border-border bg-card text-muted-foreground hover:border-navy-300 hover:text-foreground dark:hover:border-navy-500",
                            )}
                          >
                            <Icon className="size-4" />
                            {researchModeMeta[mode].label}
                          </button>
                        );
                      })}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What did you work on?</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Re-ran ICA with the locked parameters"
                      autoFocus={!isQuick}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a project" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No project</SelectItem>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="artifactKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link an artifact</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Optional" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No linked artifact</SelectItem>
                        {groupedArtifacts.map(([type, options]) => (
                          <SelectGroup key={type}>
                            <SelectLabel>{artifactTypeMeta[type].plural}</SelectLabel>
                            {options.map((option) => (
                              <SelectItem
                                key={`${option.type}:${option.id}`}
                                value={`${option.type}:${option.id}`}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="durationMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time spent (minutes)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={5}
                        max={1440}
                        step={5}
                        value={Number.isFinite(field.value) ? field.value : ""}
                        onChange={(event) => field.onChange(Number(event.target.value))}
                      />
                    </FormControl>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {durationPresets.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => field.onChange(preset)}
                          className={cn(
                            "rounded-md border px-1.5 py-0.5 text-[10px] font-medium transition-colors",
                            field.value === preset
                              ? "border-teal-600 bg-teal-50 text-teal-800 dark:border-teal-400/60 dark:bg-teal-500/15 dark:text-teal-200"
                              : "border-border text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {preset}m
                        </button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="occurredAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>When</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="What changed, what you observed, or what happens next…"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional. Notes appear in the research feed and stay in your browser.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : entry ? (
                  <Save className="size-4" />
                ) : (
                  <Plus className="size-4" />
                )}
                {entry ? "Save changes" : isQuick ? "Capture activity" : "Log activity"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
