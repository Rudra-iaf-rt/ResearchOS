import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Lightbulb, Loader2 } from "lucide-react";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { queryKeys } from "@/lib/query-keys";
import { projectsApi } from "@/features/projects/api";
import { hypothesesApi } from "../api";
import { hypothesisSchema, type HypothesisFormValues } from "../schema";
import type { Hypothesis } from "@/types";

interface HypothesisModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hypothesis?: Hypothesis | null;
  defaultProjectId?: string;
}

export function HypothesisModal({
  open,
  onOpenChange,
  hypothesis = null,
  defaultProjectId,
}: HypothesisModalProps) {
  const queryClient = useQueryClient();
  const isEditing = Boolean(hypothesis);

  const { data: projects = [] } = useQuery({
    queryKey: queryKeys.projects,
    queryFn: projectsApi.list,
    enabled: open,
  });

  const form = useForm<HypothesisFormValues>({
    resolver: zodResolver(hypothesisSchema),
    defaultValues: { researchQuestion: "", statement: "", projectId: "" },
  });

  useEffect(() => {
    if (!open) return;
    if (hypothesis) {
      form.reset({
        researchQuestion: hypothesis.researchQuestion,
        statement: hypothesis.statement,
        projectId: hypothesis.projectId,
      });
      return;
    }
    form.reset({
      researchQuestion: "",
      statement: "",
      projectId: defaultProjectId ?? projects[0]?.id ?? "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, hypothesis?.id, defaultProjectId]);

  const mutation = useMutation({
    mutationFn: (values: HypothesisFormValues) =>
      hypothesis
        ? hypothesesApi.update(hypothesis.id, values)
        : hypothesesApi.create(values),
    onSuccess: (result) => {
      toast.success(isEditing ? "Hypothesis updated" : "Hypothesis created", {
        description: `“${result.statement}” is in the ${result.status} column.`,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.hypotheses });
      queryClient.invalidateQueries({ queryKey: queryKeys.experiments });
      queryClient.invalidateQueries({ queryKey: queryKeys.graph });
      queryClient.invalidateQueries({ queryKey: queryKeys.activity });
      queryClient.invalidateQueries({ queryKey: queryKeys.feed });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error("Could not save hypothesis", { description: error.message });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="size-4 text-amber-500" aria-hidden="true" />
            {isEditing ? "Edit hypothesis" : "New hypothesis"}
          </DialogTitle>
          <DialogDescription>
            State the question and the testable prediction. New hypotheses start in Proposed.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
            className="space-y-4"
          >
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
              name="researchQuestion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Research question</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Does…?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="statement"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hypothesis statement</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="A testable prediction that evidence can support or contradict."
                      {...field}
                    />
                  </FormControl>
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
                {isEditing ? "Save changes" : "Create hypothesis"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
