import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookPlus, Loader2 } from "lucide-react";
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
import type { Paper } from "@/types";
import { libraryApi } from "../api";
import { paperSchema, type PaperFormValues } from "../schema";

const initialValues: PaperFormValues = {
  title: "",
  authors: "",
  year: new Date().getFullYear(),
  journal: "",
  doi: "",
  abstract: "",
  projectId: "none",
  tags: [],
  notes: "",
};

function valuesFor(paper: Paper | undefined, defaultProjectId?: string): PaperFormValues {
  if (!paper) {
    return { ...initialValues, projectId: defaultProjectId ?? "none" };
  }
  return {
    title: paper.title,
    authors: paper.authors.join(", "),
    year: paper.year,
    journal: paper.journal,
    doi: paper.doi,
    abstract: paper.abstract,
    projectId: paper.projectId ?? "none",
    tags: paper.tags,
    notes: paper.notes ?? "",
  };
}

export function PaperFormDialog({
  open,
  onOpenChange,
  defaultProjectId,
  paper,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultProjectId?: string;
  paper?: Paper;
}) {
  const queryClient = useQueryClient();
  const { data: projects = [] } = useQuery({
    queryKey: queryKeys.projects,
    queryFn: projectsApi.list,
    enabled: open,
  });

  const form = useForm<PaperFormValues>({
    resolver: zodResolver(paperSchema),
    defaultValues: valuesFor(paper, defaultProjectId),
  });

  useEffect(() => {
    if (open) {
      form.reset(valuesFor(paper, defaultProjectId));
    }
  }, [open, paper, defaultProjectId, form]);

  const mutation = useMutation({
    mutationFn: (values: PaperFormValues) => {
      const input = {
        title: values.title,
        authors: values.authors.split(",").map((a) => a.trim()).filter(Boolean),
        year: values.year,
        journal: values.journal,
        doi: values.doi ?? "",
        abstract: values.abstract ?? "",
        projectId: values.projectId === "none" ? null : values.projectId,
        tags: values.tags,
        notes: values.notes,
      };
      return paper ? libraryApi.update(paper.id, input) : libraryApi.create(input);
    },
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.papers });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      void queryClient.invalidateQueries({ queryKey: queryKeys.activity });
      toast.success(paper ? "Paper updated" : "Paper added to library", {
        description: paper
          ? `“${saved.title}” was updated in your local demo library.`
          : `“${saved.title}” is ready to read.`,
      });
      onOpenChange(false);
    },
    onError: () => toast.error(paper ? "Could not update the paper" : "Could not add the paper"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{paper ? "Edit paper metadata" : "Add a research paper"}</DialogTitle>
          <DialogDescription>
            {paper
              ? "Update the citation, abstract, tags, or private notes for this paper."
              : "Save the citation and abstract now; you can refine notes and reading status later."}
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
                  <FormLabel>Paper title</FormLabel>
                  <FormControl>
                    <Input placeholder="Full title of the publication" {...field} autoFocus />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="authors"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Authors</FormLabel>
                    <FormControl>
                      <Input placeholder="A. Researcher, B. Scientist" {...field} />
                    </FormControl>
                    <FormDescription>Comma-separated.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year</FormLabel>
                    <FormControl>
                      <Input type="number" min={1800} max={2100} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="journal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Journal / venue</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Nature Neuroscience" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="doi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>DOI</FormLabel>
                    <FormControl>
                      <Input placeholder="10.1038/…" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="abstract"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Abstract</FormLabel>
                  <FormControl>
                    <Textarea rows={4} placeholder="Paste the abstract…" {...field} />
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
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Unlinked</SelectItem>
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
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <TagInput value={field.value} onChange={field.onChange} maxTags={6} />
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
                  <FormLabel>Private notes</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder="Why does this paper matter to your work?"
                      {...field}
                    />
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
                  <BookPlus className="size-4" />
                )}
                {paper ? "Save changes" : "Add to library"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
