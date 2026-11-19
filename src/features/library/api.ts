import type { Paper, PaperReadStatus } from "@/types";
import { uid } from "@/lib/format";
import { logActivity, mutateDb, readDb } from "@/services/mock/client";

export interface PaperInput {
  title: string;
  authors: string[];
  year: number;
  journal: string;
  doi: string;
  abstract: string;
  tags: string[];
  projectId: string | null;
  notes?: string;
}

export const libraryApi = {
  list: () => readDb((db) => db.papers),

  create: (input: PaperInput) =>
    mutateDb((db) => {
      const paper: Paper = {
        id: uid("paper"),
        ...input,
        readStatus: "unread",
        favorite: false,
        citations: 0,
        addedAt: new Date().toISOString(),
      };
      db.papers.unshift(paper);
      logActivity(db, {
        category: "paper",
        action: "added a paper to the library",
        target: paper.title,
        projectId: paper.projectId,
      });
      return paper;
    }),

  update: (id: string, input: Partial<Paper>) =>
    mutateDb((db) => {
      const paper = db.papers.find((item) => item.id === id);
      if (!paper) throw new Error("Paper not found");
      Object.assign(paper, input);
      return paper;
    }),

  setReadStatus: (id: string, readStatus: PaperReadStatus) =>
    mutateDb((db) => {
      const paper = db.papers.find((item) => item.id === id);
      if (!paper) throw new Error("Paper not found");
      paper.readStatus = readStatus;
      logActivity(db, {
        category: "paper",
        action:
          readStatus === "read"
            ? "finished reading a paper"
            : "started reading a paper",
        target: paper.title,
        projectId: paper.projectId,
      });
      return paper;
    }),

  toggleFavorite: (id: string) =>
    mutateDb((db) => {
      const paper = db.papers.find((item) => item.id === id);
      if (!paper) throw new Error("Paper not found");
      paper.favorite = !paper.favorite;
      return paper;
    }),

  remove: (id: string) =>
    mutateDb((db) => {
      const paper = db.papers.find((item) => item.id === id);
      db.papers = db.papers.filter((item) => item.id !== id);
      if (paper) {
        logActivity(db, {
          category: "paper",
          action: "removed a paper from the library",
          target: paper.title,
          projectId: paper.projectId,
        });
      }
      return { id };
    }),
};
