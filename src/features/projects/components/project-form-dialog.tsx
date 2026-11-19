import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addDays, format } from "date-fns";
import { Loader2, Plus } from "lucide-react";
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
import { TagInput } from "@/components/shared/tag-input";
import { projectStatusMeta } from "@/lib/constants";
import { queryKeys } from "@/lib/query-keys";
import type { Project } from "@/types";
import { projectsApi } from "../api";
import {
  projectSchema,
  type ProjectFormValues,
} from "../schema";

interface ProjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project;
}

function defaults(project?: Project): ProjectFormValues {
  return {
    title: project?.title ?? "",
    description: project?.description ?? "",
    objectives: project?.objectives.join("\n") ?? "",
    status: project?.status ?? "planning",
    startDate: project?.startDate.slice(0, 10) ?? format(new Date(), "yyyy-MM-dd"),
    targetDate:
      project?.targetDate.slice(0, 10) ??
      format(addDays(new Date(), 90), "yyyy-MM-dd"),
    tags: project?.tags ?? [],
    progress: project?.progress ?? 0,
  };
}

export function ProjectFormDialog({ open, onOpenChange, project }: ProjectFormDialogProps) {
  const queryClient = useQueryClient();
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: defaults(project),
  });

  useEffect(() => {
    if (open) form.reset(defaults(project));
  }, [open, project, form]);

  const mutation = useMutation({
    mutationFn: (values: ProjectFormValues) => {
      const payload = {
        title: values.title,
        description: values.description,
        objectives: (values.objectives ?? "")
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
        status: values.status,
        startDate: values.startDate,
        targetDate: values.targetDate,
        tags: values.tags,
        progress: values.progress,
      };
      return project
        ? projectsApi.update(project.id, payload)
        : projectsApi.create(payload);
    },
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      void queryClient.invalidateQueries({ queryKey: queryKeys.activity });
      toast.success(project ? "Project updated" : "Project created", {
        description: project
          ? `Changes to “${result.title}” are saved in this demo workspace.`
          : `“${result.title}” is ready in your workspace.`,
      });
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Could not save the project", {
        description: "Please review the form and try again.",
      });
    },
  });

  const status = form.watch("status");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{project ? "Edit project" : "Create a research project"}</DialogTitle>
          <DialogDescription>
            {project
              ? "Update the scope, timeline, and status of this project."
              : "Define the research question, timeline, and objectives. You can change all of this later."}
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
                  <FormLabel>Project title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Cortical dynamics of working memory" {...field} autoFocus />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="A concise summary of the research question and approach…"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="objectives"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Objectives</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder={"One objective per line\nCollect pilot data\nValidate the analysis pipeline"}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Add one objective per line. Keep them specific and measurable.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(projectStatusMeta).map(([value, meta]) => (
                          <SelectItem key={value} value={value}>
                            {meta.label}
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
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <TagInput value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormDescription>
                    Use 2–4 tags so this project is easy to filter later.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="progress"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Progress</FormLabel>
                    <span className="text-[12px] font-semibold tabular-nums text-teal-700 dark:text-teal-300">
                      {status === "completed" ? 100 : field.value}%
                    </span>
                  </div>
                  <FormControl>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={status === "completed" ? 100 : field.value}
                      onChange={(event) => field.onChange(Number(event.target.value))}
                      className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-teal-600"
                      aria-label="Project progress"
                    />
                  </FormControl>
                  <FormDescription>
                    A manual estimate of overall progress across tasks and milestones.
                  </FormDescription>
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
                ) : (
                  <Plus className="size-4" />
                )}
                {project ? "Save changes" : "Create project"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
