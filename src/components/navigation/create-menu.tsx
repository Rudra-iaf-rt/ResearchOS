import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BookPlus,
  CloudUpload,
  FolderPlus,
  Microscope,
  NotebookPen,
  SquareCheckBig,
} from "lucide-react";
import { useCreateDialogs } from "./create-dialogs-provider";

export function CreateMenu({ compact = false }: { compact?: boolean }) {
  const { openCreate } = useCreateDialogs();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size={compact ? "icon" : "default"} aria-label="Create new">
          <Plus className="size-4" />
          {!compact && "Create"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>Create in workspace</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => openCreate("log")}>
          <Microscope />
          Log research activity
          <DropdownMenuShortcut>C</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => openCreate("project")}>
          <FolderPlus />
          New project
          <DropdownMenuShortcut>P</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => openCreate("task")}>
          <SquareCheckBig />
          New task
          <DropdownMenuShortcut>T</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => openCreate("notebook")}>
          <NotebookPen />
          New notebook
          <DropdownMenuShortcut>N</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => openCreate("paper")}>
          <BookPlus />
          Add research paper
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => openCreate("upload")}>
          <CloudUpload />
          Upload file
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
