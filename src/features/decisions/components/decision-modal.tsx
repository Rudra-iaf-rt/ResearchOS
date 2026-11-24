import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Scale, Trash2 } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { queryKeys } from "@/lib/query-keys";
import { decisionStatusMeta } from "@/lib/constants";
import { uid } from "@/lib/format";
import { artifactsApi } from "@/features/artifacts/api";
import { experimentsApi } from "@/features/experiments/api";
import { hypothesesApi } from "@/features/hypotheses/api";
import { projectsApi } from "@/features/projects/api";
import { decisionsApi } from "../api";
import { decisionSchema, type DecisionFormValues } from "../schema";
import type {
  DecisionAlternative,
  DecisionStatus,
  ResearchArtifactRef,
  ResearchArtifactType,
  ResearchDecision,
} from "@/types";

interface DecisionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  decision?: ResearchDecision | null;
  defaultProjectId?: string;
}

function AlternativesEditor({
  value,
  onChange,
}: {
  value: DecisionAlternative[];
  onChange: (next: DecisionAlternative[]) => void;
}) {
  const update = (id: string, patch: Partial<DecisionAlternative>) => {
    onChange(value.map((alternative) => (alternative.id === id ? { ...alternative, ...patch } : alternative)));
  };

  return (
    <div className="space-y-2">
      {value.length === 0 && (
        <p className="rounded-lg border border-dashed border-border bg-muted/30 px-3 py-3 text-center text-[12px] text-muted-foreground">
          No alternatives recorded. Adding the options you rejected makes the decision auditable.
        </p>
      )}
      {value.map((alternative, index) => (
        <div key={alternative.id} className="space-y-1.5 rounded-lg border border-border p-2.5">
          <div className="flex items-center gap-2">
            <Label htmlFor={`alt-${alternative.id}`} className="sr-only">
              Alternative {index + 1}
            </Label>
            <Input
              id={`alt-${alternative.id}`}
              value={alternative.title}
              placeholder={`Alternative ${index + 1}`}
              onChange={(event) => update(alternative.id, { title: event.target.value })}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-destructive"
              aria-label={`Remove alternative ${index + 1}`}
              onClick={() => onChange(value.filter((item) => item.id !== alternative.id))}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
          <Label htmlFor={`alt-rationale-${alternative.id}`} className="sr-only">
            Rationale for alternative {index + 1}
          </Label>
          <Input
            id={`alt-rationale-${alternative.id}`}
            value={alternative.rationale}
            placeholder="Why was this rejected or deferred?"
            onChange={(event) => update(alternative.id, { rationale: event.target.value })}
          />
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...value, { id: uid("alt"), title: "", rationale: "" }])}
      >
        <Plus className="size-3.5" />
        Add alternative
      </Button>
    </div>
  );
}

export function DecisionModal({
  open,
  onOpenChange,
  decision = null,
  defaultProjectId,
}: DecisionModalProps) {
  const queryClient = useQueryClient();
  const isEditing = Boolean(decision);

  const { data: projects = [] } = useQuery({
    queryKey: queryKeys.projects,
    queryFn: projectsApi.list,
    enabled: open,
  });
  const { data: experiments = [] } = useQuery({
    queryKey: queryKeys.experiments,
    queryFn: experimentsApi.list,
    enabled: open,
  });
  const { data: hypotheses = [] } = useQuery({
    queryKey: queryKeys.hypotheses,
    queryFn: hypothesesApi.list,
    enabled: open,
  });
  const { data: artifacts = [] } = useQuery({
    queryKey: queryKeys.artifacts,
    queryFn: artifactsApi.list,
    enabled: open,
  });

  const form = useForm<DecisionFormValues>({
    resolver: zodResolver(decisionSchema),
    defaultValues: {
      title: "",
      projectId: defaultProjectId ?? "",
      context: "",
      decision: "",
      alternatives: [],
      artifacts: [],
      status: "proposed",
    },
  });
  const projectId = form.watch("projectId");
  const selectedKeys = form.watch("artifacts");

  const options = useMemo(() => {
    const list: {
      key: string;
      type: ResearchArtifactType;
      id: string;
      label: string;
      group: string;
      projectId: string | null;
    }[] = [];
    experiments.forEach((experiment) => {
      list.push({
        key: `experiment:${experiment.id}`,
        type: "experiment",
        id: experiment.id,
        label: experiment.title,
        group: "Experiments",
        projectId: experiment.projectId,
      });
    });
    hypotheses.forEach((hypothesis) => {
      list.push({
        key: `hypothesis:${hypothesis.id}`,
        type: "hypothesis",
        id: hypothesis.id,
        label: hypothesis.statement,
        group: "Hypotheses",
        projectId: hypothesis.projectId,
      });
    });
    artifacts
      .filter((artifact) => ["notebook", "paper", "file"].includes(artifact.type))
      .forEach((artifact) => {
        list.push({
          key: `${artifact.type}:${artifact.id}`,
          type: artifact.type,
          id: artifact.id,
          label: artifact.label,
          group:
            artifact.type === "notebook"
              ? "Notebooks"
              : artifact.type === "paper"
                ? "Papers"
                : "Datasets & files",
          projectId: artifact.projectId,
        });
      });
    return list;
  }, [experiments, hypotheses, artifacts]);

  const eligible = options.filter(
    (option) => !projectId || option.projectId === projectId || option.projectId === null,
  );
  const grouped = useMemo(() => {
    const map = new Map<string, typeof eligible>();
    eligible.forEach((option) => {
      const list = map.get(option.group) ?? [];
      list.push(option);
      map.set(option.group, list);
    });
    return Array.from(map.entries());
  }, [eligible]);

  useEffect(() => {
    if (!open) return;
    if (decision) {
      form.reset({
        title: decision.title,
        projectId: decision.projectId,
        context: decision.context,
        decision: decision.decision,
        alternatives: structuredClone(decision.alternatives),
        artifacts: decision.artifacts.map((artifact) => `${artifact.type}:${artifact.id}`),
        status: decision.status,
      });
      return;
    }
    form.reset({
      title: "",
      projectId: defaultProjectId ?? projects[0]?.id ?? "",
      context: "",
      decision: "",
      alternatives: [],
      artifacts: [],
      status: "proposed",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, decision?.id, defaultProjectId]);

  const mutation = useMutation({
    mutationFn: (values: DecisionFormValues) => {
      const refs: ResearchArtifactRef[] = values.artifacts
        .map((key) => {
          const option = options.find((item) => item.key === key);
          if (option) return { type: option.type, id: option.id, label: option.label };
          const existing = decision?.artifacts.find(
            (artifact) => `${artifact.type}:${artifact.id}` === key,
          );
          return existing ?? null;
        })
        .filter((ref): ref is ResearchArtifactRef => Boolean(ref));
      const payload = {
        title: values.title,
        projectId: values.projectId,
        context: values.context,
        decision: values.decision,
        alternatives: values.alternatives,
        artifacts: refs,
        status: values.status,
      };
      return decision ? decisionsApi.update(decision.id, payload) : decisionsApi.create(payload);
    },
    onSuccess: (result) => {
      toast.success(isEditing ? "Decision updated" : "Decision recorded", {
        description: `“${result.title}” is ${result.status}.`,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.decisions });
      queryClient.invalidateQueries({ queryKey: queryKeys.graph });
      queryClient.invalidateQueries({ queryKey: queryKeys.activity });
      queryClient.invalidateQueries({ queryKey: queryKeys.feed });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error("Could not save decision", { description: error.message });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="size-4 text-violet-500" aria-hidden="true" />
            {isEditing ? "Edit decision" : "New research decision"}
          </DialogTitle>
          <DialogDescription>
            Record the context, the decision, and the alternatives you considered — the ADR-style
            record for this project.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Decision title</FormLabel>
                  <FormControl>
                    <Input placeholder="Use the 30-component ICA solution" {...field} />
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
                    <Select
                      value={field.value}
                      onValueChange={(next) => {
                        field.onChange(next);
                        form.setValue("artifacts", []);
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
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => field.onChange(value as DecisionStatus)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(Object.keys(decisionStatusMeta) as DecisionStatus[]).map((status) => (
                          <SelectItem key={status} value={status}>
                            {decisionStatusMeta[status].label}
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
              name="context"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Context</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="What forced this decision?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="decision"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Decision</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="What was decided, and why?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="alternatives"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alternatives considered</FormLabel>
                  <FormControl>
                    <AlternativesEditor value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="artifacts"
              render={() => (
                <FormItem>
                  <FormLabel>Linked artifacts</FormLabel>
                  <FormDescription>
                    Only this project’s records are suggested; artifacts without a project are also
                    available.
                  </FormDescription>
                  <div className="max-h-52 space-y-3 overflow-y-auto rounded-lg border border-border p-3">
                    {grouped.length === 0 ? (
                      <p className="text-[12px] text-muted-foreground">
                        No linkable artifacts in this project yet.
                      </p>
                    ) : (
                      grouped.map(([group, items]) => (
                        <fieldset key={group} className="space-y-1.5">
                          <legend className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            {group}
                          </legend>
                          {items.map((option) => (
                            <label
                              key={option.key}
                              className="flex cursor-pointer items-start gap-2.5 rounded-md px-1.5 py-1 hover:bg-muted/50"
                            >
                              <Checkbox
                                checked={selectedKeys.includes(option.key)}
                                onCheckedChange={(checked) =>
                                  form.setValue(
                                    "artifacts",
                                    checked === true
                                      ? [...selectedKeys, option.key]
                                      : selectedKeys.filter((key) => key !== option.key),
                                    { shouldValidate: true },
                                  )
                                }
                                className="mt-0.5"
                              />
                              <span className="min-w-0 truncate text-[12.5px]">{option.label}</span>
                            </label>
                          ))}
                        </fieldset>
                      ))
                    )}
                  </div>
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
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
                {isEditing ? "Save changes" : "Record decision"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
