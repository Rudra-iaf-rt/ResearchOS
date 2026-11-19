import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { TaskStatus } from "@/types";
import { ProjectFormDialog } from "@/features/projects/components/project-form-dialog";
import { TaskFormDialog } from "@/features/tasks/components/task-form-dialog";
import { NotebookFormDialog } from "@/features/notebooks/components/notebook-form-dialog";
import { PaperFormDialog } from "@/features/library/components/paper-form-dialog";
import { UploadDialog } from "@/features/files/components/upload-dialog";
import { ResearchLogFormDialog } from "@/features/research-log/components/research-log-form-dialog";

export type CreateKind =
  | "project"
  | "task"
  | "notebook"
  | "paper"
  | "upload"
  | "log";

interface CreateOptions {
  projectId?: string;
  folderId?: string | null;
  taskStatus?: TaskStatus;
}

interface CreateDialogsContextValue {
  openCreate: (kind: CreateKind, options?: CreateOptions) => void;
  closeCreate: () => void;
}

const CreateDialogsContext = createContext<CreateDialogsContextValue | null>(null);

export function CreateDialogsProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<{ kind: CreateKind; options: CreateOptions } | null>(
    null,
  );

  const value = useMemo<CreateDialogsContextValue>(
    () => ({
      openCreate: (kind, options = {}) => setActive({ kind, options }),
      closeCreate: () => setActive(null),
    }),
    [],
  );

  return (
    <CreateDialogsContext.Provider value={value}>
      {children}
      <ProjectFormDialog
        open={active?.kind === "project"}
        onOpenChange={(open) => !open && setActive(null)}
      />
      <TaskFormDialog
        open={active?.kind === "task"}
        onOpenChange={(open) => !open && setActive(null)}
        defaultProjectId={active?.options.projectId}
        defaultStatus={active?.options.taskStatus}
      />
      <NotebookFormDialog
        open={active?.kind === "notebook"}
        onOpenChange={(open) => !open && setActive(null)}
        defaultProjectId={active?.options.projectId}
      />
      <PaperFormDialog
        open={active?.kind === "paper"}
        onOpenChange={(open) => !open && setActive(null)}
        defaultProjectId={active?.options.projectId}
      />
      <UploadDialog
        open={active?.kind === "upload"}
        onOpenChange={(open) => !open && setActive(null)}
        defaultFolderId={active?.options.folderId ?? null}
        defaultProjectId={active?.options.projectId ?? null}
      />
      <ResearchLogFormDialog
        open={active?.kind === "log"}
        onOpenChange={(open) => !open && setActive(null)}
        defaultProjectId={active?.options.projectId}
        variant="quick"
      />
    </CreateDialogsContext.Provider>
  );
}

export function useCreateDialogs() {
  const context = useContext(CreateDialogsContext);
  if (!context) {
    throw new Error("useCreateDialogs must be used within CreateDialogsProvider");
  }
  return context;
}
