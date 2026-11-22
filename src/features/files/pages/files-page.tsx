import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import {
  ArrowUpDown,
  ChevronRight,
  CloudUpload,
  Download,
  FolderOpen,
  FolderPlus,
  HardDrive,
  LayoutGrid,
  List,
  MoreHorizontal,
  Pencil,
  SearchX,
  Star,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { FileTree } from "@/features/graph/components/file-tree";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { queryKeys } from "@/lib/query-keys";
import { fileKindMeta, STORAGE_LIMIT_BYTES } from "@/lib/constants";
import { formatBytes, formatDate, fromNow } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { FileKind, ResearchFile } from "@/types";
import { projectsApi } from "@/features/projects/api";
import { useCreateDialogs } from "@/components/navigation/create-dialogs-provider";
import { filesApi } from "../api";
import { FileKindIcon } from "../components/file-kind-icon";
import { FilePreviewSheet } from "../components/file-preview-sheet";

type SortKey = "recent" | "name" | "size";

const sortLabels: Record<SortKey, string> = {
  recent: "Recently added",
  name: "Name A–Z",
  size: "Largest first",
};

const kindFilters: { value: "all" | FileKind; label: string }[] = [
  { value: "all", label: "All types" },
  { value: "pdf", label: "PDF" },
  { value: "dataset", label: "Dataset" },
  { value: "image", label: "Image" },
  { value: "document", label: "Document" },
  { value: "code", label: "Code" },
  { value: "spreadsheet", label: "Spreadsheet" },
  { value: "archive", label: "Archive" },
];

function FileMenu({
  file,
  onOpen,
  onRename,
  onDelete,
}: {
  file: ResearchFile;
  onOpen: (file: ResearchFile) => void;
  onRename: (file: ResearchFile) => void;
  onDelete: (file: ResearchFile) => void;
}) {
  const queryClient = useQueryClient();
  const star = useMutation({
    mutationFn: () => filesApi.toggleStar(file.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.files });
    },
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          onClick={(event) => event.stopPropagation()}
          className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`Actions for ${file.name}`}
        >
          <MoreHorizontal className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onSelect={() => onOpen(file)}>
          <FolderOpen /> Open details
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onRename(file)}>
          <Pencil /> Rename
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => star.mutate()}>
          <Star className={cn(file.starred && "fill-amber-400 text-amber-500")} />
          {file.starred ? "Remove star" : "Star file"}
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() =>
            toast.info("Preview record only", {
              description:
                "This demo stores metadata, not file contents, so there is no binary to download.",
            })
          }
        >
          <Download /> Download
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem destructive onSelect={() => onDelete(file)}>
          <Trash2 /> Delete file
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function FilesPage() {
  const queryClient = useQueryClient();
  const { openCreate } = useCreateDialogs();
  const [searchParams, setSearchParams] = useSearchParams();
  const dropRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<"all" | FileKind>("all");
  const [projectId, setProjectId] = useState("all");
  const [sort, setSort] = useState<SortKey>("recent");
  const [view, setView] = useState<"grid" | "list">("list");
  const [starredOnly, setStarredOnly] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [renameTarget, setRenameTarget] = useState<ResearchFile | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [folderOpen, setFolderOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [deleting, setDeleting] = useState<ResearchFile | undefined>();

  const { data: files = [], isLoading } = useQuery({
    queryKey: queryKeys.files,
    queryFn: filesApi.list,
  });
  const { data: folders = [] } = useQuery({
    queryKey: queryKeys.folders,
    queryFn: filesApi.folders,
  });
  const { data: projects = [] } = useQuery({
    queryKey: queryKeys.projects,
    queryFn: projectsApi.list,
  });

  const projectById = useMemo(
    () => new Map(projects.map((project) => [project.id, project])),
    [projects],
  );
  const folderById = useMemo(
    () => new Map(folders.map((folder) => [folder.id, folder])),
    [folders],
  );

  const currentFolderId = searchParams.get("folder");
  const currentFolder = currentFolderId ? folderById.get(currentFolderId) ?? null : null;
  const selectedFileId = searchParams.get("file");
  const selectedFile = files.find((file) => file.id === selectedFileId) ?? null;

  const goToFolder = (id: string | null) => {
    const next = new URLSearchParams(searchParams);
    next.delete("file");
    if (id) next.set("folder", id);
    else next.delete("folder");
    setSearchParams(next, { replace: true });
  };

  const openFile = (file: ResearchFile) => {
    const next = new URLSearchParams(searchParams);
    next.set("file", file.id);
    setSearchParams(next, { replace: true });
  };

  const closeFile = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("file");
    setSearchParams(next, { replace: true });
  };

  const breadcrumb = useMemo(() => {
    const chain: typeof folders = [];
    let cursor = currentFolder;
    while (cursor) {
      chain.unshift(cursor);
      cursor = cursor.parentId ? folderById.get(cursor.parentId) ?? null : null;
    }
    return chain;
  }, [currentFolder, folderById]);

  const refreshFiles = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.files });
    void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    void queryClient.invalidateQueries({ queryKey: queryKeys.activity });
  };

  const uploadDrop = useMutation({
    mutationFn: (dropped: File[]) =>
      filesApi.upload(
        dropped.map((file) => ({
          name: file.name,
          size: file.size,
          folderId: currentFolder?.id ?? null,
          projectId: projectId === "all" ? null : projectId,
        })),
      ),
    onSuccess: (created) => {
      refreshFiles();
      toast.success(
        created.length === 1 ? "File record added" : `${created.length} file records added`,
        {
          description:
            "Metadata saved in your browser. Binary contents are not uploaded to a server.",
        },
      );
    },
    onError: () => toast.error("Could not add those files"),
  });

  const rename = useMutation({
    mutationFn: () => {
      if (!renameTarget) throw new Error("No file selected");
      return filesApi.rename(renameTarget.id, renameValue.trim());
    },
    onSuccess: () => {
      refreshFiles();
      toast.success("File renamed");
      setRenameTarget(null);
    },
    onError: () => toast.error("Could not rename the file"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => filesApi.remove(id),
    onSuccess: (_, id) => {
      refreshFiles();
      if (selectedFileId === id) closeFile();
      toast.success("File deleted", {
        description: "The record was removed from this local demo workspace.",
      });
    },
    onError: () => toast.error("Could not delete the file"),
  });

  const createFolder = useMutation({
    mutationFn: () => filesApi.createFolder(folderName.trim(), currentFolder?.id ?? null),
    onSuccess: (folder) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.folders });
      toast.success("Folder created", { description: `“${folder.name}” is ready for files.` });
      setFolderOpen(false);
      setFolderName("");
    },
    onError: () => toast.error("Could not create the folder"),
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const scoped = currentFolder
      ? files.filter((file) => file.folderId === currentFolder.id)
      : files;
    const list = scoped.filter((file) => {
      const matchesQuery =
        !q ||
        file.name.toLowerCase().includes(q) ||
        (file.description ?? "").toLowerCase().includes(q);
      const matchesKind = kind === "all" || file.kind === kind;
      const matchesProject =
        projectId === "all" ||
        (projectId === "none" ? file.projectId === null : file.projectId === projectId);
      const matchesStar = !starredOnly || file.starred;
      return matchesQuery && matchesKind && matchesProject && matchesStar;
    });

    return list.sort((a, b) => {
      switch (sort) {
        case "name":
          return a.name.localeCompare(b.name);
        case "size":
          return b.size - a.size;
        default:
          return b.uploadedAt.localeCompare(a.uploadedAt);
      }
    });
  }, [files, currentFolder, search, kind, projectId, starredOnly, sort]);

  const storageUsed = files.reduce((sum, file) => sum + file.size, 0);
  const storagePercent = Math.min((storageUsed / STORAGE_LIMIT_BYTES) * 100, 100);
  const starredCount = files.filter((file) => file.starred).length;
  const isFiltered = Boolean(search.trim()) || kind !== "all" || projectId !== "all" || starredOnly;

  const startRename = (file: ResearchFile) => {
    setRenameTarget(file);
    setRenameValue(file.name);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Files"
        description={`${files.length} file records · ${formatBytes(
          storageUsed,
        )} referenced · ${starredCount} starred. Metadata lives in this browser.`}
        actions={
          <>
            <Button variant="outline" onClick={() => setFolderOpen(true)}>
              <FolderPlus className="size-4" />
              New folder
            </Button>
            <Button
              onClick={() =>
                openCreate("upload", {
                  folderId: currentFolder?.id ?? null,
                  projectId:
                    projectId !== "all" && projectId !== "none" ? projectId : undefined,
                })
              }
            >
              <UploadCloud className="size-4" />
              Upload files
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[228px_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-2 shadow-subtle">
            <div className="flex items-center justify-between px-2 pb-1.5 pt-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Folders
              </p>
              <button
                type="button"
                onClick={() => setFolderOpen(true)}
                className="flex size-5 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="New folder"
              >
                <FolderPlus className="size-3" />
              </button>
            </div>
            <div className="max-h-[430px] overflow-y-auto pr-0.5 scrollbar-thin">
              <FileTree
                currentFolderId={currentFolder?.id ?? null}
                onSelectFolder={goToFolder}
                onSelectFile={openFile}
              />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-subtle">
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5 font-medium">
                <HardDrive className="size-3.5 text-muted-foreground" />
                Demo storage
              </span>
              <span className="tabular-nums text-muted-foreground">
                {formatBytes(storageUsed, 0)} / {formatBytes(STORAGE_LIMIT_BYTES, 0)}
              </span>
            </div>
            <Progress value={storagePercent} className="mt-2 h-1.5" />
            <p className="mt-2 text-[10.5px] leading-relaxed text-muted-foreground">
              Quota is illustrative. File records reference metadata only.
            </p>
            <div className="mt-3 space-y-1.5">
              {(Object.keys(fileKindMeta) as FileKind[])
                .map((fileKind) => ({
                  kind: fileKind,
                  bytes: files
                    .filter((file) => file.kind === fileKind)
                    .reduce((sum, file) => sum + file.size, 0),
                }))
                .filter((item) => item.bytes > 0)
                .sort((a, b) => b.bytes - a.bytes)
                .slice(0, 4)
                .map((item) => (
                  <div key={item.kind} className="flex items-center justify-between text-[10.5px]">
                    <span className="text-muted-foreground">
                      {fileKindMeta[item.kind].label}
                    </span>
                    <span className="tabular-nums">{formatBytes(item.bytes)}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        <div
          ref={dropRef}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={(event) => {
            if (event.currentTarget === event.target) setDragging(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            const dropped = Array.from(event.dataTransfer.files);
            if (dropped.length > 0) uploadDrop.mutate(dropped);
          }}
          className={cn(
            "relative min-w-0 space-y-4 rounded-xl transition-colors",
            dragging && "ring-2 ring-teal-500 ring-offset-2 ring-offset-background",
          )}
        >
          {dragging && (
            <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-xl bg-teal-50/90 dark:bg-teal-950/80">
              <CloudUpload className="size-8 text-teal-600 dark:text-teal-300" />
              <p className="text-[13px] font-semibold text-teal-800 dark:text-teal-200">
                Drop to add file records to {currentFolder?.name ?? "All files"}
              </p>
              <p className="text-[11px] text-teal-700/80 dark:text-teal-300/80">
                Metadata only — binary contents stay on your device.
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-1.5 text-[11.5px] text-muted-foreground">
            <button
              type="button"
              onClick={() => goToFolder(null)}
              className="rounded px-1 py-0.5 transition-colors hover:text-foreground"
            >
              All files
            </button>
            {breadcrumb.map((folder) => (
              <span key={folder.id} className="flex items-center gap-1.5">
                <ChevronRight className="size-3" />
                <button
                  type="button"
                  onClick={() => goToFolder(folder.id)}
                  className={cn(
                    "rounded px-1 py-0.5 transition-colors hover:text-foreground",
                    folder.id === currentFolder?.id && "font-medium text-foreground",
                  )}
                >
                  {folder.name}
                </button>
              </span>
            ))}
          </div>

          <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search files…"
                ariaLabel="Search files"
                className="w-full sm:w-56"
              />
              <Select
                value={kind}
                onValueChange={(value) => setKind(value as "all" | FileKind)}
              >
                <SelectTrigger className="h-9 w-auto min-w-32 text-[12px]" aria-label="Filter by file type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {kindFilters.map((filter) => (
                    <SelectItem key={filter.value} value={filter.value}>
                      {filter.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger className="h-9 w-auto min-w-36 text-[12px]" aria-label="Filter by project">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All projects</SelectItem>
                  <SelectItem value="none">Unlinked</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button
                type="button"
                onClick={() => setStarredOnly((value) => !value)}
                aria-pressed={starredOnly}
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-[12px] font-medium transition-colors",
                  starredOnly
                    ? "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
                    : "border-border bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                <Star className={cn("size-3.5", starredOnly && "fill-amber-400 text-amber-500")} />
                Starred
              </button>
            </div>

            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 gap-2">
                    <ArrowUpDown className="size-3.5" />
                    {sortLabels[sort]}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuLabel>Sort files</DropdownMenuLabel>
                  <DropdownMenuRadioGroup
                    value={sort}
                    onValueChange={(value) => setSort(value as SortKey)}
                  >
                    {Object.entries(sortLabels).map(([value, label]) => (
                      <DropdownMenuRadioItem key={value} value={value}>
                        {label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-card p-0.5 shadow-subtle">
                <button
                  type="button"
                  onClick={() => setView("list")}
                  aria-pressed={view === "list"}
                  aria-label="List view"
                  className={cn(
                    "flex size-7 items-center justify-center rounded-md transition-colors",
                    view === "list" ? "bg-muted text-foreground" : "text-muted-foreground",
                  )}
                >
                  <List className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setView("grid")}
                  aria-pressed={view === "grid"}
                  aria-label="Grid view"
                  className={cn(
                    "flex size-7 items-center justify-center rounded-md transition-colors",
                    view === "grid" ? "bg-muted text-foreground" : "text-muted-foreground",
                  )}
                >
                  <LayoutGrid className="size-3.5" />
                </button>
              </div>
            </div>
          </div>

          {isFiltered && (
            <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
              Showing {filtered.length} of {files.length} files
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setKind("all");
                  setProjectId("all");
                  setStarredOnly(false);
                }}
                className="font-medium text-teal-700 hover:underline dark:text-teal-300"
              >
                Clear filters
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="h-64 animate-pulse rounded-xl border border-border bg-card" />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={isFiltered ? SearchX : FolderOpen}
              title={
                isFiltered
                  ? "No files match those filters"
                  : currentFolder
                    ? "This folder is empty"
                    : "No files here yet"
              }
              description={
                isFiltered
                  ? "Try another search term, file type, or project. You can also clear the filters."
                  : "Upload manuscripts, datasets, figures, or protocols. You can also drag files anywhere onto this panel."
              }
              action={
                isFiltered ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearch("");
                      setKind("all");
                      setProjectId("all");
                      setStarredOnly(false);
                    }}
                  >
                    Clear filters
                  </Button>
                ) : (
                  <Button
                    onClick={() =>
                      openCreate("upload", {
                        folderId: currentFolder?.id ?? null,
                        projectId:
                          projectId !== "all" && projectId !== "none" ? projectId : undefined,
                      })
                    }
                  >
                    <UploadCloud className="size-4" /> Upload files
                  </Button>
                )
              }
            />
          ) : view === "list" ? (
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-subtle">
              <div className="hidden items-center gap-3 border-b border-border bg-muted/40 px-4 py-2 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground md:flex">
                <span className="w-9" />
                <span className="flex-1">Name</span>
                <span className="w-28">Project</span>
                <span className="w-20 text-right">Size</span>
                <span className="w-24">Uploaded</span>
                <span className="w-14" />
              </div>
              {filtered.map((file) => (
                <div
                  key={file.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openFile(file)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openFile(file);
                    }
                  }}
                  className="group flex cursor-pointer items-center gap-3 border-b border-border px-4 py-3 outline-none transition-colors last:border-b-0 hover:bg-muted/30 focus-visible:bg-muted/30"
                >
                  <FileKindIcon kind={file.kind} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-[12.5px] font-medium group-hover:text-teal-700 dark:group-hover:text-teal-300">
                        {file.name}
                      </p>
                      {file.starred && (
                        <Star className="size-3 shrink-0 fill-amber-400 text-amber-500" />
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-[10.5px] text-muted-foreground">
                      {fileKindMeta[file.kind].label} · {file.uploadedBy.name}
                      {file.description ? ` · ${file.description}` : ""}
                    </p>
                  </div>
                  <span className="hidden w-28 truncate text-[11px] text-muted-foreground lg:block">
                    {file.projectId ? projectById.get(file.projectId)?.title ?? "—" : "Unlinked"}
                  </span>
                  <span className="hidden w-20 text-right text-[11px] tabular-nums text-muted-foreground sm:block">
                    {formatBytes(file.size)}
                  </span>
                  <span className="hidden w-24 text-[10.5px] text-muted-foreground md:block">
                    {fromNow(file.uploadedAt)}
                  </span>
                  <FileMenu
                    file={file}
                    onOpen={openFile}
                    onRename={startRename}
                    onDelete={setDeleting}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
              {filtered.map((file) => (
                <article
                  key={file.id}
                  onClick={() => openFile(file)}
                  className="group cursor-pointer rounded-xl border border-border bg-card p-4 shadow-subtle transition-all hover:-translate-y-0.5 hover:border-navy-200 hover:shadow-raised dark:hover:border-navy-600"
                >
                  <div className="flex items-start justify-between gap-2">
                    <FileKindIcon kind={file.kind} size="lg" />
                    <div className="flex items-center gap-0.5">
                      {file.starred && (
                        <Star className="size-3.5 fill-amber-400 text-amber-500" />
                      )}
                      <FileMenu
                        file={file}
                        onOpen={openFile}
                        onRename={startRename}
                        onDelete={setDeleting}
                      />
                    </div>
                  </div>
                  <h3 className="mt-3 line-clamp-2 break-all text-[12.5px] font-medium leading-snug group-hover:text-teal-700 dark:group-hover:text-teal-300">
                    {file.name}
                  </h3>
                  <p className="mt-1 text-[10.5px] text-muted-foreground">
                    {formatBytes(file.size)} · {formatDate(file.uploadedAt, "MMM d")}
                  </p>
                  <p className="mt-2 truncate text-[10.5px] text-muted-foreground">
                    {file.projectId ? projectById.get(file.projectId)?.title ?? "—" : "Unlinked"}
                  </p>
                </article>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CloudUpload className="size-3.5" />
              Drag files here to add metadata records instantly.
            </span>
            <button
              type="button"
              onClick={() =>
                openCreate("upload", {
                  folderId: currentFolder?.id ?? null,
                  projectId:
                    projectId !== "all" && projectId !== "none" ? projectId : undefined,
                })
              }
              className="font-medium text-teal-700 hover:underline dark:text-teal-300"
            >
              Or browse files
            </button>
          </div>
        </div>
      </div>

      <FilePreviewSheet
        file={selectedFile}
        open={Boolean(selectedFile)}
        onOpenChange={(open) => !open && closeFile()}
        projectTitle={
          selectedFile?.projectId ? projectById.get(selectedFile.projectId)?.title : undefined
        }
        folderName={
          selectedFile?.folderId ? folderById.get(selectedFile.folderId)?.name : undefined
        }
        onRename={startRename}
        onDelete={(file) => {
          closeFile();
          setDeleting(file);
        }}
      />

      <Dialog
        open={Boolean(renameTarget)}
        onOpenChange={(open) => !open && setRenameTarget(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rename file</DialogTitle>
            <DialogDescription>
              Only the display name of this demo record changes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="file-name">File name</Label>
            <Input
              id="file-name"
              value={renameValue}
              onChange={(event) => setRenameValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && renameValue.trim()) {
                  event.preventDefault();
                  rename.mutate();
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameTarget(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => rename.mutate()}
              disabled={!renameValue.trim() || rename.isPending}
            >
              Save name
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={folderOpen} onOpenChange={setFolderOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New folder</DialogTitle>
            <DialogDescription>
              Created inside {currentFolder?.name ?? "All files"} in your local demo workspace.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="folder-name">Folder name</Label>
            <Input
              id="folder-name"
              value={folderName}
              onChange={(event) => setFolderName(event.target.value)}
              placeholder="e.g. Pilot data"
              onKeyDown={(event) => {
                if (event.key === "Enter" && folderName.trim()) {
                  event.preventDefault();
                  createFolder.mutate();
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFolderOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createFolder.mutate()}
              disabled={!folderName.trim() || createFolder.isPending}
            >
              Create folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(undefined)}
        title="Delete this file record?"
        description={
          <>
            <strong>{deleting?.name}</strong> will be removed from this local demo workspace. This
            cannot be undone.
          </>
        }
        confirmLabel="Delete file"
        onConfirm={() => {
          if (deleting) remove.mutate(deleting.id);
        }}
      />
    </div>
  );
}
