import { readDb } from "@/services/mock/client";

export const activityApi = {
  list: () => readDb((db) => db.activity),
};
