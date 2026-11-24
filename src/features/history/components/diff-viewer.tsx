import { useMemo } from "react";
import { diffArrays, diffLines } from "diff";
import { cn } from "@/lib/utils";
import { htmlToText, parseTableText } from "../lib";

export type DiffMode = "text" | "markdown" | "table";

export interface DiffViewerProps {
  left: { label: string; content: string };
  right: { label: string; content: string };
  mode: DiffMode;
}

interface DiffLine {
  kind: "added" | "removed" | "unchanged";
  text: string;
}

function splitLines(value: string): string[] {
  const lines = value.replace(/\r\n/g, "\n").split("\n");
  if (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
  return lines;
}

function buildLineDiff(left: string, right: string): {
  lines: DiffLine[];
  additions: number;
  removals: number;
} {
  const changes = diffLines(left, right);
  const lines: DiffLine[] = [];
  let additions = 0;
  let removals = 0;

  changes.forEach((change) => {
    const kind: DiffLine["kind"] = change.added
      ? "added"
      : change.removed
        ? "removed"
        : "unchanged";
    splitLines(change.value).forEach((text) => {
      lines.push({ kind, text });
      if (kind === "added") additions += 1;
      if (kind === "removed") removals += 1;
    });
  });

  return { lines, additions, removals };
}

interface TableRowDiff {
  kind: "added" | "removed" | "unchanged" | "changed";
  cells: { text: string; previous?: string; changed: boolean }[];
}

function buildTableDiff(left: string, right: string): {
  rows: TableRowDiff[];
  additions: number;
  removals: number;
} {
  const leftRows = parseTableText(left).rows;
  const rightRows = parseTableText(right).rows;
  const leftKeys = leftRows.map((row) => row.join(" | "));
  const rightKeys = rightRows.map((row) => row.join(" | "));
  const changes = diffArrays(leftKeys, rightKeys);

  const rows: TableRowDiff[] = [];
  let additions = 0;
  let removals = 0;
  const paired = new Set<number>();

  changes.forEach((change, index) => {
    if (paired.has(index)) return;
    if (change.removed) {
      removals += change.value.length;
      const next = changes[index + 1];
      if (next?.added && next.value.length === change.value.length) {
        // Pair removed/added rows of equal length to show cell-level changes.
        change.value.forEach((key, rowIndex) => {
          const before = leftRows[leftKeys.indexOf(key)];
          const after = rightRows[rightKeys.indexOf(next.value[rowIndex])];
          const columns = Math.max(before.length, after.length);
          rows.push({
            kind: "changed",
            cells: Array.from({ length: columns }).map((_, column) => {
              const oldCell = before[column] ?? "";
              const newCell = after[column] ?? "";
              return {
                text: newCell,
                previous: oldCell,
                changed: oldCell !== newCell,
              };
            }),
          });
        });
        paired.add(index + 1);
        return;
      }
      change.value.forEach((key) => {
        const row = leftRows[leftKeys.indexOf(key)];
        rows.push({
          kind: "removed",
          cells: row.map((cell) => ({ text: cell, changed: true })),
        });
      });
      return;
    }

    if (change.added) {
      additions += change.value.length;
      change.value.forEach((key) => {
        const row = rightRows[rightKeys.indexOf(key)];
        rows.push({
          kind: "added",
          cells: row.map((cell) => ({ text: cell, changed: true })),
        });
      });
      return;
    }

    change.value.forEach((key) => {
      const row = leftRows[leftKeys.indexOf(key)];
      rows.push({
        kind: "unchanged",
        cells: row.map((cell) => ({ text: cell, changed: false })),
      });
    });
  });

  return { rows, additions, removals };
}

export function DiffViewer({ left, right, mode }: DiffViewerProps) {
  const normalizedLeft = mode === "markdown" ? htmlToText(left.content) : left.content;
  const normalizedRight = mode === "markdown" ? htmlToText(right.content) : right.content;

  const lineDiff = useMemo(
    () => (mode === "table" ? null : buildLineDiff(normalizedLeft, normalizedRight)),
    [mode, normalizedLeft, normalizedRight],
  );
  const tableDiff = useMemo(
    () => (mode === "table" ? buildTableDiff(normalizedLeft, normalizedRight) : null),
    [mode, normalizedLeft, normalizedRight],
  );

  const additions = tableDiff?.additions ?? lineDiff?.additions ?? 0;
  const removals = tableDiff?.removals ?? lineDiff?.removals ?? 0;

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/40 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2 text-[12px]">
          <span className="truncate font-medium">{left.label}</span>
          <span aria-hidden="true" className="text-muted-foreground">→</span>
          <span className="truncate font-medium">{right.label}</span>
        </div>
        <div className="flex items-center gap-2 text-[11.5px] font-medium">
          <span className="text-emerald-600 dark:text-emerald-400">+{additions}</span>
          <span className="text-rose-600 dark:text-rose-400">−{removals}</span>
          <span className="rounded-full border border-border bg-card px-2 py-0.5 text-muted-foreground">
            {mode}
          </span>
        </div>
      </div>

      {additions === 0 && removals === 0 ? (
        <p className="px-3 py-8 text-center text-[12.5px] text-muted-foreground">
          These versions have no {mode === "table" ? "row" : "line"} differences.
        </p>
      ) : mode === "table" && tableDiff ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <caption className="sr-only">
              Table differences between {left.label} and {right.label}
            </caption>
            <tbody className="divide-y divide-border">
              {tableDiff.rows.map((row, index) => (
                <tr
                  key={index}
                  className={cn(
                    row.kind === "added" && "bg-emerald-50/70 dark:bg-emerald-500/10",
                    row.kind === "removed" && "bg-rose-50/70 line-through decoration-rose-400/60 dark:bg-rose-500/10",
                    row.kind === "changed" && "bg-amber-50/50 dark:bg-amber-500/5",
                  )}
                >
                  <th scope="row" className="w-10 px-2 py-1.5 text-center text-[11px] font-medium text-muted-foreground">
                    {row.kind === "added" ? "+" : row.kind === "removed" ? "−" : row.kind === "changed" ? "~" : index + 1}
                  </th>
                  {row.cells.map((cell, column) => (
                    <td
                      key={column}
                      className={cn(
                        "px-2 py-1.5 align-top",
                        cell.changed && row.kind === "changed" && "bg-amber-100/70 dark:bg-amber-500/15",
                      )}
                    >
                      {row.kind === "changed" && cell.changed ? (
                        <span>
                          <span className="text-muted-foreground line-through decoration-rose-400/60">
                            {cell.previous || "∅"}
                          </span>
                          <span aria-hidden="true" className="mx-1 text-muted-foreground">→</span>
                          <span className="font-medium">{cell.text || "∅"}</span>
                        </span>
                      ) : (
                        cell.text || "—"
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="max-h-[52vh] overflow-auto bg-card font-mono text-[11.5px] leading-relaxed">
          <ol>
            {lineDiff?.lines.map((line, index) => (
              <li
                key={index}
                className={cn(
                  "flex gap-2 whitespace-pre-wrap break-words px-3 py-0.5",
                  line.kind === "added" && "bg-emerald-50/80 text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-200",
                  line.kind === "removed" && "bg-rose-50/80 text-rose-900 dark:bg-rose-500/10 dark:text-rose-200",
                  line.kind === "unchanged" && "text-muted-foreground",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "w-3 shrink-0 select-none text-center",
                    line.kind === "added" && "text-emerald-600 dark:text-emerald-400",
                    line.kind === "removed" && "text-rose-600 dark:text-rose-400",
                  )}
                >
                  {line.kind === "added" ? "+" : line.kind === "removed" ? "−" : " "}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="sr-only">
                    {line.kind === "added" ? "Added: " : line.kind === "removed" ? "Removed: " : ""}
                  </span>
                  {line.text || "\u00A0"}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
