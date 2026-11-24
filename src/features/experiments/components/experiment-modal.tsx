import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FlaskConical, Loader2 } from "lucide-react";
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { queryKeys } from "@/lib/query-keys";
import { experimentsApi } from "@/features/experiments/api";
import { hypothesesApi } from "@/features/hypotheses/api";
import { projectsApi } from "@/features/projects/api";
import { ParameterEditor } from "./parameter-editor";
import { experimentSchema, type ExperimentFormValues } from "../schema";
import type { Experiment } from "@/types";

interface ExperimentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  experiment?: Experiment | null;
  defaultProjectId?: string;
  defaultHypothesisId?: string;
}

const emptyValues: ExperimentFormValues = {
  title: "",
  projectId: "",
  hypothesisId: "",
  description: "",
  parameters: [],
};

export function ExperimentModal({
  open,
  onOpenChange,
  experiment = null,
  defaultProjectId,
  defaultHypothesisId,
}: ExperimentModalProps) {
  const queryClient = useQueryClient();
  const isEditing = Boolean(experiment);

  const { data: projects = [] } = useQuery({
    queryKey: queryKeys.projects,
    queryFn: projectsApi.list,
    enabled: open,
  });
  const { data: hypotheses = [] } = useQuery({
    queryKey: queryKeys.hypotheses,
    queryFn: hypothesesApi.list,
    enabled: open,
  });

  const form = useForm<ExperimentFormValues>({
    resolver: zodResolver(experimentSchema),
    defaultValues: emptyValues,
  });

  const projectId = form.watch("projectId");
  const eligibleHypotheses = hypotheses.filter(
    (hypothesis) => !projectId || hypothesis.projectId === projectId,
  );

  useEffect(() => {
    if (!open) return;
    if (experiment) {
      form.reset({
        title: experiment.title,
        projectId: experiment.projectId,
        hypothesisId: experiment.hypothesisId ?? "",
        description: experiment.description,
        parameters: structuredClone(experiment.parameters),
      });
      return;
    }
    form.reset({
      ...emptyValues,
      projectId: defaultProjectId ?? projects[0]?.id ?? "",
      hypothesisId: defaultHypothesisId ?? "",
    });
    // form/projects identity changes are not relevant; reset only on open/seed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, experiment?.id, defaultProjectId, defaultHypothesisId]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.experiments });
    queryClient.invalidateQueries({ queryKey: queryKeys.hypotheses });
    queryClient.invalidateQueries({ queryKey: queryKeys.graph });
    queryClient.invalidateQueries({ queryKey: queryKeys.activity });
    queryClient.invalidateQueries({ queryKey: queryKeys.feed });
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
  };

  const mutation = useMutation({
    mutationFn: async (values: ExperimentFormValues) => {
      const payload = {
        title: values.title,
        projectId: values.projectId,
        hypothesisId: values.hypothesisId || null,
        description: values.description,
        parameters: values.parameters,
      };
      if (experiment) {
        return experimentsApi.update(experiment.id, payload);
      }
      return experimentsApi.create(payload);
    },
    onSuccess: (result) => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: queryKeys.experiment(result.id) });
      toast.success(isEditing ? "Experiment updated" : "Experiment created", {
        description: isEditing
          ? `“${result.title}” was saved.`
          : `“${result.title}” starts in draft. Add a run when you are ready.`,
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error("Could not save experiment", { description: error.message });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="size-4 text-teal-600" aria-hidden="true" />
            {isEditing ? "Edit experiment" : "New experiment"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the experiment record. Parameter edits are versioned from the Parameters tab."
              : "Describe the experiment and record the parameters it depends on."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
            className="space-y-5"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Cohort B — replication" {...field} />
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
                        const linked = hypotheses.find(
                          (item) =>
                            item.id === form.getValues("hypothesisId") &&
                            item.projectId !== next,
                        );
                        if (linked) form.setValue("hypothesisId", "");
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
                name="hypothesisId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Linked hypothesis</FormLabel>
                    <Select
                      value={field.value || "none"}
                      onValueChange={(value) =>
                        field.onChange(value === "none" ? "" : value)
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Optional" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No linked hypothesis</SelectItem>
                        {eligibleHypotheses.map((hypothesis) => (
                          <SelectItem key={hypothesis.id} value={hypothesis.id}>
                            {hypothesis.statement}
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
                      rows={3}
                      placeholder="What does this experiment test, and what does success look like?"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="parameters"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Parameters</FormLabel>
                  <FormDescription>
                    Runs capture a frozen copy of these values at creation time.
                  </FormDescription>
                  <FormControl>
                    <ParameterEditor
                      value={field.value}
                      onChange={field.onChange}
                      error={fieldState.error?.message}
                    />
                  </FormControl>
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
                {isEditing ? "Save changes" : "Create experiment"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
