import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { Tree, type NodeRendererProps, type TreeApi } from "react-arborist";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CornerDownRight,
  Flag,
  FolderKanban,
  GripVertical,
  Loader2,
  Network,
  Pencil,
  RotateCcw,
  SquareCheckBig,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { queryKeys } from "@/lib/query-keys";
import { deadlineLabel, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Milestone, Task } from "@/types";
import { milestonesApi } from "@/features/milestones/api";
import { projectsApi } from "@/features/projects/api";
import { tasksApi } from "@/features/tasks/api";
import {
  UNASSIGNED_MILESTONE_ID,
  buildProjectTaskTree,
  findTreeNode,
  isTaskDescendant,
  type TaskTreeNode,
} from "../lib/task-tree";

function statusVariant(node: TaskTreeNode): BadgeProps["variant"] {
  switch (node.status) {
    case "completed":
    case "active":
      return "success";
    case "in-progress":
    case "planning":
      return "info";
    case "at-risk":
    case "on-hold":
      return "warning";
    default:
      return "neutral";
  }
}

function statusLabel(node: TaskTreeNode): string {
  if (!node.status) return "—";
  if (node.kind === "project") {
    return node.status === "on-hold"
      ? "On hold"
      : node.status.charAt(0).toUpperCase() + node.status.slice(1);
  }
  return node.status === "unassigned"
    ? "Unassigned"
    : node.status.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function KindIcon({ node }: { node: TaskTreeNode }) {
  if (node.kind === "project") return <FolderKanban className="size-3.5 text-teal-600 dark:text-teal-300" />;
  if (node.kind === "milestone") return <Flag className="size-3.5 text-indigo-500" />;
  if (node.kind === "subtask") return <CornerDownRight className="size-3.5 text-muted-foreground" />;
  return <SquareCheckBig className="size-3.5 text-muted-foreground" />;
}

function TreeRow({ node, style, dragHandle }: NodeRendererProps<TaskTreeNode>) {
  const data = node.data;
  const overdue =
    data.dueDate &&
    data.status !== "completed" &&
    new Date(data.dueDate).getTime() < Date.now() &&
    data.status !== "unassigned";

  return (
    <div
      style={style}
      onClick={() => node.select()}
      onDoubleClick={() => {
        if (node.isInternal && data.kind === "project") node.toggle();
      }}
      className={cn(
        "group flex cursor-pointer select-none items-center gap-1.5 rounded-md border border-transparent px-1.5 text-[12px] outline-none",
        node.isSelected && "border-teal-200 bg-teal-50/80 dark:border-teal-500/30 dark:bg-teal-500/10",
        node.isFocused && !node.isSelected && "bg-muted/60",
        node.willReceiveDrop && "border-dashed border-teal-400 bg-teal-50/50 dark:bg-teal-500/10",
        node.isDragging && "opacity-50",
      )}
      aria-label={`${data.name}, ${data.kind}${data.status ? `, ${statusLabel(data)}` : ""}`}
    >
      <div
        ref={dragHandle}
        className={cn(
          "flex size-4 shrink-0 items-center justify-center text-muted-foreground/50",
          data.kind === "project" || data.kind === "milestone"
            ? "cursor-default opacity-0"
            : "cursor-grab opacity-0 group-hover:opacity-100",
        )}
        aria-hidden="true"
      >
        <GripVertical className="size-3" />
      </div>

      {node.isInternal ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            node.toggle();
          }}
          className="flex size-4 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted"
          aria-label={node.isOpen ? `Collapse ${data.name}` : `Expand ${data.name}`}
        >
          {node.isOpen ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
        </button>
      ) : (
        <span className="size-4 shrink-0" />
      )}

      <KindIcon node={data} />

      {node.isEditing ? (
        <input
          autoFocus
          defaultValue={data.name}
          onClick={(event) => event.stopPropagation()}
          onBlur={(event) => node.submit(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") node.submit(event.currentTarget.value);
            if (event.key === "Escape") node.reset();
          }}
          className="min-w-0 flex-1 rounded border border-teal-400 bg-background px-1 py-0.5 text-[12px] outline-none"
          aria-label={`Rename ${data.name}`}
        />
      ) : (
        <span
          onDoubleClick={(event) => {
            event.stopPropagation();
            node.edit();
          }}
          title="Double-click to rename"
          className={cn(
            "min-w-0 flex-1 truncate",
            data.kind === "project" ? "font-semibold" : "font-medium",
            data.kind === "milestone" && "text-[11.5px]",
          )}
        >
          {data.name}
        </span>
      )}

      {data.kind !== "project" && data.status && (
        <Badge variant={statusVariant(data)} className="hidden shrink-0 text-[9.5px] sm:inline-flex">
          {statusLabel(data)}
        </Badge>
      )}

      {data.dueDate && (
        <span
          className={cn(
            "hidden shrink-0 items-center gap-1 text-[9.5px] text-muted-foreground md:flex",
            overdue && "font-medium text-rose-600 dark:text-rose-400",
          )}
        >
          <CalendarDays className="size-2.5" />
          {data.kind === "project"
            ? formatDate(data.dueDate, "MMM d")
            : deadlineLabel(data.dueDate)}
        </span>
      )}
    </div>
  );
}

interface RenameTarget {
  kind: TaskTreeNode["kind"];
  recordId: string;
  name: string;
}

export function ProjectTreePage() {
  const { projectId = "" } = useParams<{ projectId: string }>();
  const queryClient = useQueryClient();
  const treeRef = useRef<TreeApi<TaskTreeNode> | undefined>(undefined);
  const renameButtonRef = useRef<HTMLButtonElement>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.project(projectId),
    queryFn: () => projectsApi.get(projectId),
    enabled: Boolean(projectId),
  });

  const treeData = useMemo(
    () =>
      data
        ? buildProjectTaskTree(data.project, data.milestones, data.tasks)
        : null,
    [data],
  );

  const [selectedId, setSelectedId] = useState<string>("");
  const [renameTarget, setRenameTarget] = useState<RenameTarget | null>(null);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  useEffect(() => {
    if (treeData && !selectedId) setSelectedId(treeData.id);
  }, [treeData, selectedId]);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.project(projectId) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
    void queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    void queryClient.invalidateQueries({ queryKey: queryKeys.activity });
  };

  const rename = useMutation({
    mutationFn: async (target: RenameTarget) => {
      const next = target.name.trim();
      if (!next) throw new Error("Name cannot be empty");
      if (target.kind === "project") {
        await projectsApi.update(target.recordId, { title: next });
      } else if (target.kind === "milestone") {
        await milestonesApi.rename(target.recordId, next);
      } else {
        await tasksApi.rename(target.recordId, next);
      }
      return next;
    },
    onSuccess: (next) => {
      invalidate();
      setRenameOpen(false);
      toast.success("Renamed", { description: `Saved “${next}”.` });
    },
    onError: (error) => {
      toast.error("Could not rename", {
        description: error instanceof Error ? error.message : "Try again.",
      });
    },
  });

  const toggleComplete = useMutation({
    mutationFn: async (node: TaskTreeNode) => {
      if (node.kind === "task" || node.kind === "subtask") {
        const next = node.status === "completed" ? "in-progress" : "completed";
        return tasksApi.setStatus(node.recordId, next);
      }
      if (node.kind === "milestone") {
        const milestone = data?.milestones.find((item) => item.id === node.recordId);
        if (!milestone) throw new Error("Milestone not found");
        const completed = milestone.status === "completed";
        return milestonesApi.update(node.recordId, {
          status: completed ? "in-progress" : "completed",
          progress: completed ? Math.min(milestone.progress, 80) : 100,
        });
      }
      return null;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Tree updated");
    },
    onError: () => toast.error("Could not update the tree"),
  });

  const handleMove = async ({
    dragIds,
    parentId,
  }: {
    dragIds: string[];
    parentId: string | null;
  }) => {
    if (!data || dragIds.length !== 1) {
      toast.error("Move one task at a time");
      throw new Error("Unsupported move");
    }
    const dragId = dragIds[0];
    const dragNode = findTreeNode(treeData!, dragId)?.node;
    if (!dragNode || (dragNode.kind !== "task" && dragNode.kind !== "subtask")) {
      toast.error("Only tasks can be re-parented");
      throw new Error("Unsupported move");
    }
    if (!parentId) {
      toast.error("Drop tasks onto a milestone or another task");
      throw new Error("Unsupported move");
    }

    try {
      if (parentId.startsWith("milestone:")) {
        const milestoneId = parentId.slice("milestone:".length);
        await tasksApi.reparent(dragNode.recordId, {
          parentTaskId: null,
          milestoneId: milestoneId === UNASSIGNED_MILESTONE_ID ? null : milestoneId,
        });
      } else if (parentId.startsWith("task:")) {
        const parentTaskId = parentId.slice("task:".length);
        const parent = data.tasks.find((task) => task.id === parentTaskId);
        if (!parent) throw new Error("Target task not found");
        if (isTaskDescendant(data.tasks, parent.id, dragNode.recordId)) {
          throw new Error("A task cannot move inside its own subtask.");
        }
        await tasksApi.reparent(dragNode.recordId, {
          parentTaskId,
          milestoneId: parent.milestoneId ?? null,
        });
      } else {
        throw new Error("Drop tasks onto a milestone or another task.");
      }
      invalidate();
      toast.success("Task moved");
    } catch (error) {
      toast.error("Could not move the task", {
        description: error instanceof Error ? error.message : "Try again.",
      });
      throw error;
    }
  };

  const handleRenameFromTree = async ({
    id,
    name,
  }: {
    id: string;
    name: string;
  }) => {
    const node = findTreeNode(treeData!, id)?.node;
    if (!node) throw new Error("Node not found");
    await rename.mutateAsync({
      kind: node.kind,
      recordId: node.recordId,
      name,
    });
  };

  const openRename = (node: TaskTreeNode) => {
    setRenameTarget({ kind: node.kind, recordId: node.recordId, name: node.name });
    setRenameValue(node.name);
    setRenameOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-24 animate-pulse rounded-xl border border-border bg-card" />
        <div className="h-[600px] animate-pulse rounded-xl border border-border bg-card" />
      </div>
    );
  }

  if (isError || !data || !treeData) {
    return (
      <EmptyState
        icon={Network}
        title="Project tree not found"
        description="This project may have been deleted, or the link is out of date."
        action={
          <Button asChild>
            <Link to="/app/projects">Back to projects</Link>
          </Button>
        }
      />
    );
  }

  const selected = findTreeNode(treeData, selectedId)?.node ?? treeData;
  const selectedTask: Task | undefined =
    selected.kind === "task" || selected.kind === "subtask"
      ? data.tasks.find((task) => task.id === selected.recordId)
      : undefined;
  const selectedMilestone: Milestone | undefined =
    selected.kind === "milestone"
      ? data.milestones.find((milestone) => milestone.id === selected.recordId)
      : undefined;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" asChild className="-ml-2 gap-1.5">
          <Link to={`/app/projects/${projectId}`}>
            <ArrowLeft className="size-3.5" /> Back to project
          </Link>
        </Button>
        <span className="text-muted-foreground/40" aria-hidden="true">/</span>
        <span className="text-[11.5px] font-medium text-muted-foreground">Project tree</span>
      </div>

      <PageHeader
        eyebrow="Project tree"
        title={data.project.title}
        description="Project → milestones → tasks → subtasks. Drag tasks to re-parent, double-click a name to rename, and select a row for details."
        actions={
          <Button
            variant="outline"
            onClick={() => {
              treeRef.current?.openAll();
            }}
          >
            <RotateCcw className="size-4" /> Expand all
          </Button>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="h-[620px] overflow-hidden rounded-xl border border-border bg-card p-2 shadow-subtle">
          <Tree<TaskTreeNode>
            ref={treeRef}
            data={[treeData]}
            openByDefault
            width="100%"
            height={600}
            indent={18}
            rowHeight={32}
            disableMultiSelection
            disableDrag={(node) => node.kind !== "task" && node.kind !== "subtask"}
            disableDrop={({ parentNode, dragNodes }) => {
              if (!parentNode) return true;
              if (dragNodes.some((node) => node.data.kind !== "task" && node.data.kind !== "subtask")) {
                return true;
              }
              if (parentNode.data.kind === "project" || parentNode.data.kind === "subtask") return true;
              if (
                parentNode.data.kind === "task" &&
                dragNodes.some((node) => isTaskDescendant(data.tasks, parentNode.data.recordId, node.data.recordId))
              ) {
                return true;
              }
              return false;
            }}
            onMove={(args) => handleMove({ dragIds: args.dragIds, parentId: args.parentId })}
            onRename={handleRenameFromTree}
            onSelect={(nodes) => {
              const next = nodes[0];
              if (next) setSelectedId(next.id);
            }}
            aria-label="Project structure tree"
          >
            {TreeRow}
          </Tree>
        </div>

        <aside className="rounded-xl border border-border bg-card p-4 shadow-subtle xl:sticky xl:top-24 xl:self-start">
          <div className="flex items-start gap-2">
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
              <KindIcon node={selected} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                {selected.kind === "subtask" ? "Subtask" : selected.kind}
              </p>
              <h2 className="text-[13px] font-semibold leading-snug">{selected.name}</h2>
            </div>
            <Button
              ref={renameButtonRef}
              variant="ghost"
              size="icon"
              className="size-7"
              aria-label={`Rename ${selected.name}`}
              onClick={() => openRename(selected)}
            >
              <Pencil className="size-3.5" />
            </Button>
          </div>

          <div className="mt-3 space-y-2 text-[11px]">
            {selected.status && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={statusVariant(selected)}>{statusLabel(selected)}</Badge>
              </div>
            )}
            {selected.dueDate && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Due</span>
                <span className="font-medium">{formatDate(selected.dueDate, "MMM d, yyyy")}</span>
              </div>
            )}
            {selected.assignee && (
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Users className="size-3" /> Assignee
                </span>
                <span className="truncate font-medium">{selected.assignee}</span>
              </div>
            )}
            {selected.priority && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Priority</span>
                <span className="font-medium capitalize">{selected.priority}</span>
              </div>
            )}
            {selected.description && (
              <p className="border-t border-border pt-2 text-[10.5px] leading-relaxed text-muted-foreground">
                {selected.description}
              </p>
            )}
          </div>

          {(selectedTask || selectedMilestone) && (
            <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border pt-3">
              <Button
                size="sm"
                variant="outline"
                className="h-7 gap-1.5 text-[10.5px]"
                onClick={() => toggleComplete.mutate(selected)}
                disabled={toggleComplete.isPending}
              >
                {toggleComplete.isPending ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <CheckCircle2 className="size-3" />
                )}
                {selected.status === "completed" ? "Reopen" : "Mark complete"}
              </Button>
              {selectedTask && (
                <Button size="sm" variant="ghost" className="h-7 gap-1.5 text-[10.5px]" asChild>
                  <Link to="/app/tasks">
                    <SquareCheckBig className="size-3" /> Open tasks
                  </Link>
                </Button>
              )}
            </div>
          )}

          <p className="mt-3 border-t border-border pt-2 text-[10px] leading-relaxed text-muted-foreground">
            Subtasks are limited to one level. Invalid drops are rejected and the tree keeps its
            previous shape.
          </p>
        </aside>
      </div>

      <Dialog
        open={renameOpen}
        onOpenChange={(open) => {
          setRenameOpen(open);
          if (!open) {
            window.setTimeout(() => renameButtonRef.current?.focus(), 0);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rename {renameTarget?.kind ?? "item"}</DialogTitle>
            <DialogDescription>
              The new name is saved to this local demo workspace immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="tree-rename">Name</Label>
            <Input
              id="tree-rename"
              value={renameValue}
              onChange={(event) => setRenameValue(event.target.value)}
              autoFocus
              onKeyDown={(event) => {
                if (event.key === "Enter" && renameTarget) {
                  event.preventDefault();
                  rename.mutate({ ...renameTarget, name: renameValue });
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => renameTarget && rename.mutate({ ...renameTarget, name: renameValue })}
              disabled={!renameValue.trim() || rename.isPending}
            >
              Save name
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
