import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import LinkExtension from "@tiptap/extension-link";
import ImageExtension from "@tiptap/extension-image";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import {
  ArrowLeft,
  BookOpen,
  Check,
  Download,
  FileJson,
  FileText,
  FolderKanban,
  Loader2,
  MoreHorizontal,
  NotebookPen,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TagInput } from "@/components/shared/tag-input";
import { PersonAvatar } from "@/components/shared/avatar-group";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeaderSkeleton } from "@/components/shared/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { fromNow, downloadBlob, slugify, formatDate } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import type { NotebookEntry, Paper } from "@/types";
import { projectsApi } from "@/features/projects/api";
import { libraryApi } from "@/features/library/api";
import { useUiStore } from "@/store/ui-store";
import { notebooksApi } from "../api";
import { countWords, htmlToMarkdown } from "../lib";
import { EditorToolbar } from "../components/editor-toolbar";
import { NotebookOutline } from "@/features/graph/components/notebook-outline";

function EntryEditor({
  entry,
  entryTitle,
  onEntryTitleChange,
  papers,
  onChange,
  onEditorReady,
}: {
  entry: NotebookEntry;
  entryTitle: string;
  onEntryTitleChange: (title: string) => void;
  papers: Paper[];
  onChange: (content: string) => void;
  onEditorReady?: (editor: Editor | null) => void;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Placeholder.configure({
        placeholder: "Start writing. Record the question, the method, and what you observed…",
      }),
      LinkExtension.configure({ openOnClick: false, autolink: true }),
      ImageExtension,
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content: entry.content,
    editorProps: {
      attributes: {
        class: "focus:outline-none",
        spellcheck: "true",
      },
    },
    onUpdate: ({ editor: instance }) => {
      onChange(instance.getHTML());
    },
  });

  useEffect(() => {
    onEditorReady?.(editor);
    return () => onEditorReady?.(null);
  }, [editor, onEditorReady]);

  if (!editor) {
    return (
      <div className="space-y-3 px-6 py-8">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-10/12" />
      </div>
    );
  }

  return (
    <>
      <div className="sticky top-16 z-10 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/85">
        <EditorToolbar editor={editor} papers={papers} />
      </div>
      <div className="px-5 pb-10 pt-6 sm:px-10">
        <div className="mx-auto max-w-[72ch]">
          <input
            value={entryTitle}
            onChange={(event) => onEntryTitleChange(event.target.value)}
            aria-label="Entry title"
            placeholder="Untitled entry"
            className="w-full bg-transparent text-[18px] font-semibold leading-snug tracking-[-0.015em] outline-none placeholder:text-muted-foreground/40"
          />
          <div className="mb-5 mt-3 h-px w-full bg-border" />
          <EditorContent editor={editor} className="notebook-editor" />
        </div>
        <div className="mx-auto mt-8 flex max-w-[72ch] items-center justify-between border-t border-border pt-3 text-[10.5px] text-muted-foreground">
          <span>
            {countWords(editor.getText())} words · {editor.getText().length} characters
          </span>
          <span>Markdown shortcuts supported</span>
        </div>
      </div>
    </>
  );
}

export function NotebookEditorPage() {
  const { notebookId: id = "" } = useParams<{ notebookId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: notebooks = [], isLoading } = useQuery({
    queryKey: queryKeys.notebooks,
    queryFn: notebooksApi.list,
  });
  const { data: projects = [] } = useQuery({
    queryKey: queryKeys.projects,
    queryFn: projectsApi.list,
  });
  const { data: papers = [] } = useQuery({
    queryKey: queryKeys.papers,
    queryFn: libraryApi.list,
  });

  const notebook = notebooks.find((item) => item.id === id);

  const recordArtifactView = useUiStore((state) => state.recordArtifactView);

  useEffect(() => {
    if (!notebook) return;
    recordArtifactView({
      type: "notebook",
      id: notebook.id,
      label: notebook.title,
      href: `/app/notebooks/${notebook.id}`,
      projectId: notebook.projectId,
    });
  }, [notebook, recordArtifactView]);

  const [selectedEntryId, setSelectedEntryId] = useState<string>("");
  const [notebookTitle, setNotebookTitle] = useState("");
  const [entryTitle, setEntryTitle] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [dirty, setDirty] = useState(false);
  const [revision, setRevision] = useState(0);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [entryEditor, setEntryEditor] = useState<Editor | null>(null);
  const draftRef = useRef({
    notebookTitle: "",
    entryId: "",
    entryTitle: "",
    content: "",
  });
  const initializedRef = useRef("");

  useEffect(() => {
    if (!notebook) return;
    const initialEntry = notebook.entries[notebook.entries.length - 1];
    if (!initialEntry) return;

    if (initializedRef.current !== notebook.id) {
      initializedRef.current = notebook.id;
      setNotebookTitle(notebook.title);
      setTags(notebook.tags);
      setSelectedEntryId(initialEntry.id);
      setEntryTitle(initialEntry.title);
      draftRef.current = {
        notebookTitle: notebook.title,
        entryId: initialEntry.id,
        entryTitle: initialEntry.title,
        content: initialEntry.content,
      };
      return;
    }

    // Keep metadata in sync after saves without clobbering in-flight edits.
    setTags((current) =>
      current.length === notebook.tags.length &&
      current.every((tag, index) => tag === notebook.tags[index])
        ? current
        : notebook.tags,
    );
  }, [notebook]);

  const save = useMutation({
    mutationFn: (draft: typeof draftRef.current) =>
      notebooksApi.saveDocument(notebook?.id ?? id, draft.entryId, {
        title: draft.notebookTitle,
        entryTitle: draft.entryTitle,
        content: draft.content,
      }),
    onSuccess: (_data, variables) => {
      const current = draftRef.current;
      const unchanged =
        current.entryId === variables.entryId &&
        current.content === variables.content &&
        current.entryTitle === variables.entryTitle &&
        current.notebookTitle === variables.notebookTitle;
      if (unchanged) setDirty(false);
      setLastSavedAt(new Date());
      void queryClient.invalidateQueries({ queryKey: queryKeys.notebooks });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
    onError: () => toast.error("Autosave failed", { description: "Your latest changes are still in this tab." }),
  });

  const markDirty = (patch: Partial<typeof draftRef.current>) => {
    draftRef.current = { ...draftRef.current, ...patch };
    setDirty(true);
    setRevision((value) => value + 1);
  };

  const saveMutate = save.mutate;
  useEffect(() => {
    if (!dirty) return;
    const timer = window.setTimeout(() => {
      saveMutate(draftRef.current);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [dirty, revision, saveMutate]);

  const selectedEntry =
    notebook?.entries.find((entry) => entry.id === selectedEntryId) ??
    notebook?.entries[notebook.entries.length - 1];

  const projectPapers = useMemo(
    () =>
      notebook?.projectId
        ? papers.filter((paper) => paper.projectId === notebook.projectId)
        : papers,
    [papers, notebook?.projectId],
  );

  const switchEntry = (entryId: string) => {
    if (!notebook || entryId === selectedEntry?.id) return;
    if (dirty) save.mutate(draftRef.current);
    const entry = notebook.entries.find((item) => item.id === entryId);
    if (!entry) return;
    setSelectedEntryId(entry.id);
    setEntryTitle(entry.title);
    draftRef.current = {
      notebookTitle,
      entryId: entry.id,
      entryTitle: entry.title,
      content: entry.content,
    };
    setDirty(false);
  };

  const addEntry = useMutation({
    mutationFn: () => notebooksApi.addEntry(notebook?.id ?? id, "Untitled entry"),
    onSuccess: async (entry) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.notebooks });
      setSelectedEntryId(entry.id);
      setEntryTitle(entry.title);
      draftRef.current = {
        notebookTitle,
        entryId: entry.id,
        entryTitle: entry.title,
        content: entry.content,
      };
      setDirty(false);
      toast.success("New entry added");
    },
  });

  const updateMeta = useMutation({
    mutationFn: (patch: { projectId?: string | null; tags?: string[]; favorite?: boolean }) =>
      notebooksApi.update(notebook?.id ?? id, patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notebooks });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      void queryClient.invalidateQueries({ queryKey: queryKeys.activity });
    },
  });

  const remove = useMutation({
    mutationFn: () => notebooksApi.remove(notebook?.id ?? id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notebooks });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      void queryClient.invalidateQueries({ queryKey: queryKeys.activity });
      toast.success("Notebook deleted");
      navigate("/app/notebooks");
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeaderSkeleton />
        <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-[70vh] rounded-xl" />
        </div>
      </div>
    );
  }

  if (!notebook || !selectedEntry) {
    return (
      <EmptyState
        icon={NotebookPen}
        title="Notebook not found"
        description="This notebook may have been deleted, or the link is out of date."
        action={
          <Button asChild>
            <Link to="/app/notebooks">Back to notebooks</Link>
          </Button>
        }
      />
    );
  }

  const project = projects.find((item) => item.id === notebook.projectId);
  const tagsDirty =
    tags.length !== notebook.tags.length ||
    tags.some((tag, index) => tag !== notebook.tags[index]);

  const exportNotebook = (kind: "markdown" | "html" | "json") => {
    const filename = slugify(notebookTitle || notebook.title);
    if (kind === "json") {
      downloadBlob(
        JSON.stringify({ ...notebook, title: notebookTitle }, null, 2),
        `${filename}.json`,
        "application/json",
      );
    } else if (kind === "markdown") {
      const body = notebook.entries
        .map((entry) => {
          const content =
            entry.id === selectedEntry.id ? draftRef.current.content : entry.content;
          return `## ${entry.title}\n\n${htmlToMarkdown(content)}`;
        })
        .join("\n\n---\n\n");
      downloadBlob(
        `# ${notebookTitle}\n\n${notebook.description}\n\n${body}\n`,
        `${filename}.md`,
        "text/markdown",
      );
    } else {
      const body = notebook.entries
        .map((entry) => {
          const content =
            entry.id === selectedEntry.id ? draftRef.current.content : entry.content;
          return `<section><h2>${entry.title}</h2>${content}</section>`;
        })
        .join("\n");
      downloadBlob(
        `<!doctype html><html><head><meta charset="utf-8"><title>${notebookTitle}</title><style>body{max-width:720px;margin:48px auto;font-family:Inter,system-ui,sans-serif;line-height:1.7;color:#172B4D;padding:0 24px}img{max-width:100%}table{width:100%;border-collapse:collapse}td,th{border:1px solid #ddd;padding:6px}blockquote{border-left:3px solid #0D9488;padding-left:16px;color:#64748B}</style></head><body><h1>${notebookTitle}</h1><p>${notebook.description}</p>${body}</body></html>`,
        `${filename}.html`,
        "text/html",
      );
    }
    toast.success("Notebook exported", { description: `${filename} was downloaded.` });
  };

  const saving = save.isPending;
  const statusLabel = saving
    ? "Saving…"
    : dirty
      ? "Unsaved changes"
      : lastSavedAt
        ? `Saved ${format(lastSavedAt, "h:mm a")}`
        : "Autosave on";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" asChild className="-ml-2 gap-1.5">
          <Link to="/app/notebooks">
            <ArrowLeft className="size-3.5" />
            Notebooks
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-medium",
              saving
                ? "bg-muted text-muted-foreground"
                : dirty
                  ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
                  : "bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300",
            )}
            role="status"
            aria-live="polite"
          >
            {saving ? (
              <Loader2 className="size-3 animate-spin" />
            ) : dirty ? (
              <span className="size-1.5 rounded-full bg-amber-500" />
            ) : (
              <Check className="size-3" />
            )}
            {statusLabel}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground"
            aria-label={notebook.favorite ? "Remove from favorites" : "Add to favorites"}
            onClick={() => updateMeta.mutate({ favorite: !notebook.favorite })}
          >
            <Star
              className={cn(
                "size-4",
                notebook.favorite && "fill-amber-400 text-amber-500",
              )}
            />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Download className="size-3.5" /> Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Export notebook</DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => exportNotebook("markdown")}>
                <FileText /> Markdown (.md)
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => exportNotebook("html")}>
                <FileText /> Web page (.html)
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => exportNotebook("json")}>
                <FileJson /> Structured data (.json)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8" aria-label="More actions">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onSelect={() => setDeleteOpen(true)} destructive>
                <Trash2 /> Delete notebook
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[200px_minmax(0,1fr)_auto] xl:grid-cols-[240px_minmax(0,1fr)_auto]">
        <aside className="space-y-4 self-start lg:sticky lg:top-24">
          <div className="rounded-xl border border-border bg-card p-4 shadow-subtle">
            <p className="eyebrow">Notebook details</p>
            <div className="mt-3 space-y-3">
              <div>
                <label className="mb-1 block text-[10.5px] font-medium text-muted-foreground">
                  Project
                </label>
                <Select
                  value={notebook.projectId ?? "none"}
                  onValueChange={(value) =>
                    updateMeta.mutate({ projectId: value === "none" ? null : value })
                  }
                >
                  <SelectTrigger className="h-8 text-[11.5px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Standalone notebook</SelectItem>
                    {projects.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-1 block text-[10.5px] font-medium text-muted-foreground">
                  Tags
                </label>
                <TagInput value={tags} onChange={setTags} className="min-h-8" maxTags={8} />
                {tagsDirty && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-1.5 h-6 w-full text-[10.5px]"
                    onClick={() => updateMeta.mutate({ tags })}
                  >
                    Save tags
                  </Button>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-border pt-3 text-[10.5px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <PersonAvatar person={notebook.author} className="size-5" />
                  {notebook.author.name}
                </span>
                <span>{notebook.entries.length} entries</span>
              </div>
              {project && (
                <Link
                  to={`/app/projects/${project.id}`}
                  className="flex items-center gap-1.5 text-[10.5px] text-teal-700 hover:underline dark:text-teal-300"
                >
                  <FolderKanban className="size-3" /> Open project workspace
                </Link>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-3 shadow-subtle">
            <div className="flex items-center justify-between px-1 pb-2">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Entries
              </p>
              <button
                type="button"
                onClick={() => addEntry.mutate()}
                disabled={addEntry.isPending}
                className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                aria-label="Add notebook entry"
              >
                <Plus className="size-3.5" />
              </button>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin lg:max-h-[320px] lg:flex-col lg:overflow-y-auto">
              {notebook.entries.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => switchEntry(entry.id)}
                  className={cn(
                    "min-w-[180px] shrink-0 rounded-lg border p-2.5 text-left transition-colors lg:min-w-0 lg:shrink",
                    entry.id === selectedEntry.id
                      ? "border-teal-200 bg-teal-50/70 dark:border-teal-500/30 dark:bg-teal-500/10"
                      : "border-transparent hover:bg-muted/60",
                  )}
                >
                  <p className="truncate text-[11.5px] font-medium">{entry.title}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {fromNow(entry.updatedAt)}
                  </p>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => addEntry.mutate()}
              className="mt-2 flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-border py-1.5 text-[10.5px] font-medium text-muted-foreground transition-colors hover:border-teal-400 hover:text-teal-700 dark:hover:text-teal-300"
            >
              <Plus className="size-3" /> Add entry
            </button>
          </div>

          <div className="hidden rounded-xl border border-border bg-card p-4 shadow-subtle lg:block">
            <p className="eyebrow">Writing tips</p>
            <ul className="mt-2 space-y-1.5 text-[10.5px] leading-relaxed text-muted-foreground">
              <li>Type <strong>#</strong> for a heading and <strong>-</strong> for a list.</li>
              <li>Use <strong>Cite</strong> to insert a project reference.</li>
              <li>Changes autosave after a short pause.</li>
            </ul>
          </div>
        </aside>

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          <div className="px-5 pb-2 pt-6 sm:px-10">
            <div className="mx-auto max-w-[72ch]">
              <input
                value={notebookTitle}
                onChange={(event) => {
                  setNotebookTitle(event.target.value);
                  markDirty({ notebookTitle: event.target.value });
                }}
                aria-label="Notebook title"
                placeholder="Untitled notebook"
                className="w-full bg-transparent text-[26px] font-semibold leading-tight tracking-[-0.03em] outline-none placeholder:text-muted-foreground/40 sm:text-[30px]"
              />
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <PersonAvatar person={notebook.author} className="size-5" />
                  {notebook.author.name}
                </span>
                <span>·</span>
                <span>Updated {formatDate(notebook.updatedAt, "MMM d, yyyy")}</span>
                {project && (
                  <>
                    <span>·</span>
                    <Badge variant="secondary" className="font-normal">
                      <FolderKanban className="size-2.5" /> {project.title}
                    </Badge>
                  </>
                )}
              </div>
            </div>
          </div>

          <EntryEditor
            key={selectedEntry.id}
            entry={selectedEntry}
            entryTitle={entryTitle}
            onEntryTitleChange={(value) => {
              setEntryTitle(value);
              markDirty({ entryTitle: value });
            }}
            papers={projectPapers}
            onChange={(content) => markDirty({ content })}
            onEditorReady={setEntryEditor}
          />

          <div className="border-t border-border bg-muted/20 px-5 py-3 sm:px-10">
            <div className="mx-auto flex max-w-[72ch] flex-wrap items-center justify-between gap-2 text-[10.5px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <NotebookPen className="size-3" />
                {notebookTitle || "Untitled notebook"} · entry {entryTitle || "Untitled"}
              </span>
              <span className="flex items-center gap-1.5">
                <BookOpen className="size-3" />
                Reference library: {projectPapers.length} papers
              </span>
            </div>
          </div>
        </div>

        <NotebookOutline
          editor={entryEditor}
          className="self-start lg:sticky lg:top-24"
        />
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this notebook?"
        description={
          <>
            <strong>{notebook.title}</strong> and all of its entries will be removed. This cannot
            be undone.
          </>
        }
        confirmLabel="Delete notebook"
        onConfirm={() => remove.mutate()}
      />
    </div>
  );
}
