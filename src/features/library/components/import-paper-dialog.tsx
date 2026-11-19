import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileInput, Loader2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { queryKeys } from "@/lib/query-keys";
import { libraryApi } from "../api";
import { parseBibtex, sampleBibtex } from "../lib";

export function ImportPaperDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const papers = parseBibtex(text);
      if (papers.length === 0) {
        throw new Error("No valid BibTeX entries found. Include a title for each entry.");
      }
      for (const paper of papers) {
        await libraryApi.create(paper);
      }
      return papers.length;
    },
    onSuccess: (count) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.papers });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      void queryClient.invalidateQueries({ queryKey: queryKeys.activity });
      toast.success(`Imported ${count} paper${count === 1 ? "" : "s"}`, {
        description: "Citations were added to your local demo library.",
      });
      setText("");
      setError(null);
      onOpenChange(false);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Could not import these entries.");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import from BibTeX</DialogTitle>
          <DialogDescription>
            Paste one or more BibTeX entries. We parse the title, authors, year, journal, DOI,
            abstract, and keywords.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="bibtex">BibTeX</Label>
            <button
              type="button"
              onClick={() => {
                setText(sampleBibtex);
                setError(null);
              }}
              className="text-[11px] font-medium text-teal-700 hover:underline dark:text-teal-300"
            >
              Insert an example
            </button>
          </div>
          <Textarea
            id="bibtex"
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setError(null);
            }}
            rows={10}
            placeholder={sampleBibtex}
            className="font-mono text-[11.5px] leading-relaxed"
            spellCheck={false}
          />
          {error && <p className="text-[11.5px] font-medium text-destructive">{error}</p>}
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Importing does not download any files. Entries are saved as metadata in this browser.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!text.trim() || mutation.isPending}
          >
            {mutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FileInput className="size-4" />
            )}
            Import entries
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
