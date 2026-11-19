import type { Person } from "@/types";
import { readDb } from "@/services/mock/client";
import { buildPersonDirectory } from "@/services/mock/directory";

export const workspaceApi = {
  /**
   * Workspace membership directory derived from people referenced by existing
   * records, so pages never import seeded arrays directly.
   */
  members: (): Promise<Person[]> =>
    readDb((db) =>
      [...buildPersonDirectory(db).values()].sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    ),
};
