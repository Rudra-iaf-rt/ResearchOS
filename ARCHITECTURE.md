# ResearchOS — Architecture

Last updated: **November 25, 2026**

Phase 1 adds a daily research layer on top of the Stage 1 workspace. Phase 2 adds a shared knowledge-graph layer. Phase 3 adds a scientific reasoning layer — experiments, runs, hypotheses/evidence, decisions, snapshots, and version history — without changing the existing architecture or design language. This document describes how the frontend is organized, how data flows, and where future backend/authentication work plugs in.

---

## 1. Stack

| Area | Choice |
| --- | --- |
| UI | React 18, TypeScript, Vite 5 |
| Routing | React Router 6, lazy feature routes inside a protected app shell |
| Server state | TanStack Query 5 |
| Client/UI state | Zustand (persisted UI store, non-persisted sync store) |
| Forms | React Hook Form + Zod |
| Styling | Tailwind CSS with semantic tokens, Radix UI primitives, Lucide icons |
| Charts | Recharts |
| Graph canvas | React Flow (`@xyflow/react`) + dagre layout |
| Graph export | `html-to-image` (`toSvg`) + canvas |
| Text diff | `diff` (`diffLines`, `diffWords`) |
| Tree view | `react-arborist` |
| Feedback | Sonner toasts, skeleton/empty/error states |
| Tests | Vitest + Testing Library (jsdom) |
| Persistence (current) | Versioned localStorage demo database behind a mock provider |

There is no backend and no authentication in Phase 3. The app must not be deployed publicly in this state.

---

## 2. Directory map

```text
src/
├─ app/                     Router, providers, app-level composition
├─ components/
│  ├─ layout/               App shell, header, sidebar, sync indicator
│  ├─ navigation/           Command palette, create dialogs, menus, breadcrumbs
│  ├─ shared/               Cross-feature presentation components
│  └─ ui/                   Low-level Radix/Tailwind primitives
├─ features/
│  ├─ activity/             Workspace activity feed (Stage 1)
│  ├─ artifacts/            Artifact scanning, resolution, links (Phase 1)
│  ├─ auth/                 Local demo auth screens (Stage 1)
│  ├─ dashboard/            Today dashboard API + page
│  ├─ decisions/            ADR-style decision cards, detail, modal, grouping
│  ├─ evidence/             Hypothesis evidence API
│  ├─ experiments/          Experiment list/detail, parameters, notes, schema, modal
│  ├─ feed/                 Research Feed API, helpers, item, day sheet, page
│  ├─ files/                File library
│  ├─ graph/                Knowledge graph: canvas, layouts, DAG/tree/citation pages, outline, file tree
│  ├─ history/              Artifact versions, HistoryDrawer, DiffViewer, restore
│  ├─ hypotheses/           Four-column Kanban, side panel, evidence form, modal
│  ├─ library/              Research papers
│  ├─ milestones/           Project milestones
│  ├─ notebooks/            Notebooks and editor
│  ├─ notifications/        Notification API + inbox
│  ├─ onboarding/           First-run onboarding
│  ├─ projects/             Projects and project detail
│  ├─ research-log/         Log API, schema, helpers, form, item, page
│  ├─ runs/                 Run lifecycle API, rows/list/status strip, Reproduce dialog
│  ├─ search/               Cross-entity search
│  ├─ settings/             Preferences and workspace settings
│  ├─ snapshots/            Snapshot API, manifest, modal, project grouping, export
│  ├─ tasks/                Tasks
│  └─ workspace/            Workspace member directory API
├─ lib/                     Formatting, constants, query keys, momentum math
├─ services/
│  ├─ identity/             Identity contract + development provider + hooks
│  └─ mock/                 Seed data, storage/migration, directory, transport
├─ store/                   Zustand stores (UI and sync)
├─ styles/                  Global CSS and tokens
├─ test/                    Test setup
└─ types/                   Domain types and API shapes
```

### Feature module convention

Each feature keeps its data access and presentation separate:

```text
features/<name>/
├─ api.ts        Promise-based service used by hooks
├─ lib.ts        Pure derivation/filtering helpers
├─ schema.ts     Zod form schema (when the feature has forms)
├─ components/   Feature-specific UI
└─ pages/        Route-level screens
```

Pages never import seed arrays. They call feature APIs through TanStack Query and render derived data.

The `graph` feature additionally keeps pure, testable logic under `lib/`:

| Module | Responsibility |
| --- | --- |
| `validation.ts` | Duplicate/dangling/self-link detection, visible-edge pruning, related-node sets |
| `layouts.ts` | dagre LR/TB, radial rings, manual coordinates/grid |
| `filters.ts` | Node-type/status/run filters and citation filters |
| `citation.ts` | Undirected radius BFS, year/tag facets |
| `outline.ts` | TipTap heading extraction, nesting, section moves, scroll |
| `task-tree.ts` | Project → milestone → task → subtask tree and re-parent validation |
| `file-tree.ts` | Folder/file tree, roll-ups, move validation, breadcrumbs |
| `stress.ts` | Deterministic 200-node layout fixture |

---

## 3. Layering and dependency rules

```text
Page / Component
      │  TanStack Query
      ▼
Feature API  ──────────────┐
      │                    │
      ▼                    ▼
Mock transport        Identity provider
(readDb/mutateDb)     (actor + permissions)
      │
      ▼
Storage + migration (localStorage)
```

Rules:

1. **Pages do not read storage.** All persistence goes through a feature `api.ts`.
2. **Feature APIs do not render.** They return plain data or throw typed/meaningful errors.
3. **Mock transport is the only storage boundary.** Replacing it with HTTP clients is a per-feature change, not a page rewrite.
4. **Identity is injected.** No feature hardcodes `user_maya` or `ws_northlight`; the provider supplies actor and workspace IDs.
5. **Derived values live in `lib.ts`.** Filtering, grouping, durations, and summaries are pure functions and unit-tested.
6. **Shared visual language wins.** New screens compose `PageHeader`, `SectionCard`, `StatCard`, `EmptyState`, `SearchInput`, and existing primitives.

---

## 4. Routing

Public routes stay eager; app routes are lazy chunks inside `ProtectedRoute` → `AppShell`.

| Path | Screen |
| --- | --- |
| `/` | Landing |
| `/login`, `/register` | Local demo auth |
| `/onboarding` | First-run flow |
| `/app` | Today dashboard |
| `/app/log` | Research Log |
| `/app/feed` | Research Feed |
| `/app/notifications` | Notifications inbox (`?tab=`) |
| `/app/projects`, `/app/projects/:projectId` | Projects |
| `/app/projects/:projectId/graph` | Project hypothesis → experiment → run DAG |
| `/app/projects/:projectId/tree` | Project milestone/task tree |
| `/app/knowledge` | Workspace knowledge graph (`?focus=`) |
| `/app/experiments`, `/app/experiments/:experimentId` | Experiments and detail tabs (`?tab=`) |
| `/app/hypotheses` | Hypothesis Kanban and evidence side panel |
| `/app/decisions` | Decision records (`?focus=`) |
| `/app/snapshots` | Frozen project manifests |
| `/app/tasks` | Tasks and milestones |
| `/app/notebooks`, `/app/notebooks/:notebookId` | Notebooks (editor includes the outline rail) |
| `/app/library` | Research Library (`?paper=`, `?tab=graph`) |
| `/app/files` | Files |
| `/app/activity` | Workspace activity |
| `/app/settings` | Settings |

`ProtectedRoute` currently checks the local demo session. Phase 9 will replace its source with the identity provider while keeping the same route tree.

---

## 5. Identity and permissions

### Contract

```ts
interface IdentityProvider {
  readonly kind: "development" | "clerk";
  getIdentity(): Promise<Identity>;
}

interface Identity {
  user: IdentityUser;
  workspace: IdentityWorkspace;
  role: WorkspaceRole;
  permissions: Permission[];
  provider: "development" | "clerk";
}
```

`src/services/identity/index.ts` selects the implementation:

```ts
export const identityProvider: IdentityProvider = new DevelopmentIdentityProvider();
```

The development provider reads the demo profile and workspace from the mock database, assigns the `owner` role, and derives permissions. Phase 9 replaces this single line with a Clerk-backed provider.

### Roles

| Role | Capabilities (summary) |
| --- | --- |
| `owner` | Full access, including member/workspace/integration management and export |
| `admin` | Same operational access as owner |
| `editor` | Artifact read/write/delete, log write, review submit, export |
| `commenter` | Artifact read, log write, review submit |
| `viewer` | Artifact read only |

Permissions are checked in APIs with `can`/`assertPermission`, not only in the UI. Research log mutations require `log:write`; edits/deletes additionally require ownership or `workspace:manage`.

### Actor stamping

`getCurrentActor()` returns `{ userId, workspaceId, name, initials }`. New records store both IDs. Activity events written by log mutations also use the identity's actor, so multi-user records remain distinguishable.

---

## 6. Domain model additions

Phase 1 adds:

```ts
type ResearchMode = "reading" | "writing" | "experiment" | "analysis" | "review" | "admin";
type ArtifactType = "project" | "task" | "notebook" | "paper" | "file" | "milestone";

interface ArtifactRef { type: ArtifactType; id: string; label: string }

interface ResearchLogEntry {
  id: string;
  workspaceId: string;
  actorId: string;
  projectId: string | null;
  mode: ResearchMode;
  title: string;
  notes?: string;
  durationMinutes: number;
  artifact: ArtifactRef | null;
  occurredAt: string;   // when the work happened
  createdAt: string;
  updatedAt: string;
}

interface ResearchFeedItem {
  id: string;
  source: "activity" | "research-log";
  category: ActivityCategory;
  action: string;
  target: string;
  detail?: string;
  actor: Person;
  projectId: string | null;
  artifact: ArtifactRef | null;
  mode?: ResearchMode;
  durationMinutes?: number;
  createdAt: string;
}
```

`ActivityCategory` gains `research`. `NotificationKind` gains `review`. `ActivityEvent` gains optional `workspaceId`, `mode`, `artifact`, and `researchLogId`.

Phase 2 adds:

```ts
type GraphNodeType =
  | "project" | "experiment" | "run" | "hypothesis"
  | "paper" | "notebook" | "dataset" | "decision";

type GraphEdgeType =
  | "depends" | "derived_from" | "cites"
  | "tests" | "links" | "branches";

interface GraphNode {
  id: string;
  type: GraphNodeType;
  label: string;
  status?: string;
  parentId?: string;
  metadata?: {
    kind?: string;              // e.g. "conclusion"
    description?: string;
    artifactType?: ArtifactType;
    artifactId?: string;
    href?: string;
    projectId?: string | null;
    tags?: string[];
    metrics?: Array<{ label: string; value: string }>;
    position?: { x: number; y: number };
    inLibrary?: boolean;        // false for external mock citations
    year?: number;
    action?: "open-experiment" | "open-run-logs" | "open-artifact";
    [key: string]: unknown;
  };
}

interface GraphEdge { id: string; from: string; to: string; type: GraphEdgeType }

interface CitationLink { id: string; from: string; to: string }
```

`Task` gains optional `milestoneId` and `parentTaskId` (one subtask level). `Folder` gains optional `projectId`, so folders and their descendants can be moved to a project.

Phase 3 adds:

```ts
type ExperimentStatus = "draft" | "queued" | "running" | "succeeded" | "failed";
type RunStatus = "queued" | "running" | "succeeded" | "failed";
type HypothesisStatus = "proposed" | "testing" | "supported" | "refuted";
type EvidenceStance = "supports" | "contradicts" | "neutral";
type DecisionStatus = "proposed" | "accepted" | "superseded";
type SnapshotArtifactType = "notebook" | "experiment" | "dataset" | "file" | "decision";
type VersionArtifactType = "notebook" | "experiment" | "project" | "document";

interface Experiment {
  id: string; workspaceId: string; projectId: string;
  hypothesisId: string | null; title: string; description: string;
  status: ExperimentStatus; parameters: ParameterEntry[];
  notes: string; artifactRefs: ArtifactRef[]; owner: Person;
  createdBy: string; createdAt: string; updatedAt: string;
}

interface ExperimentRun {
  id: string; workspaceId: string; experimentId: string; projectId: string;
  runNumber: number; label: string; status: RunStatus;
  parameters: ParameterEntry[];        // frozen at creation
  logs: string; artifactRefs: ArtifactRef[];
  startedAt: string | null; endedAt: string | null; durationSeconds: number | null;
  createdBy: string; createdAt: string; updatedAt: string;
}

interface Hypothesis {
  id: string; workspaceId: string; projectId: string;
  researchQuestion: string; statement: string; status: HypothesisStatus;
  owner: Person; createdBy: string; createdAt: string; updatedAt: string;
}

interface HypothesisEvidence {
  id: string; workspaceId: string; hypothesisId: string; stance: EvidenceStance;
  description: string; artifact: ArtifactRef | null;
  createdBy: string; createdAt: string; updatedAt: string;
}

interface ResearchDecision {
  id: string; workspaceId: string; projectId: string;
  title: string; context: string; decision: string;
  alternatives: DecisionAlternative[]; artifacts: ResearchArtifactRef[];
  status: DecisionStatus; owner: Person;
  createdBy: string; createdAt: string; updatedAt: string;
}

interface ResearchSnapshot {
  id: string; workspaceId: string; projectId: string;
  label: string; description: string;
  manifest: SnapshotManifestEntry[];    // immutable after creation
  doi: string | null; createdBy: string; createdAt: string;
}

interface ArtifactVersion {
  id: string; workspaceId: string;
  artifactType: VersionArtifactType; artifactId: string;
  versionNumber: number; label: string; summary: string;
  content: string;                      // plain text for diffs
  data: VersionSnapshotData;            // structured, lossless restore
  author: Person; createdAt: string;
}
```

`ParameterEntry` is `{ id, key, value }`. `ResearchArtifactType` extends `ArtifactType` with `experiment`, `hypothesis`, and `decision`, so decisions can link reasoning records without inventing a second link model.

### Artifact node ID convention

| Source | Node ID |
| --- | --- |
| Project | `project:<projectId>` |
| Paper | `paper:<paperId>` |
| Notebook | `notebook:<notebookId>` |
| Dataset (file) | `dataset:<fileId>` |

Graph-only seeded records use plain IDs. The convention lets materialized artifact nodes and seeded relationships share one ID space.

---

## 7. Data flow

### Reading a page

```text
Route mounts
  → useQuery(queryKeys.<collection>, api.method)
      → readDb(selector)
          → loadDatabase() (seed, parse, migrate if needed)
          → selector returns a view model
  → page renders loading / empty / error / content
```

Mock latency is 90 ms in development and 0 ms in tests, so loading states are exercised without slowing the suite.

### Creating a research log entry

```text
Quick Capture / Log form
  → Zod validation
  → researchLogApi.create(input)
      → identityProvider.getIdentity()
      → assertPermission("log:write")
      → mutateDb:
          - resolve project + artifact against database truth
          - append ResearchLogEntry (actor/workspace stamped)
          - logActivity(category: "research", researchLogId, mode, artifact)
          - persist database
  → invalidate researchLog, feed, dashboard, activity
  → toast + refreshed views
```

### Feed aggregation

```text
db.activity (skip events with researchLogId)
        +
db.researchLog
        ↓
normalize to ResearchFeedItem
        ↓
sort by createdAt descending
```

The feed therefore shows each logged work item once, while still including Stage 1 activity such as tasks, notebooks, papers, milestones, and files.

### Momentum and streaks

`src/lib/momentum.ts`:

- `buildMomentumDays(entries, { weeks, now })` buckets entries by local day and returns a continuous grid ending today.
- `computeStreak(days, now)` counts consecutive active days, tolerating an empty current day.
- `buildCalendarWeeks(days)` shapes the grid for the heatmap.
- `momentumIntensity(count)` maps activity to four intensity levels.
- `totalMinutes` / `activeDays` support summary cards.

Dashboard and Research Feed use the same helpers, so streak values agree.

### Graph materialization and views

```text
db.projects/papers/notebooks/files → artifact nodes
db.graphNodes/graphEdges           → seeded relationships
                    ↓
             materialize(db)
                    ↓
   validate + prune invalid edges
                    ↓
  project / knowledge / citation view
                    ↓
        GraphCanvas → computeLayout → React Flow
```

- **Project DAG** includes the project, its nodes, and one hop of linked paper artifacts.
- **Knowledge graph** includes only nodes touched by `links` edges plus their owning project nodes; node types outside project/notebook/paper/dataset/hypothesis/decision are excluded.
- **Citation graph** builds a paper-only universe from `citations` edges and seeded citation edges, then applies an undirected radius-1/2 BFS and local filters.

`GraphCanvas` memoizes layout and flow data. Positions change only when `nodes`, `edges`, or `layout` change; focus changes only alter card/edge props.

### Focus URL state

```text
?focus=<nodeId>
  → useGraphFocus(nodeIds)
      → valid id   → selected node + related-node dimming
      → invalid id → replace history without the parameter
  → user selects a different node → push history
  → user closes details / clears focus → remove parameter
  → browser back/forward → selection restored from history
```

All three graph views use the same hook, so focus is shareable and survives reloads.

### Project tree mutations

`buildProjectTaskTree` composes project → unassigned/milestone groups → tasks → subtasks and tolerates cycles. Inline rename calls `tasksApi.rename`; drag re-parent calls `tasksApi.reparent`, which validates self, descendants, cross-project targets, and a second subtask level before writing. A rejected move leaves the stored task unchanged.

### File tree mutations

`buildFileTree` rolls file sizes/counts up through descendants and keeps orphans visible. Drag/drop calls `filesApi.moveFile` or `moveFolder`; `canMoveFolder` rejects self/descendant targets both in the UI and in the API. Context-menu actions rename, move-to-project (folder descendants included), or delete a folder while lifting its contents into the parent.

### Notebook outline

The editor exposes its live TipTap instance through `onEditorReady`. `NotebookOutline` re-extracts headings from the serialized document on change, renders a nested collapsible tree, scrolls to headings in the live editor, and reorders sections by rewriting only the moved section’s HTML span. Autosave then persists the document, so formatting and non-heading content are preserved.

### Reasoning mutations

```text
ExperimentModal / Run controls / Kanban / EvidenceForm / DecisionModal / SnapshotModal
  → Zod validation (where a form exists)
  → feature API mutation
      → mutateDb:
          - validate links against database truth
          - write the reasoning record (actor/workspace/timestamps)
          - logActivity(category: experiment | hypothesis | decision | snapshot)
          - pushNotification(...) where the event is user-visible
          - persist database
  → invalidate the affected query keys
  → toast + refreshed list/detail
```

Status transitions are guarded in the API, not only in the UI:

- Experiments: `draft → queued → running → succeeded/failed`.
- Runs: `queued → running → succeeded/failed`.
- Hypotheses: any column move, with Supported/Refuted requiring an explicit confirmation dialog.
- Decisions: proposed/accepted/superseded.
- Snapshots: create/delete only; manifest entries are never updated.

### Version history and restore

```text
Artifact edit (notebook autosave, experiment save, project edit)
  → recordArtifactVersion(db, type, id)
      → artifactSnapshot() builds { content, data }
      → skip if content + data are unchanged
      → append ArtifactVersion (next version number)
  → persist
```

`HistoryDrawer` lists versions oldest first, marks the highest version Current, caps selection at two, enables Compare only at two, and enables Restore only at one historical version. Restore applies the stored `data` to the live record, then appends a **new** version labelled `Restored <source>`; it never deletes or rewrites prior versions. `DiffViewer` compares `content` as text, Markdown-as-text, or parsed pipe-delimited table rows. `document` is accepted by the contract but has no editor, so restore is implemented only for notebooks, experiments, and projects.

### Snapshot creation and export

```text
SnapshotModal
  → snapshotsApi.candidates(projectId)
      → notebooks, experiments, datasets, files, decisions for the project
  → user selects candidates + label/description/optional DOI
  → snapshotsApi.create
      → writes SnapshotManifestEntry[] once (title, type, revision ref, selectedAt)
      → logActivity + pushNotification
  → snapshotsApi.manifestExport(snapshot)
      → real application/json download
```

Snapshot detail views read the stored manifest; they do not re-query source artifacts. DOI is never generated or registered.

### Reasoning graph materialization

`graphApi.project` and `graphApi.knowledge` add nodes for stored experiments, runs, hypotheses, and decisions, then connect them using existing edge types and the existing ID space. The DAG therefore reflects the same records the reasoning pages edit, while `GraphCanvas`, layouts, filters, and `?focus=` remain unchanged. Node detail actions navigate to the real experiment/run/hypothesis/decision destination instead of placeholder toasts.

---

## 8. Persistence and migration

| Item | Value |
| --- | --- |
| Storage key | `researchos.demo.db.v1` (kept for compatibility) |
| Current version | `4` |
| Session key | `researchos.session.v1` |
| UI state key | `researchos.ui.v1` |

`loadDatabase()`:

1. If storage is unavailable, return an in-memory seed.
2. If no record exists, seed and persist version 4.
3. If the stored version is not a number or is newer than the app, reseed.
4. If version 1, add `researchLog` (seed entries) and review notifications if absent, then set version 2.
5. If version 2, add `graphNodes`, `graphEdges`, and `citations` if absent, then set version 3.
6. If version 3, add `experiments`, `experimentRuns`, `hypotheses`, `evidence`, `decisions`, `snapshots`, and `versions` if absent, then set version 4.
7. Otherwise return parsed data.

`mutateDb()` always loads, applies the updater, and saves. A full localStorage quota is swallowed so the in-memory session continues; the next successful mutation persists again.

`resetDatabase()` reseeds and saves, used by settings and tests.

---

## 9. State management

| Store | Persisted | Contents |
| --- | --- | --- |
| `auth-store` | Yes | Demo session and onboarding flag |
| `ui-store` | Yes | Theme, sidebar, mobile nav, command palette, recent artifacts (max 10) |
| `sync-store` | No | Sync status and last-synced timestamp (simulation only) |
| TanStack Query | Memory | Server/demo data, invalidation, loading/error states |

Recent artifacts are recorded when a project detail, notebook editor, or library paper is opened. They power Today's "Continue working" with a fallback to recent notebooks/papers.

Graph focus is **URL state**, not a Zustand store: `useGraphFocus` reads/writes `?focus=` so selections are shareable and survive reloads. Graph filters and layout are component state scoped to each view. Decision focus uses the same `?focus=` convention. History selection, diff mode, and open/closed drawer state are local component state so they reset when the drawer closes.

---

## 10. UI composition

- **App shell:** fixed sidebar (desktop), sheet navigation (mobile), sticky header, route transition.
- **Header:** breadcrumbs, workspace search trigger, sync indicator, Create menu, notifications, help, account.
- **Navigation:** sidebar groups workspace/manage items; command palette includes navigation and quick actions; Create menu includes "Log research activity · C".
- **Quick Capture:** the `C` key opens the shared `"log"` create dialog unless the user is typing, using a modifier, or a dialog is already open.
- **Notifications:** header popover and inbox share `notificationKindMeta`; review items use a rose tone.
- **Charts:** Recharts, sized inside fixed-height containers, using token-derived colors.
- **Graph canvas:** shared `GraphCanvas` with custom node cards, arrow markers per edge type, dashed `cites`/`derived_from`/`links`, hover-only edge labels, legend, filter slot, minimap, zoom/fit, and a layout selector. Unrelated nodes dim to roughly 40% when a focus node is active.
- **Graph details:** `NodeDetailPanel` is shared by every graph view and closes on Escape.
- **Project tree:** `react-arborist` rows with expand/collapse, inline rename, drag re-parent, status pills, and a details panel.
- **Notebook outline:** right-rail, collapsible, nested heading tree with drag reorder; hidden below `lg`.
- **File tree:** left-rail folder/file tree with drag/drop, context menus, size roll-ups, and project linking.
- **Citation graph:** a Library tab with seed selector, radius, year range, library-only and topic filters, and the existing paper sheet as the detail destination.
- **Experiments:** table/grid toggle, combined filters, status badges, parameter editor, detail tabs, and history/snapshot actions.
- **Runs:** expandable rows with frozen parameters, logs, artifacts, timestamps, allowed transitions, and an explicitly mock Reproduce dialog.
- **Hypotheses:** four-column Kanban with drag/menu movement, counts, evidence side panel, and a final-promotion confirmation dialog.
- **Decisions:** project-grouped ADR cards, detail drawer, dynamic alternatives, and project-scoped artifact suggestions.
- **Snapshots:** project-grouped manifest tables, create modal with live selection, JSON export, and delete confirmation.
- **History/diff:** shared `HistoryDrawer` and `DiffViewer` reused by notebook, experiment, and project pages.
- **Empty/loading/error:** skeleton placeholders and contextual `EmptyState` actions; no dead-end screens.

Design tokens and existing shared components are reused; Phase 3 introduces no parallel design system. Table wrappers that contain `sr-only` labels use `relative` so absolutely positioned screen-reader text cannot escape a horizontal scroll container and create page-level overflow.

### Accessibility

- Graph nodes are keyboard-reachable `role="button"` elements with labels combining node label, type, status, and owner.
- Enter/Space selects a node; Tab reaches nodes and canvas controls.
- Focus rings are visible and do not rely on color alone; type is communicated with an icon and text label.
- Escape closes the node details, snapshot dialog, rename dialog, and filter popover; each restores focus to its trigger.
- Legends label edge direction and dashed meaning in text, not just color.
- Reasoning dialogs use labelled inputs, focus trapping, Escape close, and `aria-live` status text for Kanban movement and history selection.
- History rows are checkboxes with explicit labels; Compare/Restore are disabled until their selection rules are met.
- Diff tables have captions and screen-reader labels; changes are communicated with text markers as well as colour.

---

## 11. Security and boundaries (current)

- The demo session is client-side and is not authentication.
- Identity permissions are enforced in APIs, but a malicious client could edit localStorage directly; this is acceptable only for the local prototype.
- No secrets, credentials, or network calls exist in Phase 3.
- The sync indicator is a visual simulator and must not be presented as real durability.
- Citation edges and external paper nodes are mock fixtures. The UI states they are not externally verified, and they must not be cited as real bibliographic data.

---

## 12. Extension plan

### Phase 9 authentication

1. Implement `ClerkIdentityProvider` against the existing `IdentityProvider` interface.
2. Swap the singleton in `src/services/identity/index.ts`.
3. Source `ProtectedRoute` from the provider instead of the demo auth store.
4. Enforce the same permissions server-side.

### FastAPI backend

1. Replace `readDb`/`mutateDb` calls in each feature `api.ts` with an HTTP client.
2. Keep return shapes identical so pages and tests do not change.
3. Move workspace filtering and permission checks to the server.
4. Add pagination to feed and activity queries.
5. Replace the sync store with real mutation/queue state.

### Feature growth

- Add graph authoring: create/edit nodes and edges, link artifacts from notebooks/papers, and persist positions.
- Add real run execution/reproduction behind the backend boundary; the current Reproduce dialog intentionally does not execute.
- Add binary snapshot archives and document-version restore when storage/document editors exist.
- Add verified citation import (DOI/Crossref/OpenAlex) and real provenance.
- Notification generation is already wired for Phase 3 domain mutations; extend it to task/project events.
- Add review submission/approval transitions.
- Add saved feed filters and deeper search.
- Add server-backed "recently viewed" history if cross-device continuity is required.
