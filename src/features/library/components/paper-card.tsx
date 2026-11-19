import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  CheckCheck,
  ExternalLink,
  Eye,
  MoreHorizontal,
  Pencil,
  Quote,
  Star,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { PaperStatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatNumber } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import type { Paper } from "@/types";
import { libraryApi } from "../api";
import { doiUrl } from "../lib";

interface PaperCardProps {
  paper: Paper;
  projectTitle?: string;
  onOpen: (paper: Paper) => void;
  onEdit: (paper: Paper) => void;
  onDelete: (paper: Paper) => void;
  view?: "grid" | "list";
}

function PaperMenu({
  paper,
  onOpen,
  onEdit,
  onDelete,
}: Omit<PaperCardProps, "projectTitle" | "view">) {
  const queryClient = useQueryClient();
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.papers });
    void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    void queryClient.invalidateQueries({ queryKey: queryKeys.activity });
  };

  const markRead = useMutation({
    mutationFn: () =>
      libraryApi.setReadStatus(paper.id, paper.readStatus === "read" ? "unread" : "read"),
    onSuccess: () => {
      refresh();
      toast.success(paper.readStatus === "read" ? "Marked as unread" : "Marked as read");
    },
  });

  const copyCitation = () => {
    const citation = `${paper.authors.join(", ")} (${paper.year}). ${paper.title}. ${paper.journal}.${
      paper.doi ? ` https://doi.org/${paper.doi}` : ""
    }`;
    void navigator.clipboard?.writeText(citation);
    toast.success("Citation copied", { description: "Plain-text citation copied to clipboard." });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          onClick={(event) => event.stopPropagation()}
          className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`Actions for ${paper.title}`}
        >
          <MoreHorizontal className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52" onClick={(event) => event.stopPropagation()}>
        <DropdownMenuItem onSelect={() => onOpen(paper)}>
          <Eye /> View details
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onEdit(paper)}>
          <Pencil /> Edit metadata
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => markRead.mutate()}>
          <CheckCheck /> Mark as {paper.readStatus === "read" ? "unread" : "read"}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={copyCitation}>
          <Quote /> Copy citation
        </DropdownMenuItem>
        {paper.doi && (
          <DropdownMenuItem asChild>
            <a href={doiUrl(paper.doi)} target="_blank" rel="noreferrer">
              <ExternalLink /> Open DOI
            </a>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem destructive onSelect={() => onDelete(paper)}>
          <Trash2 /> Remove paper
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function FavoriteButton({ paper }: { paper: Paper }) {
  const queryClient = useQueryClient();
  const favorite = useMutation({
    mutationFn: () => libraryApi.toggleFavorite(paper.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.papers });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        favorite.mutate();
      }}
      aria-label={paper.favorite ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={paper.favorite}
      className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <Star
        className={cn("size-3.5", paper.favorite && "fill-amber-400 text-amber-500")}
      />
    </button>
  );
}

export function PaperCard({
  paper,
  projectTitle,
  onOpen,
  onEdit,
  onDelete,
  view = "grid",
}: PaperCardProps) {
  const menu = (
    <PaperMenu paper={paper} onOpen={onOpen} onEdit={onEdit} onDelete={onDelete} />
  );

  if (view === "list") {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => onOpen(paper)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onOpen(paper);
          }
        }}
        className="group flex cursor-pointer items-center gap-3 border-b border-border px-4 py-3.5 outline-none transition-colors last:border-b-0 hover:bg-muted/30 focus-visible:bg-muted/30"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300">
          <BookOpen className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium group-hover:text-teal-700 dark:group-hover:text-teal-300">
            {paper.title}
          </p>
          <p className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
            {paper.authors.join(", ")} · {paper.year} · {paper.journal}
            {projectTitle ? ` · ${projectTitle}` : ""}
          </p>
        </div>
        <div className="hidden w-40 items-center gap-1.5 lg:flex">
          {paper.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="secondary" className="max-w-24 truncate font-normal">
              {tag}
            </Badge>
          ))}
        </div>
        <span className="hidden w-16 text-right text-[11px] tabular-nums text-muted-foreground sm:block">
          <Quote className="mr-1 inline size-2.5" />
          {formatNumber(paper.citations)}
        </span>
        <PaperStatusBadge status={paper.readStatus} />
        <FavoriteButton paper={paper} />
        {menu}
      </div>
    );
  }

  return (
    <article
      onClick={() => onOpen(paper)}
      className="group relative flex h-full cursor-pointer flex-col rounded-xl border border-border bg-card p-5 shadow-subtle transition-all duration-200 hover:-translate-y-0.5 hover:border-navy-200 hover:shadow-raised dark:hover:border-navy-600"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="flex size-9 items-center justify-center rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300">
          <BookOpen className="size-4" />
        </span>
        <div className="flex items-center gap-0.5">
          <FavoriteButton paper={paper} />
          {menu}
        </div>
      </div>

      <h3 className="mt-3 line-clamp-2 text-[13.5px] font-semibold leading-snug tracking-[-0.01em] transition-colors group-hover:text-teal-800 dark:group-hover:text-teal-300">
        {paper.title}
      </h3>
      <p className="mt-1.5 truncate text-[11.5px] text-muted-foreground">
        {paper.authors.join(", ")}
      </p>
      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
        <span className="font-medium text-foreground/80">{paper.journal}</span> · {paper.year}
      </p>

      <p className="mt-2.5 line-clamp-2 text-[11.5px] leading-relaxed text-muted-foreground">
        {paper.abstract || "No abstract saved for this citation."}
      </p>

      {paper.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {paper.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="font-normal">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3 text-[10.5px] text-muted-foreground">
        <span className="flex min-w-0 items-center gap-1.5">
          <Quote className="size-2.5 shrink-0" />
          <span className="tabular-nums">{formatNumber(paper.citations)} citations</span>
          {projectTitle && (
            <>
              <span className="size-0.5 shrink-0 rounded-full bg-border" />
              <span className="truncate">{projectTitle}</span>
            </>
          )}
        </span>
        <PaperStatusBadge status={paper.readStatus} />
      </div>
    </article>
  );
}

export { PaperMenu };
