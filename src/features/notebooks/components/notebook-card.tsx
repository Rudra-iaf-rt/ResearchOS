import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpRight,
  BookMarked,
  FolderKanban,
  MoreHorizontal,
  NotebookPen,
  Star,
  Trash2,
} from "lucide-react";
import { PersonAvatar } from "@/components/shared/avatar-group";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { fromNow } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import type { Notebook } from "@/types";
import { notebooksApi } from "../api";

export function NotebookCard({
  notebook,
  projectTitle,
  onDelete,
  view = "grid",
}: {
  notebook: Notebook;
  projectTitle?: string;
  onDelete: (notebook: Notebook) => void;
  view?: "grid" | "list";
}) {
  const queryClient = useQueryClient();
  const favorite = useMutation({
    mutationFn: () =>
      notebooksApi.update(notebook.id, { favorite: !notebook.favorite }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notebooks });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });

  const menu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-all hover:bg-muted hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:opacity-100 group-hover:opacity-100"
          aria-label={`Actions for ${notebook.title}`}
          onClick={(event) => event.preventDefault()}
        >
          <MoreHorizontal className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onSelect={() => favorite.mutate()}>
          <Star className={cn(notebook.favorite && "fill-amber-400 text-amber-500")} />
          {notebook.favorite ? "Remove favorite" : "Add to favorites"}
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to={`/app/notebooks/${notebook.id}`}>
            <ArrowUpRight /> Open notebook
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          destructive
          onSelect={(event) => {
            event.preventDefault();
            onDelete(notebook);
          }}
        >
          <Trash2 /> Delete notebook
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (view === "list") {
    return (
      <div className="group flex items-center gap-3 border-b border-border px-4 py-3.5 transition-colors last:border-b-0 hover:bg-muted/30">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
          <NotebookPen className="size-4" />
        </span>
        <Link to={`/app/notebooks/${notebook.id}`} className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-[13px] font-medium group-hover:text-teal-700 dark:group-hover:text-teal-300">
              {notebook.title}
            </span>
            {notebook.favorite && (
              <Star className="size-3 shrink-0 fill-amber-400 text-amber-500" />
            )}
          </div>
          <p className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
            {projectTitle ?? "Standalone"} · {notebook.entries.length} entries · updated{" "}
            {fromNow(notebook.updatedAt)}
          </p>
        </Link>
        <div className="hidden items-center gap-2 sm:flex">
          {notebook.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="secondary" className="font-normal">
              {tag}
            </Badge>
          ))}
        </div>
        <PersonAvatar person={notebook.author} className="hidden size-6 sm:flex" />
        {menu}
      </div>
    );
  }

  return (
    <article className="group relative flex h-full flex-col rounded-xl border border-border bg-card p-5 shadow-subtle transition-all duration-200 hover:-translate-y-0.5 hover:border-navy-200 hover:shadow-raised dark:hover:border-navy-600">
      <div className="flex items-start justify-between gap-2">
        <Link
          to={`/app/notebooks/${notebook.id}`}
          className="flex size-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600 transition-colors hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-300"
          aria-label={`Open ${notebook.title}`}
        >
          <NotebookPen className="size-4" />
        </Link>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => favorite.mutate()}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={notebook.favorite ? "Remove from favorites" : "Add to favorites"}
            aria-pressed={notebook.favorite}
          >
            <Star
              className={cn(
                "size-3.5",
                notebook.favorite && "fill-amber-400 text-amber-500",
              )}
            />
          </button>
          {menu}
        </div>
      </div>

      <Link to={`/app/notebooks/${notebook.id}`} className="mt-3 block outline-none">
        <h3 className="text-[14px] font-semibold leading-snug tracking-[-0.01em] transition-colors group-hover:text-teal-800 dark:group-hover:text-teal-300">
          {notebook.title}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">
          {notebook.description}
        </p>
      </Link>

      {notebook.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {notebook.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="font-normal">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3 text-[10.5px] text-muted-foreground">
        <span className="flex min-w-0 items-center gap-1">
          <BookMarked className="size-3 shrink-0" />
          <span className="truncate">{notebook.entries.length} entries</span>
          {projectTitle && (
            <>
              <span className="size-0.5 rounded-full bg-border" />
              <FolderKanban className="size-3 shrink-0" />
              <span className="truncate">{projectTitle}</span>
            </>
          )}
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          <PersonAvatar person={notebook.author} className="size-5" />
          {fromNow(notebook.updatedAt)}
        </span>
      </div>
    </article>
  );
}
