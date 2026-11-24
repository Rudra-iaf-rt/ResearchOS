import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
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
import { evidenceStanceMeta } from "@/lib/constants";
import { artifactsApi } from "@/features/artifacts/api";
import { evidenceApi } from "@/features/evidence/api";
import { evidenceSchema, type EvidenceFormValues } from "../schema";
import type { ArtifactType, EvidenceStance } from "@/types";

const artifactTypeOrder: Record<string, number> = {
  notebook: 0,
  paper: 1,
  file: 2,
  project: 3,
  task: 4,
  milestone: 5,
};

export function EvidenceForm({ hypothesisId }: { hypothesisId: string }) {
  const queryClient = useQueryClient();

  const { data: artifacts = [] } = useQuery({
    queryKey: queryKeys.artifacts,
    queryFn: artifactsApi.list,
  });

  const options = [...artifacts].sort((a, b) => {
    const order = (artifactTypeOrder[a.type] ?? 9) - (artifactTypeOrder[b.type] ?? 9);
    return order !== 0 ? order : a.label.localeCompare(b.label);
  });

  const form = useForm<EvidenceFormValues>({
    resolver: zodResolver(evidenceSchema),
    defaultValues: { stance: "supports", artifactKey: "none", description: "" },
  });

  const mutation = useMutation({
    mutationFn: (values: EvidenceFormValues) => {
      const [type, ...rest] = values.artifactKey.split(":");
      const artifactId = rest.join(":");
      return evidenceApi.create(hypothesisId, {
        stance: values.stance,
        description: values.description,
        artifactType: artifactId ? (type as ArtifactType) : null,
        artifactId: artifactId || null,
      });
    },
    onSuccess: (evidence) => {
      toast.success("Evidence recorded", {
        description:
          evidence.stance === "supports"
            ? "The hypothesis gained supporting evidence."
            : evidence.stance === "contradicts"
              ? "The hypothesis gained contradicting evidence."
              : "Neutral evidence was recorded.",
      });
      form.reset({ stance: "supports", artifactKey: "none", description: "" });
      queryClient.invalidateQueries({ queryKey: queryKeys.evidence(hypothesisId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.evidenceAll });
      queryClient.invalidateQueries({ queryKey: queryKeys.hypotheses });
      queryClient.invalidateQueries({ queryKey: queryKeys.graph });
      queryClient.invalidateQueries({ queryKey: queryKeys.activity });
      queryClient.invalidateQueries({ queryKey: queryKeys.feed });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
    },
    onError: (error: Error) => {
      toast.error("Could not add evidence", { description: error.message });
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        className="space-y-3 rounded-lg border border-border bg-muted/20 p-3"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="stance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stance</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(value) => field.onChange(value as EvidenceStance)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(Object.keys(evidenceStanceMeta) as EvidenceStance[]).map((stance) => (
                      <SelectItem key={stance} value={stance}>
                        {evidenceStanceMeta[stance].label}
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
                <FormLabel>Linked artifact</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Optional artifact" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">No linked artifact</SelectItem>
                    {options.map((artifact) => (
                      <SelectItem
                        key={`${artifact.type}:${artifact.id}`}
                        value={`${artifact.type}:${artifact.id}`}
                      >
                        {artifact.label}
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
              <FormLabel>What does this evidence show?</FormLabel>
              <FormControl>
                <Textarea rows={2} placeholder="Summarise the finding and why it matters." {...field} />
              </FormControl>
              <FormDescription>
                Evidence is attached to this hypothesis only and never edits the linked artifact.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" size="sm" disabled={mutation.isPending}>
          {mutation.isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Plus className="size-3.5" />
          )}
          Add evidence
        </Button>
      </form>
    </Form>
  );
}
