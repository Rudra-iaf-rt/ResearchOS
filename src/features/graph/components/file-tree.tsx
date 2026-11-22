import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  FolderInput,
  FolderKanban,
  FolderOpen,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
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
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { queryKeys } from "@/lib/query-keys";
import { formatBytes } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ResearchFile } from "@/types";
import { filesApi } from "@/features/files/api";
import { projectsApi } from "@/features/projects/api";
import { buildFileTree, canMoveFolder, type FileTreeFolder } from "../lib/file-tree";

type DragPayload = { kind: "file" | "folder"; id: string };
type RenameTarget = { kind: "file" | "folder"; id: string; name: string };

interface FileTreeProps {
  currentFolderId: string | null;
  onSelectFolder: (id: string | null) => void;
  onSelectFile?: (file: ResearchFile) => void;
  className?: string;
}

function readDragPayload(event: React.DragEvent): DragPayload | null {
  try {
    const raw = event.dataTransfer.getData("text/plain");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DragPayload;
    if (parsed.kind !== "file" && parsed.kind !== "folder") return null;
    if (typeof parsed.id !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function FileTree({
  currentFolderId,
  onSelectFolder,
  onSelectFile,
  className,
}: FileTreeProps) {
  const queryClient = useQueryClient();
  const { data: files = [] } = useQuery({
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

  const tree = useMemo(() => buildFileTree(folders, files), [folders, files]);

  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current || folders.length === 0) return;
    initialized.current = true;
    setOpenIds(new Set(folders.map((folder) => folder.id)));
  }, [folders]);

  const [drag, setDrag] = useState<DragPayload | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [renameTarget, setRenameTarget] = useState<RenameTarget | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<RenameTarget | null>(null);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.files });
    void queryClient.invalidateQueries({ queryKey: queryKeys.folders });
    void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    void queryClient.invalidateQueries({ queryKey: queryKeys.activity });
  };

  const move = useMutation({
    mutationFn: async ({
      payload,
      targetFolderId,
    }: {
      payload: DragPayload;
      targetFolderId: string | null;
    }) => {
      if (payload.kind === "file") {
        return filesApi.moveFile(payload.id, targetFolderId);
      }
      if (!canMoveFolder(folders, payload.id, targetFolderId)) {
        throw new Error("A folder cannot move into itself or one of its descendants.");
      }
      return filesApi.moveFolder(payload.id, targetFolderId);
    },
    onSuccess: () => {
      refresh();
      toast.success("Moved");
    },
    onError: (error) =>
      toast.error("Could not move that item", {
        description: error instanceof Error ? error.message : "Try another destination.",
      }),
    onSettled: () => {
      setDrag(null);
      setDropTarget(null);
    },
  });

  const rename = useMutation({
    mutationFn: async (target: RenameTarget) => {
      const next = target.name.trim();
      if (!next) throw new Error("Name cannot be empty");
      if (target.kind === "folder") {
        await filesApi.renameFolder(target.id, next);
      } else {
        await filesApi.rename(target.id, next);
      }
    },
    onSuccess: () => {
      refresh();
      setRenameTarget(null);
      toast.success("Renamed");
    },
    onError: (error) =>
      toast.error("Could not rename", {
        description: error instanceof Error ? error.message : "Try again.",
      }),
  });

  const remove = useMutation({
    mutationFn: (target: RenameTarget) =>
      target.kind === "folder" ? filesApi.removeFolder(target.id) : filesApi.remove(target.id),
    onSuccess: () => {
      refresh();
      setDeleteTarget(null);
      toast.success("Deleted");
    },
    onError: () => toast.error("Could not delete that item"),
  });

  const moveToProject = useMutation({
    mutationFn: async ({
      target,
      projectId,
    }: {
      target: RenameTarget;
      projectId: string | null;
    }) => {
      if (target.kind === "folder") {
        await filesApi.moveFolderToProject(target.id, projectId);
      } else {
        await filesApi.moveFileToProject(target.id, projectId);
      }
    },
    onSuccess: () => {
      refresh();
      toast.success("Project updated");
    },
    onError: () => toast.error("Could not update the project"),
  });

  const beginDrag = (
    event: React.DragEvent,
    payload: DragPayload,
  ) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", JSON.stringify(payload));
    setDrag(payload);
  };

  const handleDragOver = (event: React.DragEvent, folderId: string | null) => {
    if (!drag) return;
    if (drag.kind === "folder" && !canMoveFolder(folders, drag.id, folderId)) {
      event.dataTransfer.dropEffect = "none";
      return;
    }
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDropTarget(folderId ?? "__root__");
  };

  const handleDrop = (event: React.DragEvent, folderId: string | null) => {
    event.preventDefault();
    const payload = drag ?? readDragPayload(event);
    setDropTarget(null);
    if (!payload) return;
    move.mutate({ payload, targetFolderId: folderId });
  };

  const openRename = (target: RenameTarget) => {
    setRenameTarget(target);
    setRenameValue(target.name);
  };

  const renderFile = (file: ResearchFile, depth: number) => (
    <div
      key={file.id}
      className="group flex items-center gap-1 rounded-md py-0.5 pr-0.5"
      style={{ paddingLeft: `${depth * 12}px` }}
    >
      <span className="size-3.5 shrink-0" aria-hidden="true" />
      <button
        type="button"
        draggable
        onDragStart={(event) => beginDrag(event, { kind: "file", id: file.id })}
        onDragEnd={() => setDrag(null)}
        onClick={() => onSelectFile?.(file)}
        className="flex min-w-0 flex-1 items-center gap-1.5 rounded px-1 py-0.5 text-left text-[11.5px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label={`Open file ${file.name}`}
      >
        <FileText className="size-3 shrink-0" />
        <span className="truncate">{file.name}</span>
      </button>
      <ItemMenu
        target={{ kind: "file", id: file.id, name: file.name }}
        projects={projects}
        onRename={openRename}
        onDelete={setDeleteTarget}
        onMove={(input) => moveToProject.mutate(input)}
        compact
      />
    </div>
  );

  const renderFolder = (node: FileTreeFolder, depth: number): React.ReactNode => {
    const open = openIds.has(node.id);
    const isCurrent = currentFolderId === node.id;
    const isDrop = dropTarget === node.id;
    return (
      <div key={node.id}>
        <div
          className={cn(
            "group flex items-center gap-0.5 rounded-md pr-0.5 transition-colors",
            isCurrent && "bg-teal-50 text-teal-800 dark:bg-teal-500/10 dark:text-teal-200",
            isDrop && "ring-1 ring-inset ring-teal-400",
          )}
          style={{ paddingLeft: `${depth * 12}px` }}
          onDragOver={(event) => handleDragOver(event, node.id)}
          onDragLeave={() => setDropTarget((current) => (current === node.id ? null : current))}
          onDrop={(event) => handleDrop(event, node.id)}
        >
          <button
            type="button"
            onClick={() =>
              setOpenIds((current) => {
                const next = new Set(current);
                if (next.has(node.id)) next.delete(node.id);
                else next.add(node.id);
                return next;
              })
            }
            className="flex size-3.5 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted"
            aria-label={open ? `Collapse ${node.name}` : `Expand ${node.name}`}
            aria-expanded={open}
          >
            {open ? <ChevronDown className="size-2.5" /> : <ChevronRight className="size-2.5" />}
          </button>
          <button
            type="button"
            draggable
            onDragStart={(event) => beginDrag(event, { kind: "folder", id: node.id })}
            onDragEnd={() => setDrag(null)}
            onClick={() => onSelectFolder(node.id)}
            aria-current={isCurrent ? "page" : undefined}
            className="flex min-w-0 flex-1 items-center gap-1.5 rounded px-1 py-1 text-left text-[11.5px] transition-colors hover:bg-muted"
          >
            {open ? (
              <FolderOpen className="size-3 shrink-0 text-teal-600 dark:text-teal-300" />
            ) : (
              <Folder className="size-3 shrink-0 text-muted-foreground" />
            )}
            <span className="truncate font-medium">{node.name}</span>
            <span className="ml-auto shrink-0 text-[9px] tabular-nums text-muted-foreground">
              {node.fileCount > 0 ? formatBytes(node.size, 0) : "Empty"}
            </span>
          </button>
          <ItemMenu
            target={{ kind: "folder", id: node.id, name: node.name }}
            projects={projects}
            onRename={openRename}
            onDelete={setDeleteTarget}
            onMove={(input) => moveToProject.mutate(input)}
            compact
          />
        </div>
        {open && (
          <div>
            {node.folders.map((child) => renderFolder(child, depth + 1))}
            {node.files.map((file) => renderFile(file, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn("space-y-1", className)}>
      <button
        type="button"
        onClick={() => onSelectFolder(null)}
        onDragOver={(event) => handleDragOver(event, null)}
        onDragLeave={() => setDropTarget((current) => (current === "__root__" ? null : current))}
        onDrop={(event) => handleDrop(event, null)}
        aria-current={!currentFolderId ? "page" : undefined}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[12px] transition-colors",
          !currentFolderId
            ? "bg-teal-50 font-medium text-teal-800 dark:bg-teal-500/10 dark:text-teal-200"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
          dropTarget === "__root__" && "ring-1 ring-inset ring-teal-400",
        )}
      >
        <FolderOpen className="size-3.5 shrink-0" />
        <span className="flex-1 truncate text-left">All files</span>
        <span className="text-[10px] tabular-nums">{files.length}</span>
      </button>

      {tree.roots.map((folder) => renderFolder(folder, 0))}

      {tree.unfiled.length > 0 && (
        <div className="pt-1">
          <p className="px-2 pb-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Unfiled
          </p>
          {tree.unfiled.map((file) => renderFile(file, 0))}
        </div>
      )}

      <Dialog open={Boolean(renameTarget)} onOpenChange={(open) => !open && setRenameTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rename {renameTarget?.kind ?? "item"}</DialogTitle>
            <DialogDescription>Names are saved to this local demo workspace.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="file-tree-rename">Name</Label>
            <Input
              id="file-tree-rename"
              value={renameValue}
              onChange={(event) => setRenameValue(event.target.value)}
              autoFocus
              onKeyDown={(event) => {
                if (event.key === "Enter" && renameTarget) {
                  event.preventDefault();
                  rename.mutate({ ...renameTarget, name: renameValue });
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameTarget(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => renameTarget && rename.mutate({ ...renameTarget, name: renameValue })}
              disabled={!renameValue.trim() || rename.isPending}
            >
              Save name
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Delete this ${deleteTarget?.kind ?? "item"}?`}
        description={
          deleteTarget?.kind === "folder" ? (
            <>
              <strong>{deleteTarget.name}</strong> will be removed. Nested folders and files move
              up one level instead of being deleted.
            </>
          ) : (
            <>
              <strong>{deleteTarget?.name}</strong> will be removed from this local demo
              workspace.
            </>
          )
        }
        confirmLabel={`Delete ${deleteTarget?.kind ?? "item"}`}
        onConfirm={() => {
          if (deleteTarget) remove.mutate(deleteTarget);
        }}
      />
    </div>
  );
}

function ItemMenu({
  target,
  projects,
  onRename,
  onDelete,
  onMove,
  compact = false,
}: {
  target: RenameTarget;
  projects: Array<{ id: string; title: string }>;
  onRename: (target: RenameTarget) => void;
  onDelete: (target: RenameTarget) => void;
  onMove: (input: { target: RenameTarget; projectId: string | null }) => void;
  compact?: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex shrink-0 items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100",
            compact ? "size-5" : "size-6",
          )}
          aria-label={`Actions for ${target.name}`}
        >
          <MoreHorizontal className={compact ? "size-3" : "size-3.5"} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="truncate">{target.name}</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => onRename(target)}>
          <Pencil /> Rename
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <FolderInput /> Move to project
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-52">
            <DropdownMenuItem onSelect={() => onMove({ target, projectId: null })}>
              <FolderKanban /> Unlinked
            </DropdownMenuItem>
            {projects.map((project) => (
              <DropdownMenuItem
                key={project.id}
                onSelect={() => onMove({ target, projectId: project.id })}
              >
                <FolderKanban /> <span className="truncate">{project.title}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem destructive onSelect={() => onDelete(target)}>
          <Trash2 /> Delete {target.kind}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
