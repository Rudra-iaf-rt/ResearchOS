import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Download,
  Pencil,
  Star,
  Trash2,
  UserRound,
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
import { formatBytes, formatDate } from "@/lib/format";
import { fileKindMeta } from "@/lib/constants";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import type { ResearchFile } from "@/types";
import { filesApi } from "../api";
import { FileKindIcon } from "./file-kind-icon";

function PreviewBody({ file }: { file: ResearchFile }) {
  if (file.kind === "image") {
    return (
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg border border-border bg-gradient-to-br from-sky-100 via-indigo-50 to-teal-50 dark:from-sky-500/10 dark:via-indigo-500/10 dark:to-teal-500/10">
        <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(hsl(var(--border))_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border))_1px,transparent_1px)] [background-size:28px_28px]" />
        <div className="relative flex flex-col items-center gap-2 text-center">
          <FileKindIcon kind="image" size="lg" />
          <p className="max-w-[240px] text-[12px] font-medium">{file.name}</p>
          <p className="text-[10.5px] text-muted-foreground">
            Illustrative placeholder — the image binary is not stored in this demo.
          </p>
        </div>
      </div>
    );
  }

  if (file.kind === "spreadsheet" || file.kind === "dataset") {
    const columns = ["subject_id", "session", "metric", "value"];
    return (
      <div className="overflow-hidden rounded-lg border border-border">
        <div className="grid grid-cols-4 bg-muted/60 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
          {columns.map((column) => (
            <span key={column} className="truncate">
              {column}
            </span>
          ))}
        </div>
        {[1, 2, 3, 4, 5, 6].map((row) => (
          <div
            key={row}
            className="grid grid-cols-4 border-t border-border px-3 py-1.5 text-[10.5px] text-muted-foreground odd:bg-card even:bg-muted/20"
          >
            <span className="truncate font-medium text-foreground/80">S{String(row).padStart(3, "0")}</span>
            <span>{row % 2 === 0 ? "follow-up" : "baseline"}</span>
            <span className="truncate">{row % 3 === 0 ? "quality_score" : "mean_power"}</span>
            <span className="tabular-nums">{(0.42 + row * 0.031).toFixed(3)}</span>
          </div>
        ))}
        <p className="border-t border-border bg-muted/30 px-3 py-2 text-[10px] text-muted-foreground">
          Sample rows generated for this preview. No tabular data was uploaded.
        </p>
      </div>
    );
  }

  if (file.kind === "code") {
    return (
      <pre className="overflow-x-auto rounded-lg border border-border bg-navy-950 p-4 text-[10.5px] leading-relaxed text-slate-200">
        <code>{`# Demo preview of ${file.name}
import pandas as pd

def calibrate(sensor_df, reference_df):
    """Align low-cost sensors to a reference series."""
    merged = sensor_df.merge(reference_df, on="site_id")
    bias = (merged.sensor_temp - merged.reference_temp).mean()
    return merged.assign(corrected_temp=merged.sensor_temp - bias)

if __name__ == "__main__":
    data = pd.read_csv("sensor-readings.csv")
    print(calibrate(data, data).head())
`}</code>
      </pre>
    );
  }

  if (file.kind === "archive") {
    return (
      <div className="overflow-hidden rounded-lg border border-border">
        {[
          "metadata.json",
          "readme.txt",
          "raw/",
          "raw/run-001.fastq",
          "raw/run-002.fastq",
          "processed/",
        ].map((entry) => (
          <div
            key={entry}
            className="flex items-center justify-between gap-3 border-b border-border px-3 py-2 text-[11.5px] last:border-b-0 odd:bg-card even:bg-muted/20"
          >
            <span className="font-mono text-[10.5px]">{entry}</span>
            <span className="text-[10px] text-muted-foreground">
              {entry.endsWith("/") ? "folder" : "file"}
            </span>
          </div>
        ))}
        <p className="border-t border-border bg-muted/30 px-3 py-2 text-[10px] text-muted-foreground">
          Illustrative archive listing. The archive contents are not stored in this demo.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-white p-6 text-slate-900 shadow-subtle dark:border-navy-600">
      <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        ResearchOS · Demo document
      </p>
      <h4 className="mt-2 text-[14px] font-semibold leading-snug">{file.name}</h4>
      <p className="mt-1 text-[9.5px] text-slate-600">
        {file.uploadedBy.name} · {formatDate(file.uploadedAt)}
      </p>
      <div className="my-4 h-px bg-slate-200" />
      <div className="space-y-1.5">
        {[100, 96, 88, 100, 72].map((width, index) => (
          <div
            key={index}
            className="h-1.5 rounded-full bg-slate-200"
            style={{ width: `${width}%` }}
          />
        ))}
      </div>
      <div className="mt-4 space-y-1.5">
        {[100, 92, 98, 84].map((width, index) => (
          <div
            key={index}
            className="h-1.5 rounded-full bg-slate-200"
            style={{ width: `${width}%` }}
          />
        ))}
      </div>
      <p className="mt-4 rounded border border-slate-200 bg-slate-50 px-2.5 py-2 text-[9.5px] italic leading-relaxed text-slate-500">
        “{file.description || "A typeset placeholder for the demo file viewer."}”
      </p>
      <p className="mt-3 text-[8.5px] text-slate-500">
        Typeset demo preview. No document binary is attached to this record.
      </p>
    </div>
  );
}

export function FilePreviewSheet({
  file,
  open,
  onOpenChange,
  projectTitle,
  folderName,
  onRename,
  onDelete,
}: {
  file: ResearchFile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectTitle?: string;
  folderName?: string;
  onRename: (file: ResearchFile) => void;
  onDelete: (file: ResearchFile) => void;
}) {
  const queryClient = useQueryClient();
  const star = useMutation({
    mutationFn: () => {
      if (!file) throw new Error("No file selected");
      return filesApi.toggleStar(file.id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.files });
    },
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-[96%] max-w-xl flex-col gap-0 p-0">
        {file && (
          <>
            <SheetHeader className="shrink-0 gap-3 border-b border-border p-6 pr-12">
              <div className="flex items-start gap-3">
                <FileKindIcon kind={file.kind} size="lg" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="outline" className="font-normal">
                      {fileKindMeta[file.kind].label}
                    </Badge>
                    {file.starred && (
                      <Star className="size-3.5 fill-amber-400 text-amber-500" />
                    )}
                  </div>
                  <SheetTitle className="mt-1.5 break-words text-[17px] leading-snug">
                    {file.name}
                  </SheetTitle>
                  <SheetDescription className="mt-1 text-[11.5px]">
                    {formatBytes(file.size)} · Added {formatDate(file.uploadedAt)}
                  </SheetDescription>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    toast.info("Preview record only", {
                      description:
                        "This demo stores metadata, not file contents, so there is no binary to download.",
                    });
                  }}
                >
                  <Download className="size-3.5" />
                  Download
                </Button>
                <Button size="sm" variant="outline" onClick={() => onRename(file)}>
                  <Pencil className="size-3.5" /> Rename
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => star.mutate()}
                  aria-pressed={file.starred}
                >
                  <Star
                    className={cn(
                      "size-3.5",
                      file.starred && "fill-amber-400 text-amber-500",
                    )}
                  />
                  {file.starred ? "Starred" : "Star"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => onDelete(file)}
                >
                  <Trash2 className="size-3.5" /> Delete
                </Button>
              </div>
            </SheetHeader>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-6 scrollbar-thin">
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-800 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200">
                <strong className="font-semibold">Demo preview.</strong> This prototype stores file
                metadata only. Binary contents are never uploaded or opened.
              </div>

              <PreviewBody file={file} />

              <dl className="divide-y divide-border rounded-lg border border-border text-[12px]">
                <div className="flex items-start justify-between gap-4 px-4 py-2.5">
                  <dt className="text-muted-foreground">Folder</dt>
                  <dd className="text-right font-medium">{folderName ?? "All files"}</dd>
                </div>
                <div className="flex items-start justify-between gap-4 px-4 py-2.5">
                  <dt className="text-muted-foreground">Project</dt>
                  <dd className="text-right font-medium">{projectTitle ?? "Not linked"}</dd>
                </div>
                <div className="flex items-start justify-between gap-4 px-4 py-2.5">
                  <dt className="text-muted-foreground">Kind</dt>
                  <dd className="text-right font-medium">{fileKindMeta[file.kind].label}</dd>
                </div>
                <div className="flex items-start justify-between gap-4 px-4 py-2.5">
                  <dt className="text-muted-foreground">Size</dt>
                  <dd className="text-right font-medium tabular-nums">{formatBytes(file.size)}</dd>
                </div>
                <div className="flex items-start justify-between gap-4 px-4 py-2.5">
                  <dt className="text-muted-foreground">Uploaded by</dt>
                  <dd className="flex items-center justify-end gap-1.5 text-right font-medium">
                    <UserRound className="size-3 text-muted-foreground" />
                    {file.uploadedBy.name}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4 px-4 py-2.5">
                  <dt className="text-muted-foreground">Uploaded</dt>
                  <dd className="text-right font-medium">{formatDate(file.uploadedAt)}</dd>
                </div>
              </dl>

              {file.description && (
                <div>
                  <h4 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                    Description
                  </h4>
                  <p className="mt-1.5 text-[12px] leading-relaxed">{file.description}</p>
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
