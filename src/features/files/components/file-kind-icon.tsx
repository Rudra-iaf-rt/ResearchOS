import {
  Archive,
  Code2,
  Database,
  File as FileIcon,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import { fileKindMeta } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { FileKind } from "@/types";

const icons: Record<FileKind, typeof FileIcon> = {
  pdf: FileText,
  dataset: Database,
  image: ImageIcon,
  document: FileText,
  code: Code2,
  spreadsheet: FileSpreadsheet,
  archive: Archive,
};

export function FileKindIcon({
  kind,
  className,
  size = "md",
}: {
  kind: FileKind;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const Icon = icons[kind];
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg",
        fileKindMeta[kind].color,
        size === "sm" && "size-7 rounded-md",
        size === "md" && "size-9",
        size === "lg" && "size-12 rounded-xl",
        className,
      )}
      aria-hidden="true"
    >
      <Icon
        className={cn(
          size === "sm" && "size-3.5",
          size === "md" && "size-4",
          size === "lg" && "size-5",
        )}
      />
    </span>
  );
}
