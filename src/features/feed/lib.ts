import { format, parseISO, startOfDay, subDays } from "date-fns";
import type {
  ActivityCategory,
  ArtifactType,
  ResearchFeedItem,
} from "@/types";

export interface FeedFilters {
  projectId?: string;
  memberId?: string;
  artifactType?: ArtifactType | "none" | "all";
  category?: ActivityCategory | "all";
  search?: string;
}

const categoryToArtifactType: Record<ActivityCategory, ArtifactType | null> = {
  project: "project",
  task: "task",
  notebook: "notebook",
  paper: "paper",
  file: "file",
  milestone: "milestone",
  research: null,
  experiment: null,
  hypothesis: null,
  decision: null,
  snapshot: null,
};

export function effectiveArtifactType(
  item: ResearchFeedItem,
): ArtifactType | "none" {
  return item.artifact?.type ?? categoryToArtifactType[item.category] ?? "none";
}

export function filterFeedItems(
  items: ResearchFeedItem[],
  filters: FeedFilters,
): ResearchFeedItem[] {
  const query = filters.search?.trim().toLowerCase() ?? "";

  return items.filter((item) => {
    const matchesProject =
      !filters.projectId ||
      filters.projectId === "all" ||
      (filters.projectId === "none"
        ? item.projectId === null
        : item.projectId === filters.projectId);
    const matchesMember =
      !filters.memberId ||
      filters.memberId === "all" ||
      item.actor.id === filters.memberId;
    const matchesArtifact =
      !filters.artifactType ||
      filters.artifactType === "all" ||
      effectiveArtifactType(item) === filters.artifactType;
    const matchesCategory =
      !filters.category ||
      filters.category === "all" ||
      item.category === filters.category;
    const matchesQuery =
      !query ||
      item.target.toLowerCase().includes(query) ||
      item.action.toLowerCase().includes(query) ||
      (item.detail ?? "").toLowerCase().includes(query) ||
      item.actor.name.toLowerCase().includes(query);
    return matchesProject && matchesMember && matchesArtifact && matchesCategory && matchesQuery;
  });
}

export interface FeedGroup {
  key: string;
  label: string;
  items: ResearchFeedItem[];
}

export function groupFeedItems(
  items: ResearchFeedItem[],
  now: Date = new Date(),
): FeedGroup[] {
  const today = startOfDay(now);
  const yesterday = subDays(today, 1);
  const groups = new Map<string, FeedGroup>();

  items.forEach((item) => {
    const day = startOfDay(parseISO(item.createdAt));
    const key = format(day, "yyyy-MM-dd");
    let group = groups.get(key);
    if (!group) {
      let label = format(day, "EEEE, MMM d");
      if (day.getTime() === today.getTime()) label = "Today";
      else if (day.getTime() === yesterday.getTime()) label = "Yesterday";
      group = { key, label, items: [] };
      groups.set(key, group);
    }
    group.items.push(item);
  });

  return [...groups.values()].sort((a, b) => b.key.localeCompare(a.key));
}

export function feedMomentumEntries(items: ResearchFeedItem[]) {
  return items.map((item) => ({
    createdAt: item.createdAt,
    minutes: item.durationMinutes,
  }));
}
