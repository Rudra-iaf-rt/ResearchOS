export type SearchResultType = "project" | "task" | "notebook" | "paper" | "file";

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle: string;
  href: string;
}
