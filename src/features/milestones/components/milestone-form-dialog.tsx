import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addDays, format } from "date-fns";
import { Flag, Loader2 } from "lucide-react";
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
import { milestoneStatusMeta } from "@/lib/constants";
import { queryKeys } from "@/lib/query-keys";
import { projectsApi } from "@/features/projects/api";
import type { Milestone } from "@/types";
import { milestonesApi } from "../api";
import { milestoneSchema, type MilestoneFormValues } from "../schema";

export function MilestoneFormDialog({
  open,
  onOpenChange,
  milestone,
  defaultProjectId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  milestone?: Milestone;
  defaultProjectId?: string;
}) {
  const queryClient = useQueryClient();
  const { data: projects = [] } = useQuery({
    queryKey: queryKeys.projects,
    queryFn: projectsApi.list,
    enabled: open,
  });

  const fallbackProjectId = defaultProjectId ?? projects[0]?.id ?? "";
  const defaults: MilestoneFormValues = {
    title: milestone?.title ?? "",
    description: milestone?.description ?? "",
    projectId: milestone?.projectId ?? fallbackProjectId,
    dueDate:
      milestone?.dueDate.slice(0, 10) ?? format(addDays(new Date(), 30), "yyyy-MM-dd"),
    status: milestone?.status ?? "upcoming",
    progress: milestone?.progress ?? 0,
  };

  const form = useForm<MilestoneFormValues>({
    resolver: zodResolver(milestoneSchema),
    defaultValues: defaults,
  });

  useEffect(() => {
    if (open) form.reset(defaults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, milestone, defaultProjectId, form]);

  const mutation = useMutation({
    mutationFn: (values: MilestoneFormValues) => {
      const payload = {
        ...values,
        description: values.description ?? "",
        progress: values.status === "completed" ? 100 : values.progress,
      };
      return milestone
        ? milestonesApi.update(milestone.id, payload)
        : milestonesApi.create(payload);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.milestones });
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      void queryClient.invalidateQueries({ queryKey: queryKeys.activity });
      toast.success(milestone ? "Milestone updated" : "Milestone created");
      onOpenChange(false);
    },
    onError: () => toast.error("Could not save the milestone"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{milestone ? "Edit milestone" : "New milestone"}</DialogTitle>
          <DialogDescription>
            Milestones mark decisions and deliverables that matter to the project.
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
                  <FormLabel>Milestone title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Primary analysis complete" {...field} autoFocus />
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
                      rows={2}
                      placeholder="What is true when this milestone is complete?"
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
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
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
                        {Object.entries(milestoneStatusMeta).map(([value, meta]) => (
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
                name="progress"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Progress</FormLabel>
                      <span className="text-[11px] font-semibold tabular-nums text-teal-700 dark:text-teal-300">
                        {form.watch("status") === "completed" ? 100 : field.value}%
                      </span>
                    </div>
                    <FormControl>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={form.watch("status") === "completed" ? 100 : field.value}
                        onChange={(event) => field.onChange(Number(event.target.value))}
                        className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-teal-600"
                        aria-label="Milestone progress"
                      />
                    </FormControl>
                    <FormDescription>An estimate, not a task count.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending || !form.watch("projectId")}>
                {mutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Flag className="size-4" />
                )}
                {milestone ? "Save changes" : "Create milestone"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
