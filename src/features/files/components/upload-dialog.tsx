import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CloudUpload, FileUp, Loader2, X } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { formatBytes } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { projectsApi } from "@/features/projects/api";
import { filesApi } from "../api";

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultFolderId?: string | null;
  defaultProjectId?: string | null;
}

export function UploadDialog({
  open,
  onOpenChange,
  defaultFolderId = null,
  defaultProjectId = null,
}: UploadDialogProps) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [folderId, setFolderId] = useState<string>(defaultFolderId ?? "root");
  const [projectId, setProjectId] = useState<string>(defaultProjectId ?? "none");

  const { data: projects = [] } = useQuery({
    queryKey: queryKeys.projects,
    queryFn: projectsApi.list,
    enabled: open,
  });
  const { data: folders = [] } = useQuery({
    queryKey: queryKeys.folders,
    queryFn: filesApi.folders,
    enabled: open,
  });

  useEffect(() => {
    if (open) {
      setFiles([]);
      setFolderId(defaultFolderId ?? "root");
      setProjectId(defaultProjectId ?? "none");
    }
  }, [open, defaultFolderId, defaultProjectId]);

  const mutation = useMutation({
    mutationFn: () =>
      filesApi.upload(
        files.map((file) => ({
          name: file.name,
          size: file.size,
          folderId: folderId === "root" ? null : folderId,
          projectId: projectId === "none" ? null : projectId,
        })),
      ),
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.files });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      void queryClient.invalidateQueries({ queryKey: queryKeys.activity });
      toast.success(
        created.length === 1 ? "File added to the demo workspace" : "Files added to the demo workspace",
        {
          description:
            "Metadata is saved in your browser. Binary contents are not uploaded to a server.",
        },
      );
      onOpenChange(false);
    },
    onError: () => toast.error("Could not add the files"),
  });

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const next = Array.from(list);
    setFiles((current) => {
      const existing = new Set(current.map((file) => `${file.name}-${file.size}`));
      return [
        ...current,
        ...next.filter((file) => !existing.has(`${file.name}-${file.size}`)),
      ];
    });
  };

  const totalSize = files.reduce((sum, file) => sum + file.size, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Upload research files</DialogTitle>
          <DialogDescription>
            Add datasets, manuscripts, figures, or protocols to this workspace.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                inputRef.current?.click();
              }
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              addFiles(event.dataTransfer.files);
            }}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-9 text-center transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
              dragging
                ? "border-teal-500 bg-teal-50/70 dark:bg-teal-500/10"
                : "border-border bg-muted/30 hover:border-teal-400 hover:bg-teal-50/40 dark:hover:bg-teal-500/5",
            )}
            aria-label="Choose files or drag and drop"
          >
            <div className="mb-3 flex size-11 items-center justify-center rounded-xl border border-border bg-card shadow-subtle">
              <CloudUpload className="size-5 text-teal-600 dark:text-teal-400" />
            </div>
            <p className="text-[13.5px] font-medium">
              Drop files here, or <span className="text-teal-700 dark:text-teal-300">browse</span>
            </p>
            <p className="mt-1 text-[11.5px] text-muted-foreground">
              Any file type · multiple files supported
            </p>
            <input
              ref={inputRef}
              type="file"
              multiple
              className="sr-only"
              onChange={(event) => addFiles(event.target.files)}
            />
          </div>

          {files.length > 0 && (
            <ul className="max-h-44 space-y-2 overflow-y-auto pr-1 scrollbar-thin">
              {files.map((file, index) => (
                <li
                  key={`${file.name}-${index}`}
                  className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-card text-muted-foreground shadow-subtle">
                    <FileUp className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-medium">{file.name}</p>
                    <p className="text-[11px] text-muted-foreground">{formatBytes(file.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFiles((current) => current.filter((_, i) => i !== index))}
                    className="rounded p-1 text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
                    aria-label={`Remove ${file.name}`}
                  >
                    <X className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="upload-folder">Destination folder</Label>
              <Select value={folderId} onValueChange={setFolderId}>
                <SelectTrigger id="upload-folder">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">All files (root)</SelectItem>
                  {folders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="upload-project">Associated project</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger id="upload-project">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No project</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <p className="rounded-lg bg-muted/60 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
            <strong className="font-medium text-foreground">Demo mode:</strong> uploads create
            local file records for this prototype. Binary contents stay on your device and are
            never sent to a server.
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={files.length === 0 || mutation.isPending}
          >
            {mutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CloudUpload className="size-4" />
            )}
            {files.length > 0
              ? `Add ${files.length} file${files.length === 1 ? "" : "s"} · ${formatBytes(totalSize)}`
              : "Select files"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
