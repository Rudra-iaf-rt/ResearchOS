import type { Notebook, NotebookEntry, Person } from "@/types";
import { uid } from "@/lib/format";
import { logActivity, mutateDb, readDb } from "@/services/mock/client";

export interface NotebookInput {
  title: string;
  description: string;
  projectId: string | null;
  tags: string[];
}

function personFromUser(user: {
  id: string;
  name: string;
  initials: string;
  role: string;
  avatarColor: string;
}): Person {
  return {
    id: user.id,
    name: user.name,
    initials: user.initials,
    role: user.role,
    color: user.avatarColor,
  };
}

export const notebooksApi = {
  list: () => readDb((db) => db.notebooks),

  get: (id: string) =>
    readDb((db) => {
      const notebook = db.notebooks.find((item) => item.id === id);
      if (!notebook) throw new Error("Notebook not found");
      return notebook;
    }),

  create: (input: NotebookInput) =>
    mutateDb((db) => {
      const now = new Date().toISOString();
      const entry: NotebookEntry = {
        id: uid("entry"),
        title: "Untitled entry",
        content: "",
        createdAt: now,
        updatedAt: now,
        author: personFromUser(db.user),
      };
      const notebook: Notebook = {
        id: uid("nb"),
        title: input.title,
        description: input.description,
        projectId: input.projectId,
        tags: input.tags,
        favorite: false,
        entries: [entry],
        createdAt: now,
        updatedAt: now,
        author: personFromUser(db.user),
      };
      db.notebooks.unshift(notebook);
      logActivity(db, {
        category: "notebook",
        action: "created a notebook",
        target: notebook.title,
        projectId: notebook.projectId,
      });
      return notebook;
    }),

  update: (id: string, input: Partial<NotebookInput & { favorite: boolean }>) =>
    mutateDb((db) => {
      const notebook = db.notebooks.find((item) => item.id === id);
      if (!notebook) throw new Error("Notebook not found");
      Object.assign(notebook, input, { updatedAt: new Date().toISOString() });
      return notebook;
    }),

  saveEntry: (
    notebookId: string,
    entryId: string,
    input: { title?: string; content?: string },
  ) =>
    mutateDb((db) => {
      const notebook = db.notebooks.find((item) => item.id === notebookId);
      if (!notebook) throw new Error("Notebook not found");
      const entry = notebook.entries.find((item) => item.id === entryId);
      if (!entry) throw new Error("Entry not found");
      Object.assign(entry, input, { updatedAt: new Date().toISOString() });
      notebook.updatedAt = new Date().toISOString();
      return notebook;
    }),

  saveDocument: (
    notebookId: string,
    entryId: string,
    input: { title?: string; entryTitle?: string; content?: string },
  ) =>
    mutateDb((db) => {
      const notebook = db.notebooks.find((item) => item.id === notebookId);
      if (!notebook) throw new Error("Notebook not found");
      const entry = notebook.entries.find((item) => item.id === entryId);
      if (!entry) throw new Error("Entry not found");
      const now = new Date().toISOString();
      if (input.title !== undefined) notebook.title = input.title;
      if (input.entryTitle !== undefined) entry.title = input.entryTitle;
      if (input.content !== undefined) entry.content = input.content;
      entry.updatedAt = now;
      notebook.updatedAt = now;
      return notebook;
    }),

  addEntry: (notebookId: string, title = "Untitled entry") =>
    mutateDb((db) => {
      const notebook = db.notebooks.find((item) => item.id === notebookId);
      if (!notebook) throw new Error("Notebook not found");
      const now = new Date().toISOString();
      const entry: NotebookEntry = {
        id: uid("entry"),
        title,
        content: "",
        createdAt: now,
        updatedAt: now,
        author: personFromUser(db.user),
      };
      notebook.entries.push(entry);
      notebook.updatedAt = now;
      logActivity(db, {
        category: "notebook",
        action: "added an entry",
        target: notebook.title,
        detail: title,
        projectId: notebook.projectId,
      });
      return entry;
    }),

  removeEntry: (notebookId: string, entryId: string) =>
    mutateDb((db) => {
      const notebook = db.notebooks.find((item) => item.id === notebookId);
      if (!notebook) throw new Error("Notebook not found");
      notebook.entries = notebook.entries.filter((entry) => entry.id !== entryId);
      notebook.updatedAt = new Date().toISOString();
      return notebook;
    }),

  remove: (id: string) =>
    mutateDb((db) => {
      const notebook = db.notebooks.find((item) => item.id === id);
      db.notebooks = db.notebooks.filter((item) => item.id !== id);
      if (notebook) {
        logActivity(db, {
          category: "notebook",
          action: "deleted a notebook",
          target: notebook.title,
          projectId: notebook.projectId,
        });
      }
      return { id };
    }),
};
