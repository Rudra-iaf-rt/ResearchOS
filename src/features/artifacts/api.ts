import { readDb } from "@/services/mock/client";
import { scanArtifacts, type ArtifactOption } from "./lib";

export const artifactsApi = {
  list: (): Promise<ArtifactOption[]> => readDb((db) => scanArtifacts(db)),
};
