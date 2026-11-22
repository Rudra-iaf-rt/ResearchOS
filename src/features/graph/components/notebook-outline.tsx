import { useEffect, useMemo, useState } from "react";
import type { Editor } from "@tiptap/react";
import {
  ChevronDown,
  ChevronRight,
  GripVertical,
  ListTree,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  buildOutlineTree,
  extractOutline,
  moveOutlineSection,
  scrollToHeading,
  type OutlineDropPosition,
  type OutlineHeading,
  type OutlineTreeNode,
} from "../lib/outline";

interface NotebookOutlineProps {
  editor: Editor | null;
  className?: string;
}

interface DropState {
  id: string;
  position: OutlineDropPosition;
}

function OutlineBranch({
  nodes,
  depth,
  activeId,
  dragId,
  drop,
  onSelect,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: {
  nodes: OutlineTreeNode[];
  depth: number;
  activeId: string | null;
  dragId: string | null;
  drop: DropState | null;
  onSelect: (heading: OutlineHeading) => void;
  onDragStart: (heading: OutlineHeading) => void;
  onDragEnd: () => void;
  onDragOver: (event: React.DragEvent<HTMLButtonElement>, heading: OutlineHeading) => void;
  onDrop: (event: React.DragEvent<HTMLButtonElement>, heading: OutlineHeading) => void;
}) {
  return (
    <ul className={cn(depth > 0 && "ml-2.5 border-l border-border pl-1.5")}>
      {nodes.map((node) => (
        <OutlineRow
          key={node.id}
          node={node}
          depth={depth}
          activeId={activeId}
          dragId={dragId}
          drop={drop}
          onSelect={onSelect}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDragOver={onDragOver}
          onDrop={onDrop}
        />
      ))}
    </ul>
  );
}

function OutlineRow({
  node,
  depth,
  activeId,
  dragId,
  drop,
  onSelect,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: {
  node: OutlineTreeNode;
  depth: number;
  activeId: string | null;
  dragId: string | null;
  drop: DropState | null;
  onSelect: (heading: OutlineHeading) => void;
  onDragStart: (heading: OutlineHeading) => void;
  onDragEnd: () => void;
  onDragOver: (event: React.DragEvent<HTMLButtonElement>, heading: OutlineHeading) => void;
  onDrop: (event: React.DragEvent<HTMLButtonElement>, heading: OutlineHeading) => void;
}) {
  const [open, setOpen] = useState(true);
  const hasChildren = node.children.length > 0;
  const isDropTarget = drop?.id === node.id;
  const active = activeId === node.id;

  return (
    <li>
      <div
        className={cn(
          "group relative flex items-center gap-0.5 rounded-md",
          isDropTarget && drop.position === "before" && "before:absolute before:inset-x-1 before:top-0 before:h-0.5 before:rounded before:bg-teal-500",
          isDropTarget && drop.position === "after" && "after:absolute after:inset-x-1 after:bottom-0 after:h-0.5 after:rounded after:bg-teal-500",
          dragId === node.id && "opacity-50",
        )}
      >
        <span
          className="flex size-4 shrink-0 cursor-grab items-center justify-center text-muted-foreground/40 opacity-0 group-hover:opacity-100"
          aria-hidden="true"
        >
          <GripVertical className="size-3" />
        </span>
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? `Collapse ${node.text}` : `Expand ${node.text}`}
            aria-expanded={open}
            className="flex size-4 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted"
          >
            {open ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
          </button>
        ) : (
          <span className="flex size-4 shrink-0 items-center justify-center" aria-hidden="true">
            <span className="size-1 rounded-full bg-border" />
          </span>
        )}
        <button
          type="button"
          draggable
          onDragStart={(event) => {
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/plain", node.id);
            onDragStart(node);
          }}
          onDragEnd={onDragEnd}
          onDragOver={(event) => onDragOver(event, node)}
          onDrop={(event) => onDrop(event, node)}
          onClick={() => onSelect(node)}
          aria-label={`Jump to ${node.text}, heading level ${node.level}`}
          className={cn(
            "min-w-0 flex-1 truncate rounded px-1 py-1 text-left text-[11px] leading-snug transition-colors hover:bg-muted",
            active && "bg-teal-50 font-medium text-teal-800 dark:bg-teal-500/10 dark:text-teal-200",
            node.level === 1 && "font-medium",
          )}
          style={{ paddingLeft: `${4 + depth * 2}px` }}
        >
          {node.text}
        </button>
      </div>
      {hasChildren && open && (
        <OutlineBranch
          nodes={node.children}
          depth={depth + 1}
          activeId={activeId}
          dragId={dragId}
          drop={drop}
          onSelect={onSelect}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDragOver={onDragOver}
          onDrop={onDrop}
        />
      )}
    </li>
  );
}

export function NotebookOutline({ editor, className }: NotebookOutlineProps) {
  const [headings, setHeadings] = useState<OutlineHeading[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [drop, setDrop] = useState<DropState | null>(null);

  useEffect(() => {
    if (!editor) {
      setHeadings([]);
      return;
    }
    const sync = () => setHeadings(extractOutline(editor.getHTML()));
    sync();
    editor.on("update", sync);
    return () => {
      editor.off("update", sync);
    };
  }, [editor]);

  const tree = useMemo(() => buildOutlineTree(headings), [headings]);

  const handleSelect = (heading: OutlineHeading) => {
    if (!editor) return;
    setActiveId(heading.id);
    scrollToHeading(editor.view.dom as HTMLElement, heading.index);
  };

  const resetDrag = () => {
    setDragId(null);
    setDrop(null);
  };

  const handleDragOver = (
    event: React.DragEvent<HTMLButtonElement>,
    heading: OutlineHeading,
  ) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    const rect = event.currentTarget.getBoundingClientRect();
    const position: OutlineDropPosition =
      event.clientY < rect.top + rect.height / 2 ? "before" : "after";
    setDrop({ id: heading.id, position });
  };

  const handleDrop = (
    event: React.DragEvent<HTMLButtonElement>,
    heading: OutlineHeading,
  ) => {
    event.preventDefault();
    if (!editor) return;
    const sourceId = dragId ?? event.dataTransfer.getData("text/plain");
    const position = drop?.id === heading.id ? drop.position : "after";
    resetDrag();
    if (!sourceId || sourceId === heading.id) return;
    const current = editor.getHTML();
    const next = moveOutlineSection(current, sourceId, heading.id, position);
    if (next === current) {
      toast.error("That heading cannot move inside itself");
      return;
    }
    editor.commands.setContent(next, true);
    toast.success("Outline reordered", {
      description: "The document was updated and will autosave.",
    });
  };

  if (collapsed) {
    return (
      <div className={cn("hidden lg:block", className)}>
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          aria-expanded={false}
          aria-label="Expand outline"
          className="flex w-9 flex-col items-center gap-2 rounded-xl border border-border bg-card py-3 text-muted-foreground shadow-subtle transition-colors hover:text-foreground"
        >
          <PanelLeftOpen className="size-4" />
          <span className="text-[10px] font-medium uppercase tracking-[0.16em] [writing-mode:vertical-rl]">
            Outline
          </span>
        </button>
      </div>
    );
  }

  return (
    <aside
      className={cn(
        "hidden w-[240px] flex-col rounded-xl border border-border bg-card shadow-subtle lg:flex",
        className,
      )}
      aria-label="Notebook outline"
    >
      <div className="flex items-center gap-1.5 border-b border-border px-3 py-2.5">
        <ListTree className="size-3.5 text-muted-foreground" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Outline
        </p>
        <span className="rounded-full bg-muted px-1.5 text-[9px] tabular-nums text-muted-foreground">
          {headings.length}
        </span>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          aria-expanded
          aria-label="Collapse outline"
          className="ml-auto flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <PanelLeftClose className="size-3.5" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-1.5 scrollbar-thin">
        {headings.length === 0 ? (
          <div className="px-2 py-6 text-center">
            <ListTree className="mx-auto size-5 text-muted-foreground/50" />
            <p className="mt-2 text-[11px] font-medium">No headings yet</p>
            <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
              Add a heading to build a clickable, draggable outline for this entry.
            </p>
          </div>
        ) : (
          <OutlineBranch
            nodes={tree}
            depth={0}
            activeId={activeId}
            dragId={dragId}
            drop={drop}
            onSelect={handleSelect}
            onDragStart={(heading) => setDragId(heading.id)}
            onDragEnd={resetDrag}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          />
        )}
      </div>

      {headings.length > 0 && (
        <p className="border-t border-border px-3 py-2 text-[9.5px] leading-relaxed text-muted-foreground">
          Click to scroll. Drag to reorder sections; children move with their parent.
        </p>
      )}
    </aside>
  );
}
