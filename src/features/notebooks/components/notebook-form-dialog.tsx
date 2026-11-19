import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, NotebookPen } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
import { queryKeys } from "@/lib/query-keys";
import { projectsApi } from "@/features/projects/api";
import { notebooksApi } from "../api";
import { notebookSchema, type NotebookFormValues } from "../schema";

interface NotebookFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultProjectId?: string;
  navigateOnCreate?: boolean;
}

const initialValues: NotebookFormValues = {
  title: "",
  description: "",
  projectId: "none",
  tags: [],
};

export function NotebookFormDialog({
  open,
  onOpenChange,
  defaultProjectId,
  navigateOnCreate = true,
}: NotebookFormDialogProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: projects = [] } = useQuery({
    queryKey: queryKeys.projects,
    queryFn: projectsApi.list,
    enabled: open,
  });

  const form = useForm<NotebookFormValues>({
    resolver: zodResolver(notebookSchema),
    defaultValues: { ...initialValues, projectId: defaultProjectId ?? "none" },
  });

  useEffect(() => {
    if (open) {
      form.reset({ ...initialValues, projectId: defaultProjectId ?? "none" });
    }
  }, [open, defaultProjectId, form]);

  const mutation = useMutation({
    mutationFn: (values: NotebookFormValues) =>
      notebooksApi.create({
        title: values.title,
        description: values.description,
        projectId: values.projectId === "none" ? null : values.projectId,
        tags: values.tags,
      }),
    onSuccess: (notebook) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notebooks });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      void queryClient.invalidateQueries({ queryKey: queryKeys.activity });
      toast.success("Notebook created", {
        description: "A first entry is ready for your notes.",
      });
      onOpenChange(false);
      if (navigateOnCreate) navigate(`/app/notebooks/${notebook.id}`);
    },
    onError: () => toast.error("Could not create the notebook"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New notebook</DialogTitle>
          <DialogDescription>
            Create a focused space for protocols, analysis logs, or reading notes.
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
                  <FormLabel>Notebook title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Cohort B analysis log" {...field} autoFocus />
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
                      placeholder="What will you capture in this notebook?"
                      {...field}
                    />
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
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a project" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Standalone notebook</SelectItem>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Linking a notebook keeps project activity and exports together.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <TagInput value={field.value} onChange={field.onChange} />
                  </FormControl>
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
                ) : (
                  <NotebookPen className="size-4" />
                )}
                Create & open
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
