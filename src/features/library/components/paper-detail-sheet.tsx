import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Check,
  CheckCheck,
  Clock,
  Copy,
  ExternalLink,
  FileText,
  Highlighter,
  Loader2,
  Pencil,
  Quote,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/input";
import { PaperStatusBadge } from "@/components/shared/status-badge";
import { formatDate, formatNumber, fromNow } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import type { Paper, PaperReadStatus } from "@/types";
import { libraryApi } from "../api";
import { doiUrl, formatCitation } from "../lib";

const readStatuses: { value: PaperReadStatus; label: string; icon: typeof Check }[] = [
  { value: "unread", label: "Unread", icon: BookOpen },
  { value: "reading", label: "Reading", icon: Clock },
  { value: "read", label: "Read", icon: CheckCheck },
];

export function PaperDetailSheet({
  paper,
  projectTitle,
  open,
  onOpenChange,
  onEdit,
}: {
  paper: Paper | null;
  projectTitle?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (paper: Paper) => void;
}) {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState(paper?.notes ?? "");

  useEffect(() => {
    setNotes(paper?.notes ?? "");
  }, [paper?.id, paper?.notes]);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.papers });
    void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    void queryClient.invalidateQueries({ queryKey: queryKeys.activity });
  };

  const saveNotes = useMutation({
    mutationFn: () => {
      if (!paper) throw new Error("No paper selected");
      return libraryApi.update(paper.id, { notes: notes.trim() });
    },
    onSuccess: () => {
      refresh();
      toast.success("Reading notes saved", {
        description: "Stored in your local demo workspace.",
      });
    },
    onError: () => toast.error("Could not save notes"),
  });

  const setStatus = useMutation({
    mutationFn: (status: PaperReadStatus) => {
      if (!paper) throw new Error("No paper selected");
      return libraryApi.setReadStatus(paper.id, status);
    },
    onSuccess: () => refresh(),
    onError: () => toast.error("Could not update reading status"),
  });

  const toggleFavorite = useMutation({
    mutationFn: () => {
      if (!paper) throw new Error("No paper selected");
      return libraryApi.toggleFavorite(paper.id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.papers });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });

  const copyCitation = () => {
    if (!paper) return;
    void navigator.clipboard?.writeText(formatCitation(paper));
    toast.success("Citation copied", { description: "Plain-text citation copied to clipboard." });
  };

  const dirty = Boolean(paper) && notes.trim() !== (paper?.notes ?? "").trim();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-[96%] max-w-2xl flex-col gap-0 p-0">
        {paper && (
          <>
            <SheetHeader className="shrink-0 gap-3 border-b border-border p-6 pr-12">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="font-normal">
                  <BookOpen className="size-3" /> Journal article
                </Badge>
                <PaperStatusBadge status={paper.readStatus} />
                {paper.favorite && (
                  <span className="inline-flex items-center gap-1 text-[10.5px] font-medium text-amber-700 dark:text-amber-300">
                    <Star className="size-3 fill-amber-400 text-amber-500" /> Favorite
                  </span>
                )}
              </div>
              <SheetTitle className="text-[19px] leading-snug tracking-[-0.02em]">
                {paper.title}
              </SheetTitle>
              <SheetDescription className="text-[12.5px]">
                {paper.authors.join(", ")}
              </SheetDescription>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-muted-foreground">
                <span className="font-medium text-foreground/80">{paper.journal}</span>
                <span className="size-0.5 rounded-full bg-border" />
                <span>{paper.year}</span>
                <span className="size-0.5 rounded-full bg-border" />
                <span className="inline-flex items-center gap-1">
                  <Quote className="size-3" /> {formatNumber(paper.citations)} citations
                </span>
                <span className="size-0.5 rounded-full bg-border" />
                <span>Added {fromNow(paper.addedAt)}</span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {readStatuses.map((status) => {
                  const Icon = status.icon;
                  const active = paper.readStatus === status.value;
                  return (
                    <button
                      key={status.value}
                      type="button"
                      onClick={() => setStatus.mutate(status.value)}
                      disabled={setStatus.isPending}
                      aria-pressed={active}
                      className={cn(
                        "inline-flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-[11px] font-medium transition-colors disabled:opacity-60",
                        active
                          ? "border-teal-600 bg-teal-600 text-white dark:border-teal-500 dark:bg-teal-500/20 dark:text-teal-200"
                          : "border-border bg-card text-muted-foreground hover:border-navy-300 hover:text-foreground dark:hover:border-navy-500",
                      )}
                    >
                      <Icon className="size-3" /> {status.label}
                    </button>
                  );
                })}
                <span className="mx-0.5 h-4 w-px bg-border" />
                <Button variant="ghost" size="sm" className="h-7 px-2" onClick={copyCitation}>
                  <Copy className="size-3" /> Citation
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => toggleFavorite.mutate()}
                  aria-pressed={paper.favorite}
                >
                  <Star
                    className={cn(
                      "size-3",
                      paper.favorite && "fill-amber-400 text-amber-500",
                    )}
                  />
                  {paper.favorite ? "Favorited" : "Favorite"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => onEdit(paper)}
                >
                  <Pencil className="size-3" /> Edit
                </Button>
              </div>
            </SheetHeader>

            <Tabs defaultValue="overview" className="flex min-h-0 flex-1 flex-col">
              <div className="shrink-0 border-b border-border px-6 pt-3">
                <TabsList className="h-8 bg-transparent p-0">
                  <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent px-2.5 data-[state=active]:border-teal-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none dark:data-[state=active]:border-teal-400">
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="rounded-none border-b-2 border-transparent px-2.5 data-[state=active]:border-teal-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none dark:data-[state=active]:border-teal-400">
                    Notes
                    {paper.notes?.trim() && (
                      <span className="size-1.5 rounded-full bg-teal-500" aria-label="Has notes" />
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="rounded-none border-b-2 border-transparent px-2.5 data-[state=active]:border-teal-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none dark:data-[state=active]:border-teal-400">
                    Preview
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-6 scrollbar-thin">
                <TabsContent value="overview" className="mt-0 space-y-5">
                  <section>
                    <h3 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                      <FileText className="size-3.5" /> Abstract
                    </h3>
                    <p className="mt-2 text-[12.5px] leading-relaxed text-foreground/90">
                      {paper.abstract || "No abstract was saved with this citation."}
                    </p>
                  </section>

                  {paper.tags.length > 0 && (
                    <section>
                      <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                        Keywords
                      </h3>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {paper.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="font-normal">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </section>
                  )}

                  <section className="rounded-xl border border-border bg-muted/25">
                    <dl className="divide-y divide-border text-[12px]">
                      <div className="flex items-start justify-between gap-4 px-4 py-2.5">
                        <dt className="text-muted-foreground">Journal</dt>
                        <dd className="text-right font-medium">{paper.journal}</dd>
                      </div>
                      <div className="flex items-start justify-between gap-4 px-4 py-2.5">
                        <dt className="text-muted-foreground">Published</dt>
                        <dd className="text-right font-medium">{paper.year}</dd>
                      </div>
                      <div className="flex items-start justify-between gap-4 px-4 py-2.5">
                        <dt className="text-muted-foreground">Project</dt>
                        <dd className="text-right font-medium">
                          {projectTitle ?? "Not linked"}
                        </dd>
                      </div>
                      <div className="flex items-start justify-between gap-4 px-4 py-2.5">
                        <dt className="text-muted-foreground">Date added</dt>
                        <dd className="text-right font-medium">{formatDate(paper.addedAt)}</dd>
                      </div>
                      <div className="flex items-start justify-between gap-4 px-4 py-2.5">
                        <dt className="shrink-0 text-muted-foreground">DOI</dt>
                        <dd className="min-w-0 text-right">
                          {paper.doi ? (
                            <a
                              href={doiUrl(paper.doi)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex max-w-full items-center gap-1 break-all font-medium text-teal-700 hover:underline dark:text-teal-300"
                            >
                              <span className="truncate">{paper.doi}</span>
                              <ExternalLink className="size-3 shrink-0" />
                            </a>
                          ) : (
                            <span className="text-muted-foreground">Not available</span>
                          )}
                        </dd>
                      </div>
                    </dl>
                  </section>

                  <div className="flex flex-wrap gap-2">
                    {paper.doi && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={doiUrl(paper.doi)} target="_blank" rel="noreferrer">
                          <ExternalLink className="size-3.5" /> Open publisher page
                        </a>
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={copyCitation}>
                      <Quote className="size-3.5" /> Copy citation
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="notes" className="mt-0 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="flex items-center gap-1.5 text-[13px] font-semibold">
                        <Highlighter className="size-3.5 text-amber-500" /> Reading notes
                      </h3>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        Private to this demo workspace. Saved in your browser.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => saveNotes.mutate()}
                      disabled={!dirty || saveNotes.isPending}
                    >
                      {saveNotes.isPending ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Check className="size-3.5" />
                      )}
                      Save notes
                    </Button>
                  </div>
                  <Textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    rows={14}
                    placeholder="Key findings, methods worth reusing, questions to follow up…"
                    className="min-h-[260px] resize-y text-[12.5px] leading-relaxed"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    {dirty ? "Unsaved changes." : "All changes saved."}
                  </p>
                </TabsContent>

                <TabsContent value="preview" className="mt-0">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-800 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200">
                    <span>
                      <strong className="font-semibold">Typeset demo preview.</strong> No PDF file is
                      attached in this prototype.
                    </span>
                    <Badge variant="warning" className="shrink-0">
                      Sample layout
                    </Badge>
                  </div>

                  <div className="mx-auto max-w-[460px] rounded-sm border border-border bg-white p-6 text-slate-900 shadow-raised dark:border-navy-600">
                    <p className="text-center text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                      {paper.journal}
                    </p>
                    <h4 className="mt-3 text-center text-[15px] font-semibold leading-snug">
                      {paper.title}
                    </h4>
                    <p className="mt-2 text-center text-[9px] text-slate-600">
                      {paper.authors.join(" · ")}
                    </p>
                    <p className="mt-1 text-center text-[8.5px] text-slate-500">
                      {paper.year} · doi:{paper.doi || "not assigned"}
                    </p>
                    <div className="my-4 h-px bg-slate-200" />
                    <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Abstract
                    </p>
                    <p className="mt-1 text-justify text-[7.5px] leading-[1.6] text-slate-700">
                      {paper.abstract ||
                        "This citation does not include an abstract. In a full research workspace the PDF viewer would render the publisher-supplied document here."}
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <div className="h-1.5 rounded-full bg-slate-200" />
                        <div className="h-1.5 rounded-full bg-slate-200" />
                        <div className="h-1.5 w-10/12 rounded-full bg-slate-200" />
                        <div className="h-1.5 w-11/12 rounded-full bg-slate-200" />
                        <div className="h-1.5 w-9/12 rounded-full bg-slate-200" />
                        <div className="h-1.5 w-full rounded-full bg-slate-200" />
                      </div>
                      <div className="space-y-1">
                        <div className="h-1.5 rounded-full bg-slate-200" />
                        <div className="h-1.5 w-10/12 rounded-full bg-slate-200" />
                        <div className="h-1.5 rounded-full bg-slate-200" />
                        <div className="h-1.5 w-8/12 rounded-full bg-slate-200" />
                        <div className="h-1.5 w-11/12 rounded-full bg-slate-200" />
                      </div>
                    </div>
                    <div className="mt-4 flex h-20 items-end gap-1.5 rounded border border-slate-200 bg-slate-50 p-2">
                      {[32, 48, 42, 60, 52, 72, 64].map((height, index) => (
                        <span
                          key={index}
                          className="flex-1 rounded-sm bg-slate-300"
                          style={{ height: `${height}%` }}
                        />
                      ))}
                    </div>
                    <p className="mt-2 text-center text-[7px] italic text-slate-500">
                      Figure 1. Illustrative figure placeholder for the demo preview.
                    </p>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
