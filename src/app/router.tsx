import { lazy, Suspense, useEffect } from "react";
import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { AppShell } from "@/components/layout/app-shell";
import { ScreenFallback } from "@/components/shared/route-fallback";
import { LandingPage } from "@/features/auth/pages/landing-page";
import { LoginPage } from "@/features/auth/pages/login-page";
import { RegisterPage } from "@/features/auth/pages/register-page";
import { NotFoundPage } from "./not-found-page";
import { useAuthStore } from "@/store/auth-store";

// Feature screens are split into their own chunks; the shell and the public
// landing/auth pages stay eager so first paint stays snappy.
const ActivityPage = lazy(() =>
  import("@/features/activity/pages/activity-page").then((module) => ({
    default: module.ActivityPage,
  })),
);
const DashboardPage = lazy(() =>
  import("@/features/dashboard/pages/dashboard-page").then((module) => ({
    default: module.DashboardPage,
  })),
);
const FilesPage = lazy(() =>
  import("@/features/files/pages/files-page").then((module) => ({
    default: module.FilesPage,
  })),
);
const ResearchFeedPage = lazy(() =>
  import("@/features/feed/pages/research-feed-page").then((module) => ({
    default: module.ResearchFeedPage,
  })),
);
const ResearchLogPage = lazy(() =>
  import("@/features/research-log/pages/research-log-page").then((module) => ({
    default: module.ResearchLogPage,
  })),
);
const NotificationsPage = lazy(() =>
  import("@/features/notifications/pages/notifications-page").then((module) => ({
    default: module.NotificationsPage,
  })),
);
const LibraryPage = lazy(() =>
  import("@/features/library/pages/library-page").then((module) => ({
    default: module.LibraryPage,
  })),
);
const NotebookEditorPage = lazy(() =>
  import("@/features/notebooks/pages/notebook-editor-page").then((module) => ({
    default: module.NotebookEditorPage,
  })),
);
const NotebooksPage = lazy(() =>
  import("@/features/notebooks/pages/notebooks-page").then((module) => ({
    default: module.NotebooksPage,
  })),
);
const OnboardingPage = lazy(() =>
  import("@/features/onboarding/pages/onboarding-page").then((module) => ({
    default: module.OnboardingPage,
  })),
);
const ProjectDetailPage = lazy(() =>
  import("@/features/projects/pages/project-detail-page").then((module) => ({
    default: module.ProjectDetailPage,
  })),
);
const ProjectsPage = lazy(() =>
  import("@/features/projects/pages/projects-page").then((module) => ({
    default: module.ProjectsPage,
  })),
);
const SettingsPage = lazy(() =>
  import("@/features/settings/pages/settings-page").then((module) => ({
    default: module.SettingsPage,
  })),
);
const TasksPage = lazy(() =>
  import("@/features/tasks/pages/tasks-page").then((module) => ({
    default: module.TasksPage,
  })),
);

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return null;
}

function ProtectedRoute() {
  const location = useLocation();
  const session = useAuthStore((state) => state.session);
  const onboardingComplete = useAuthStore((state) => state.onboardingComplete);

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!onboardingComplete) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}

function OnboardingRoute() {
  const location = useLocation();
  const session = useAuthStore((state) => state.session);
  const onboardingComplete = useAuthStore((state) => state.onboardingComplete);

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (onboardingComplete) {
    return <Navigate to="/app" replace />;
  }

  return <OnboardingPage />;
}

export function AppRouter() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<ScreenFallback />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/onboarding" element={<OnboardingRoute />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/app" element={<AppShell />}>
              <Route index element={<DashboardPage />} />
              <Route path="log" element={<ResearchLogPage />} />
              <Route path="feed" element={<ResearchFeedPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="projects/:projectId" element={<ProjectDetailPage />} />
              <Route path="tasks" element={<TasksPage />} />
              <Route path="notebooks" element={<NotebooksPage />} />
              <Route path="notebooks/:notebookId" element={<NotebookEditorPage />} />
              <Route path="library" element={<LibraryPage />} />
              <Route path="files" element={<FilesPage />} />
              <Route path="activity" element={<ActivityPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </>
  );
}
