import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Home } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { queryKeys } from "@/lib/query-keys";
import { projectsApi } from "@/features/projects/api";
import { notebooksApi } from "@/features/notebooks/api";

const staticLabels: Record<string, string> = {
  app: "Workspace",
  projects: "Projects",
  tasks: "Tasks & Milestones",
  notebooks: "Notebooks",
  library: "Research Library",
  files: "Files",
  activity: "Activity",
  settings: "Settings",
};

export function Breadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);

  const needsProjects = segments.includes("projects") && segments.length > 2;
  const needsNotebooks = segments.includes("notebooks") && segments.length > 2;

  const { data: projects = [] } = useQuery({
    queryKey: queryKeys.projects,
    queryFn: projectsApi.list,
    enabled: needsProjects,
    staleTime: 60_000,
  });
  const { data: notebooks = [] } = useQuery({
    queryKey: queryKeys.notebooks,
    queryFn: notebooksApi.list,
    enabled: needsNotebooks,
    staleTime: 60_000,
  });

  const crumbs = segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join("/")}`;
    const parent = segments[index - 1];
    let label = staticLabels[segment] ?? segment;

    if (parent === "projects" && index > 0) {
      label = projects.find((project) => project.id === segment)?.title ?? "Project";
    }
    if (parent === "notebooks" && index > 0) {
      label = notebooks.find((notebook) => notebook.id === segment)?.title ?? "Notebook";
    }

    return {
      href,
      label,
      isLast: index === segments.length - 1,
    };
  });

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex items-center gap-1.5 text-[12.5px]">
        <li>
          <Link
            to="/app"
            className="flex items-center rounded-md py-1 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Workspace home"
          >
            <Home className="size-3.5" />
          </Link>
        </li>
        {crumbs.map((crumb) => (
          <li key={crumb.href} className="flex min-w-0 items-center gap-1.5">
            <ChevronRight className="size-3 shrink-0 text-muted-foreground/50" aria-hidden="true" />
            {crumb.isLast ? (
              <span className="truncate font-medium text-foreground" aria-current="page">
                {crumb.label}
              </span>
            ) : (
              <Link
                to={crumb.href}
                className="max-w-[160px] truncate text-muted-foreground transition-colors hover:text-foreground"
              >
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
