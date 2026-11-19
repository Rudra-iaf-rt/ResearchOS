import type { Folder, ResearchFile } from "@/types";
import { uid } from "@/lib/format";
import { logActivity, mutateDb, readDb } from "@/services/mock/client";
import { inferFileKind } from "./lib";

export interface UploadInput {
  name: string;
  size: number;
  folderId: string | null;
  projectId: string | null;
  description?: string;
}

export const filesApi = {
  list: () => readDb((db) => db.files),

  folders: () => readDb((db) => db.folders),

  upload: (inputs: UploadInput[]) =>
    mutateDb((db) => {
      const created: ResearchFile[] = inputs.map((input) => {
        const file: ResearchFile = {
          id: uid("file"),
          name: input.name,
          kind: inferFileKind(input.name),
          size: input.size,
          folderId: input.folderId,
          projectId: input.projectId,
          uploadedAt: new Date().toISOString(),
          uploadedBy: {
            id: db.user.id,
            name: db.user.name,
            initials: db.user.initials,
            role: db.user.role,
            color: db.user.avatarColor,
          },
          starred: false,
          description: input.description,
        };
        return file;
      });
      db.files.unshift(...created);
      created.forEach((file) => {
        logActivity(db, {
          category: "file",
          action: "uploaded a file",
          target: file.name,
          detail: `${file.kind} · ${file.size} bytes`,
          projectId: file.projectId,
        });
      });
      return created;
    }),

  rename: (id: string, name: string) =>
    mutateDb((db) => {
      const file = db.files.find((item) => item.id === id);
      if (!file) throw new Error("File not found");
      file.name = name;
      return file;
    }),

  toggleStar: (id: string) =>
    mutateDb((db) => {
      const file = db.files.find((item) => item.id === id);
      if (!file) throw new Error("File not found");
      file.starred = !file.starred;
      return file;
    }),

  remove: (id: string) =>
    mutateDb((db) => {
      const file = db.files.find((item) => item.id === id);
      db.files = db.files.filter((item) => item.id !== id);
      if (file) {
        logActivity(db, {
          category: "file",
          action: "deleted a file",
          target: file.name,
          projectId: file.projectId,
        });
      }
      return { id };
    }),

  createFolder: (name: string, parentId: string | null) =>
    mutateDb((db) => {
      const folder: Folder = {
        id: uid("folder"),
        name,
        parentId,
        createdAt: new Date().toISOString(),
      };
      db.folders.push(folder);
      return folder;
    }),
};
