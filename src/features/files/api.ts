import type { Folder, ResearchFile } from "@/types";
import { uid } from "@/lib/format";
import { logActivity, mutateDb, readDb } from "@/services/mock/client";
import { canMoveFolder, folderDescendantIds } from "@/features/graph/lib/file-tree";
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

  createFolder: (name: string, parentId: string | null, projectId: string | null = null) =>
    mutateDb((db) => {
      const nextName = name.trim();
      if (!nextName) throw new Error("Folder name cannot be empty");
      if (parentId && !db.folders.some((folder) => folder.id === parentId)) {
        throw new Error("Parent folder not found");
      }
      const folder: Folder = {
        id: uid("folder"),
        name: nextName,
        parentId,
        createdAt: new Date().toISOString(),
        projectId,
      };
      db.folders.push(folder);
      logActivity(db, {
        category: "file",
        action: "created a folder",
        target: folder.name,
        projectId,
      });
      return folder;
    }),

  renameFolder: (id: string, name: string) =>
    mutateDb((db) => {
      const folder = db.folders.find((item) => item.id === id);
      if (!folder) throw new Error("Folder not found");
      const nextName = name.trim();
      if (!nextName) throw new Error("Folder name cannot be empty");
      folder.name = nextName;
      return folder;
    }),

  removeFolder: (id: string) =>
    mutateDb((db) => {
      const folder = db.folders.find((item) => item.id === id);
      if (!folder) throw new Error("Folder not found");
      const parentId = folder.parentId;
      // Preserve contents by lifting them into the deleted folder's parent.
      db.folders = db.folders
        .filter((item) => item.id !== id)
        .map((item) => (item.parentId === id ? { ...item, parentId } : item));
      db.files = db.files.map((file) =>
        file.folderId === id ? { ...file, folderId: parentId } : file,
      );
      logActivity(db, {
        category: "file",
        action: "deleted a folder",
        target: folder.name,
        projectId: folder.projectId ?? null,
      });
      return { id };
    }),

  moveFile: (id: string, folderId: string | null) =>
    mutateDb((db) => {
      const file = db.files.find((item) => item.id === id);
      if (!file) throw new Error("File not found");
      if (folderId && !db.folders.some((folder) => folder.id === folderId)) {
        throw new Error("Target folder not found");
      }
      file.folderId = folderId;
      return file;
    }),

  moveFolder: (id: string, parentId: string | null) =>
    mutateDb((db) => {
      const folder = db.folders.find((item) => item.id === id);
      if (!folder) throw new Error("Folder not found");
      if (!canMoveFolder(db.folders, id, parentId)) {
        throw new Error("A folder cannot move into itself or one of its descendants.");
      }
      folder.parentId = parentId;
      return folder;
    }),

  moveFileToProject: (id: string, projectId: string | null) =>
    mutateDb((db) => {
      const file = db.files.find((item) => item.id === id);
      if (!file) throw new Error("File not found");
      if (projectId && !db.projects.some((project) => project.id === projectId)) {
        throw new Error("Project not found");
      }
      file.projectId = projectId;
      logActivity(db, {
        category: "file",
        action: "moved a file to a project",
        target: file.name,
        projectId,
      });
      return file;
    }),

  moveFolderToProject: (id: string, projectId: string | null) =>
    mutateDb((db) => {
      const folder = db.folders.find((item) => item.id === id);
      if (!folder) throw new Error("Folder not found");
      if (projectId && !db.projects.some((project) => project.id === projectId)) {
        throw new Error("Project not found");
      }
      const descendants = folderDescendantIds(db.folders, id);
      db.folders = db.folders.map((item) =>
        item.id === id || descendants.has(item.id) ? { ...item, projectId } : item,
      );
      db.files = db.files.map((file) =>
        file.folderId === id || (file.folderId ? descendants.has(file.folderId) : false)
          ? { ...file, projectId }
          : file,
      );
      logActivity(db, {
        category: "file",
        action: "moved a folder to a project",
        target: folder.name,
        projectId,
      });
      return folder;
    }),
};
