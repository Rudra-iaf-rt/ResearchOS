import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, Loader2 } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { queryKeys } from "@/lib/query-keys";
import { projectsApi } from "@/features/projects/api";
import { snapshotsApi } from "../api";
import { snapshotSchema, type SnapshotFormValues } from "../schema";
import type { SnapshotArtifactType } from "@/types";

interface SnapshotModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultProjectId?: string;
  defaultItemKey?: string;
}

const categoryOrder: SnapshotArtifactType[] = [
  "notebook",
  "experiment",
  "dataset",
  "file",
  "decision",
];

const categoryLabel: Record<SnapshotArtifactType, string> = {
  notebook: "Notebooks",
  experiment: "Experiments",
  dataset: "Datasets",
  file: "Files",
  decision: "Decisions",
};

export function SnapshotModal({
  open,
  onOpenChange,
  defaultProjectId,
  defaultItemKey,
}: SnapshotModalProps) {
  const queryClient = useQueryClient();
  const [initializedProject, setInitializedProject] = useState<string | null>(null);

  const { data: projects = [] } = useQuery({
    queryKey: queryKeys.projects,
    queryFn: projectsApi.list,
    enabled: open,
  });

  const form = useForm<SnapshotFormValues>({
    resolver: zodResolver(snapshotSchema),
    defaultValues: {
      label: "",
      projectId: defaultProjectId ?? "",
      description: "",
      doi: "",
      itemKeys: [],
    },
  });
  const projectId = form.watch("projectId");
  const itemKeys = form.watch("itemKeys");

  const { data: candidates = [] } = useQuery({
    queryKey: [...queryKeys.snapshots, "candidates", projectId],
    queryFn: () => snapshotsApi.candidates(projectId),
    enabled: open && Boolean(projectId),
  });

  const grouped = useMemo(
    () =>
      categoryOrder
        .map((category) => ({
          category,
          items: candidates.filter((candidate) => candidate.category === category),
        }))
        .filter((group) => group.items.length > 0),
    [candidates],
  );

  useEffect(() => {
    if (!open) {
      setInitializedProject(null);
      return;
    }
    form.reset({
      label: "",
      projectId: defaultProjectId ?? "",
      description: "",
      doi: "",
      itemKeys: [],
    });
    setInitializedProject(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultProjectId, defaultItemKey]);

  useEffect(() => {
    if (!open) return;
    if (!form.getValues("projectId") && projects.length > 0) {
      form.setValue("projectId", defaultProjectId ?? projects[0].id);
    }
  }, [open, projects, defaultProjectId, form]);

  useEffect(() => {
    if (!open || !projectId || initializedProject === projectId) return;
    if (candidates.length === 0) return;
    const preselected = candidates.filter((candidate) => candidate.key === defaultItemKey);
    form.setValue(
      "itemKeys",
      preselected.length > 0 ? preselected.map((candidate) => candidate.key) : candidates.map((candidate) => candidate.key),
    );
    setInitializedProject(projectId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, projectId, candidates, initializedProject, defaultItemKey]);

  const mutation = useMutation({
    mutationFn: (values: SnapshotFormValues) => snapshotsApi.create(values),
    onSuccess: (snapshot) => {
      toast.success("Snapshot created", {
        description: `“${snapshot.label}” froze ${snapshot.manifest.length} manifest entries.`,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.snapshots });
      queryClient.invalidateQueries({ queryKey: queryKeys.activity });
      queryClient.invalidateQueries({ queryKey: queryKeys.feed });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error("Could not create snapshot", { description: error.message });
    },
  });

  const toggleItem = (key: string, checked: boolean) => {
    form.setValue(
      "itemKeys",
      checked ? [...itemKeys, key] : itemKeys.filter((item) => item !== key),
      { shouldValidate: true },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="size-4 text-teal-600" aria-hidden="true" />
            Create research snapshot
          </DialogTitle>
          <DialogDescription>
            Select the artifacts to freeze. Manifest metadata is captured now and will not change
            when the source records are edited later.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
            className="space-y-5"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Snapshot label</FormLabel>
                    <FormControl>
                      <Input placeholder="Cohort A analysis freeze" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(next) => {
                        field.onChange(next);
                        setInitializedProject(null);
                        form.setValue("itemKeys", []);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a project" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
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
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder="Why capture this state, and what should reviewers know?"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="itemKeys"
              render={() => (
                <FormItem>
                  <FormLabel>Manifest</FormLabel>
                  <FormDescription>
                    {candidates.length === 0
                      ? "This project has no artifacts available to snapshot yet."
                      : `${itemKeys.length} of ${candidates.length} artifacts selected.`}
                  </FormDescription>
                  <div className="space-y-3 rounded-lg border border-border p-3">
                    {grouped.map((group) => (
                      <fieldset key={group.category} className="space-y-1.5">
                        <legend className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {categoryLabel[group.category]}
                        </legend>
                        {group.items.map((candidate) => {
                          const checked = itemKeys.includes(candidate.key);
                          return (
                            <label
                              key={candidate.key}
                              className="flex cursor-pointer items-start gap-2.5 rounded-md px-1.5 py-1 hover:bg-muted/50"
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(value) => toggleItem(candidate.key, value === true)}
                                className="mt-0.5"
                              />
                              <span className="min-w-0">
                                <span className="block truncate text-[12.5px] font-medium">
                                  {candidate.title}
                                </span>
                                <span className="block text-[11px] text-muted-foreground">
                                  {candidate.meta}
                                  {candidate.versionRef ? ` · ${candidate.versionRef}` : ""}
                                </span>
                              </span>
                            </label>
                          );
                        })}
                      </fieldset>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="doi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>DOI (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="10.5281/zenodo.1234567" {...field} />
                  </FormControl>
                  <FormDescription>
                    Only enter a DOI that actually exists. ResearchOS does not register DOIs and
                    will not invent one.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending || candidates.length === 0}>
                {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
                Create snapshot
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
