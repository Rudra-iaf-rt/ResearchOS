import type { SearchResult, SearchResultType } from "@/types/search";
import { readDb } from "@/services/mock/client";

export interface GroupedResults {
  projects: SearchResult[];
  notebooks: SearchResult[];
  papers: SearchResult[];
  files: SearchResult[];
  tasks: SearchResult[];
}

const emptyResults: GroupedResults = {
  projects: [],
  notebooks: [],
  papers: [],
  files: [],
  tasks: [],
};

function includes(value: string, query: string) {
  return value.toLowerCase().includes(query);
}

export const searchApi = {
  search: (query: string): Promise<GroupedResults> =>
    readDb((db) => {
      const q = query.trim().toLowerCase();
      if (!q) return emptyResults;

      const results: GroupedResults = {
        projects: db.projects
          .filter((p) => includes(p.title, q) || includes(p.description, q))
          .slice(0, 4)
          .map((p) => ({
            id: p.id,
            type: "project" as SearchResultType,
            title: p.title,
            subtitle: p.status.replace("-", " "),
            href: `/app/projects/${p.id}`,
          })),
        notebooks: db.notebooks
          .filter((n) => includes(n.title, q) || includes(n.description, q))
          .slice(0, 4)
          .map((n) => ({
            id: n.id,
            type: "notebook" as SearchResultType,
            title: n.title,
            subtitle: `${n.entries.length} entries`,
            href: `/app/notebooks/${n.id}`,
          })),
        papers: db.papers
          .filter(
            (p) =>
              includes(p.title, q) ||
              p.authors.some((author) => includes(author, q)) ||
              includes(p.journal, q),
          )
          .slice(0, 4)
          .map((p) => ({
            id: p.id,
            type: "paper" as SearchResultType,
            title: p.title,
            subtitle: `${p.year} · ${p.journal}`,
            href: `/app/library?paper=${p.id}`,
          })),
        files: db.files
          .filter((f) => includes(f.name, q))
          .slice(0, 4)
          .map((f) => ({
            id: f.id,
            type: "file" as SearchResultType,
            title: f.name,
            subtitle: f.kind,
            href: `/app/files`,
          })),
        tasks: db.tasks
          .filter((t) => includes(t.title, q))
          .slice(0, 4)
          .map((t) => ({
            id: t.id,
            type: "task" as SearchResultType,
            title: t.title,
            subtitle: t.status.replace("-", " "),
            href: `/app/tasks`,
          })),
      };
      return results;
    }),
};
