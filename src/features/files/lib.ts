import type { FileKind } from "@/types";

const extensionMap: Record<string, FileKind> = {
  pdf: "pdf",
  csv: "spreadsheet",
  xlsx: "spreadsheet",
  xls: "spreadsheet",
  doc: "document",
  docx: "document",
  txt: "document",
  md: "document",
  png: "image",
  jpg: "image",
  jpeg: "image",
  gif: "image",
  svg: "image",
  webp: "image",
  py: "code",
  r: "code",
  js: "code",
  ts: "code",
  ipynb: "code",
  zip: "archive",
  tar: "archive",
  gz: "archive",
  parquet: "dataset",
  h5: "dataset",
  nc: "dataset",
  geojson: "dataset",
  json: "dataset",
};

export function inferFileKind(name: string): FileKind {
  const extension = name.split(".").pop()?.toLowerCase() ?? "";
  return extensionMap[extension] ?? "document";
}

export function kindLabel(name: string) {
  const extension = name.split(".").pop()?.toUpperCase() ?? "FILE";
  return extension;
}
