import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import { snapshotArtifactHref } from "../lib";
import type { SnapshotManifestEntry } from "@/types";

const typeLabel: Record<SnapshotManifestEntry["artifactType"], string> = {
  notebook: "Notebook",
  experiment: "Experiment",
  dataset: "Dataset",
  file: "File",
  decision: "Decision",
};

export function SnapshotManifest({ manifest }: { manifest: SnapshotManifestEntry[] }) {
  if (manifest.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-[12.5px] text-muted-foreground">
        This snapshot has no manifest entries.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[560px] text-left text-[12.5px]">
        <caption className="sr-only">Snapshot manifest</caption>
        <thead className="border-b border-border bg-muted/40 text-[11px] uppercase tracking-wide text-muted-foreground">
          <tr>
            <th scope="col" className="px-3 py-2 font-medium">Artifact</th>
            <th scope="col" className="px-3 py-2 font-medium">Type</th>
            <th scope="col" className="px-3 py-2 font-medium">Revision</th>
            <th scope="col" className="px-3 py-2 font-medium">Selected</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {manifest.map((entry) => {
            const href = snapshotArtifactHref(entry);
            return (
              <tr key={entry.id}>
                <td className="px-3 py-2">
                  {href ? (
                    <Link
                      to={href}
                      className="inline-flex items-center gap-1.5 font-medium text-foreground hover:text-teal-700 dark:hover:text-teal-300"
                    >
                      {entry.title}
                      <ExternalLink className="size-3 text-muted-foreground" aria-hidden="true" />
                    </Link>
                  ) : (
                    <span className="font-medium">{entry.title}</span>
                  )}
                  <p className="mt-0.5 font-mono text-[10.5px] text-muted-foreground">
                    {entry.artifactId}
                  </p>
                </td>
                <td className="px-3 py-2">
                  <Badge variant="outline">{typeLabel[entry.artifactType]}</Badge>
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {entry.versionRef ?? "—"}
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {formatDate(entry.selectedAt, "MMM d, yyyy HH:mm")}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
