# ResearchOS — Development Log

Newest entries first. This log records scope, decisions, problems, and verification for each implementation phase.

---

## November 24–25, 2026 — Phase 3 completion and verification

### Scope completed

- Added the Scientific Reasoning Engine domain and persistence:
  - `Experiment`, `ExperimentRun`, `Hypothesis`, `HypothesisEvidence`, `ResearchDecision`, `ResearchSnapshot`, `ArtifactVersion`, and their status/union types
  - Mock database **version 4** with `experiments`, `experimentRuns`, `hypotheses`, `evidence`, `decisions`, `snapshots`, and `versions`
  - Additive v3 → v4 migration that preserves every Stage 1/Phase 1/Phase 2 record
- Built Experiments at `/app/experiments` and `/app/experiments/:id`: search/filter/sort, table + grid, create/edit modal with key/value parameters, detail tabs, status transitions, notes, artifacts, history, and snapshots.
- Built the run workflow: queued → running → succeeded/failed, immutable parameter snapshots, timestamps/duration, logs, artifacts, expandable rows, and an explicitly mock Reproduce dialog.
- Built Hypotheses at `/app/hypotheses`: four-column Kanban with drag/menu movement, evidence side panel, supports/contradicts/neutral counts, linked experiments, and confirmation before final promotion.
- Built Decisions at `/app/decisions`: ADR-style cards grouped by project, dynamic alternatives, project-scoped artifact links, `?focus=` detail drawer, status controls, and edit modal.
- Built Snapshots at `/app/snapshots`: project grouping, candidate manifest, immutable manifest entries, detail table, real JSON export, optional DOI honesty, and delete confirmation.
- Built the shared `HistoryDrawer` and `DiffViewer`; wired notebook, experiment, and project history with compare and restore.
- Integrated reasoning events into activity, feed, and notifications; materialized reasoning nodes/edges into the existing Project DAG and Knowledge Graph; replaced Phase 3 graph placeholder actions with real navigation.
- Added the four command-palette quick actions and the sidebar entries (Workspace: Experiments, Hypotheses, Decisions; Insights: Snapshots).
- Added `src/features/reasoning.test.ts` (7 tests) and updated storage tests for version 4 and the v3 → v4 migration.

### Decisions

1. **Extend the database; never replace it.**
   Phase 3 is a v4 migration on top of the existing graph database. Seed reasoning records reuse existing graph IDs (`exp_*`, `run_*`, `hyp_*`, `dec_*`) so Phase 2 views remain coherent.

2. **Runs freeze parameters at creation.**
   `runsApi.create` clones the experiment parameter array. Editing the experiment later does not alter historical runs, which is the auditability requirement.

3. **Reproduction is deliberately mock.**
   The Reproduce dialog states that no computation, worker, or run is created. Real execution belongs behind the future backend, not a misleading UI claim.

4. **Snapshots are immutable metadata manifests.**
   Manifest entries are written once at creation. Detail views read the stored entries rather than live artifacts, so later edits cannot rewrite history. Export is a real JSON document, not a fake download.

5. **DOI is only shown when real.**
   The optional DOI field is stored as supplied; the UI says “Not assigned” otherwise and never invents a DOI.

6. **History uses content + structured data.**
   `ArtifactVersion.content` is plain text for diffs; `data` is a structured snapshot for lossless restore. Notebook autosave dedupes identical content, and restore always appends a new version.

7. **One history drawer for every artifact.**
   `HistoryDrawer` owns selection limits, the Current badge, Compare/Restore gating, and restore confirmation. Notebook, experiment, and project pages only supply the artifact identity.

8. **Markdown diffs are text diffs.**
   Markdown mode compares the plain-text rendering; table mode parses pipe-delimited rows and highlights added/removed/changed cells.

9. **Reasoning records become graph nodes, not a second graph.**
   `graphApi` materializes experiments, runs, hypotheses, and decisions from stored records and links them with existing edge types. `GraphCanvas` was not rewritten, and no relationship is invented without a stored reference.

10. **Notifications and activity are additive.**
    `pushNotification` and `logActivity` are shared helpers. Creates, run finishes, evidence, promotions, snapshots, and restores all flow into the existing Phase 1 surfaces.

11. **Table wrappers need positioning for `sr-only`.**
    Screen-reader-only labels are absolutely positioned. Inside a horizontally scrollable table, an unpositioned wrapper let those labels escape the scroll clip and created document-level horizontal overflow on mobile. Adding `relative` to each table wrapper fixed Experiments, Snapshots, run details, manifests, and diffs.

### Problems and resolutions

| Problem | Resolution |
| --- | --- |
| Seed experiment history existed for only two experiments | Documented the selective seed and verified history/compare on `exp_cortical_cohort_a`; other experiments gain versions when edited or restored |
| Browser session/localStorage reset during verification | Re-opened the demo workspace and repeated the affected checks; all mutations then survived reloads |
| Feed showed 0 events immediately after the environment reset | React Query had cached the pre-reset empty result; a reload rendered 45 events, including Phase 3 activity. Not a Phase 3 data bug |
| Mobile horizontal overflow on Experiments and Snapshots | `sr-only` table labels escaped the scroll container because the wrapper was static; added `relative` to table wrappers |
| Radix menus/dialogs did not open with a plain `.click()` in automation | Dispatched real pointer events and used the active element for Escape keydown |
| Hypothesis drag initially did not persist in automation | Dispatched `dragstart` and `dragover`/`drop` in separate evaluate calls; persistence then verified in storage |
| Graph node click did not select with a bare click | Clicked the inner `role="button"` node card; `?focus=` and the detail panel then behaved correctly |

### Verification

- `npm run typecheck` — pass.
- `npm run lint` — pass.
- `npm test` — **88 tests across 13 files**, all passing (7 in `reasoning.test.ts`, 5 storage tests).
- `npm run build` — pass; **3,622 modules transformed**; only pre-existing chunk-size/circular-chunk warnings.
- Browser smoke test on November 24–25, 2026:
  - **Experiments:** 8 seed rows; search/filter/sort; modal validation and creation; detail tabs; 2 seed runs; run transition controls and allowed-next copy; expandable run details; mock Reproduce dialog; history versions/Current/diff (+1/−1) across text/Markdown/Table modes.
  - **Hypotheses:** four columns; real drag persistence (`testing` stored, columns 0/4/5/0); side panel; evidence form added a supporting entry and incremented counts; final promotion opened the confirmation alert.
  - **Decisions:** 4 cards across project groups; `?focus=dec_ica_components` detail; dynamic alternatives and project-scoped artifact suggestions in the edit modal.
  - **Snapshots:** 3 seeded snapshots grouped by project; detail manifest table; real `application/json` export; created a 10-entry snapshot; delete confirmation removed it without touching source records.
  - **History:** notebook v1/v2 → restore created v3 and kept v1/v2; project v1/v2 with Current; experiment v1/v2 compare with +1/−1.
  - **Command palette:** New experiment, New hypothesis, New decision, and Create snapshot all opened their real dialogs.
  - **Integration:** activity gained hypothesis/evidence/snapshot/restore events; notifications gained “Evidence recorded”, “Hypothesis supported”, and “Version restored”; feed showed 45 events after reload; Project DAG rendered 25 nodes including reasoning nodes and navigated to the experiment.
  - **Phase 1/2 regression:** Dashboard, Projects, Project detail, Tasks, Notebooks, Notebook editor, Library, Files, Feed, Activity, Notifications, Knowledge Graph, Project DAG, Project Tree, Research Log, and Settings loaded with no console errors.
  - **Responsive:** 390, 768, and 1280 px via same-origin iframes; zero horizontal overflow on Experiments, Experiment detail, Hypotheses, Decisions, and Snapshots after the wrapper fix.
  - **Accessibility:** Lighthouse 0.95–0.96 on the four new list pages; remaining findings are shared muted-text/avatar contrast and global search/profile accessible-name mismatch.

### Follow-ups

- Phase 4 is intentionally not started.
- Document version restore, binary snapshot archives, and real run execution remain deferred (see `IMPLEMENTATION_STATUS.md`).
- Backend, authentication, realtime, workspace-scoped queries, and real sync remain deferred.

---

## November 23, 2026 — Phase 2 completion and verification

### Scope completed

- Added the shared research-knowledge graph layer:
  - `GraphNode`/`GraphEdge` domain types, validation, layout, filter, outline, task-tree, and file-tree helpers
  - `GraphCanvas` with custom node cards, directional/dashed edges, hover labels, filters/legend/toolbar/empty slots, zoom/fit, minimap, layout selector, and keyboard-accessible nodes
  - Shared `NodeDetailPanel`, graph filters, and `?focus=` URL state
- Built the Project DAG at `/app/projects/:id/graph`, including type/status filters, show/hide runs, experiment/run placeholders, snapshot placeholder, reset/fit, and real PNG export.
- Built the Project Tree at `/app/projects/:id/tree` with expand/collapse, inline rename, drag re-parent, status pills, due dates, and a details panel.
- Added `NotebookOutline` to the Notebook Editor right rail and `FileTree` to the File Manager left rail.
- Added the Library Citation Graph tab and the cross-artifact Knowledge Graph at `/app/knowledge`.
- Extended the mock database to **version 3** with `graphNodes`, `graphEdges`, and `citations`, plus a v2 → v3 migration that preserves all existing records.
- Added graph APIs, query keys, realistic connected seeds, and 28 graph-focused automated tests (80 total).

### Decisions

1. **One canvas, many graph views.**
   `GraphCanvas` owns layout computation, node/edge rendering, focus dimming, zoom/fit, minimap, and layout selection. Project DAG, Knowledge Graph, and Citation Graph supply data and slots rather than reimplementing the canvas.

2. **Layouts stay pure and deterministic.**
   `computeLayout` uses dagre for layered layouts and deterministic rings/grids for radial/manual. Layout, related IDs, and flow nodes/edges are memoized so only structural changes recalculate positions.

3. **Focus lives in the URL.**
   `useGraphFocus` validates `?focus=` against the current node IDs, pushes history for user selections, replaces history only to clean invalid IDs, and removes the parameter when focus is cleared. All graph views share it.

4. **Graph reads derive from database truth.**
   `graphApi` materializes artifact nodes from projects, papers, notebooks, and files, adds seeded graph nodes/edges, validates edges, and filters per view. Invalid references are dropped rather than rendered as broken connections.

5. **Decisions are a first-class node type.**
   The required node list was retained and extended with `decision`, represented in the seeded knowledge graph and type filters.

6. **External citation nodes are explicitly mock.**
   A small set of reference-only paper nodes (`inLibrary: false`) makes the library/year filters meaningful and are labelled “Reference only · not verified” in the detail panel.

7. **Manual layout is read-only.**
   Stored `metadata.position` coordinates and a deterministic grid are honoured, but dragging a node does not rewrite the seed. Graph editing is deferred.

8. **PNG export avoids animation frames.**
   `html-to-image`'s `toPng` waits on `requestAnimationFrame`, which is paused in the occluded automated window. Export now uses `toSvg` plus a manual canvas draw, producing a real PNG without that dependency.

9. **Tree and file mutations validate before writing.**
   `tasksApi.reparent` rejects self/descendant/cross-project/second-level parents before mutation; `filesApi.moveFolder` rejects self/descendant targets before mutation. Failed operations leave the stored record untouched.

10. **Outline reorder operates on serialized sections.**
    `moveOutlineSection` moves a heading and its full section in the document HTML, so formatting is preserved and autosave persists the reorder. Invalid “inside itself” moves are no-ops.

11. **Empty filters show intent, not a lone seed.**
    The citation filter keeps the seed visible by design. When filters reduce the neighbourhood to only the seed, the tab renders the empty-filter state instead of a disconnected card.

### Problems and resolutions

| Problem | Resolution |
| --- | --- |
| PNG export hung in the automated window | Replaced `toPng` with `toSvg` + manual canvas draw |
| Selecting nodes created duplicate `?focus=` history entries | Only push when the resolved focus actually changes; use replace for invalid-ID cleanup |
| Radial layout cards overlapped for small rings | Ring radius now scales with the number of nodes in the ring |
| Outline drag used stale indices after filtering | Reorder by heading ordinal resolved from the current HTML |
| Filtering citations could hide every neighbour but leave the seed | Treat “only the seed remains” as an empty-filter state |
| Snapshot/tree rename/filter Escape handling could lose focus | Explicit trigger refs restore focus; Radix Escape is handled with real keydown |
| Project DAG edge labels were pluralised incorrectly at 1 | Added singular/plural count helpers |
| Responsive verification was limited by the embedded viewport | Verified 900 px and 1280 px with same-origin iframes; direct viewport 656 px |

### Verification

- `npm run typecheck` — pass.
- `npm run lint` — pass.
- `npm test` — 80 tests across 12 files, all passing (28 in `graph.test.tsx`).
- `npm run build` — pass; 3,581 modules transformed; only pre-existing chunk warnings.
- Browser smoke test on November 23, 2026:
  - **Project DAG:** all four layouts (25 nodes), minimap toggle, wheel zoom, show/hide runs (25 → 18 → 25), reset/fit, singular labels, snapshot modal open/close with Escape focus restore, PNG export (82 KB `image/png`).
  - **Project Tree:** three-level rows, collapse/expand, selection/details, complete/reopen persisted, inline rename persisted, drag re-parent, invalid project drop prevented, rename dialog Escape focus restore.
  - **Notebook Outline:** three headings extracted, click-to-scroll, live sync to four headings, drag reorder with formatting preserved and autosave persisted, empty state, collapse/expand, hidden below `lg`.
  - **File Tree:** collapse/expand, file drag into/out of folders, size roll-up (7 MB), folder rename persisted and reverted, create/delete folder, move-to-project/unlink, invalid folder-into-descendant drop prevented.
  - **Citation Graph:** radius 1 (3 nodes), seed click opens the existing paper sheet, radius 2 (4 nodes including one reference-only node), “Only in my library” (3 of 4), year filter empty state + reset, seed change to Theta–gamma (4 of 4), topic filter (2 of 4), layout selector (Radial applied).
  - **Knowledge Graph:** 28 nodes across six types, project filter (5 nodes), paper-type filter (28 → 21 → 28), direct `?focus=` load and reload, invalid focus cleanup, details panel, URL clear on close, Escape focus restore.
  - **Phase 1 regression:** Today, Research Log, Research Feed, Notifications popover, Quick Capture (`C`), and all Sync simulator states verified with no console errors.
  - **Responsive:** 656 px direct (mobile), plus 900 px and 1280 px via same-origin iframes; zero horizontal overflow on Today, Project DAG, Project Tree, Knowledge Graph, Files, Library citation tab, Notebooks, and Feed. Sidebar is 260 px and visible at 1280, hidden with the nav trigger at 900/656.
  - **200-node stress:** 200 nodes / 228 edges laid out five times per layout in the browser; dagre-lr 49.7–86.9 ms, dagre-tb 48.0–69.4 ms, radial 0.1–1.5 ms. No FPS claim.

### Follow-ups

- Phase 3 is intentionally not started.
- Graph authoring and artifact linking are not implemented.
- Citation data remains mock and unverified.
- Backend, authentication, realtime, and workspace-scoped queries remain deferred.

---

## November 20, 2026 — Phase 1 completion and verification

### Scope completed

- Finished the Phase 1 Daily Research Experience:
  - Today dashboard extensions
  - Research Log
  - Research Feed
  - Notifications inbox
  - Global Quick Capture (`C`)
  - Sync Indicator with a demo state simulator
  - Development identity provider and centralized permissions
- Added Phase 1 automated tests and documentation.
- Re-ran all quality gates and completed browser smoke testing.

### Decisions

1. **Database version 2 with an in-place migration.**
   The existing `researchos.demo.db.v1` key is retained so Stage 1 data is not lost. `upgradeDatabase` adds the `researchLog` collection and review notifications, then writes version 2 back to storage. A database newer than the app is replaced with a fresh seed rather than parsed blindly.

2. **Research log entries are the source of truth for focus time.**
   Activity events are still written for the timeline, but they carry a `researchLogId` back-reference. The feed skips those activity events and renders the research log entry instead, preventing duplicate rows.

3. **One normalized feed shape.**
   `ResearchFeedItem` merges activity and log fields (`source`, `category`, `action`, `target`, `actor`, `artifact`, `mode`, `durationMinutes`). Pages filter one array instead of branching by source.

4. **Artifacts are resolved from database truth.**
   The form submits a `type:id` key. `resolveArtifact` validates it against projects, tasks, notebooks, papers, files, and milestones, so stale or fabricated references become `null` instead of broken links.

5. **Identity is injected, not referenced.**
   `identityProvider` is a singleton selected in one file. Feature APIs call `identityProvider.getIdentity()`; pages use `useIdentity`/`usePermissions`. The development provider resolves the demo profile from the database, and the owner role supplies permissions. Swapping in a Clerk provider in Phase 9 does not require feature changes.

6. **Quick Capture reuses the full form.**
   Instead of a second form, `ResearchLogFormDialog` supports a `quick` variant and is opened through the existing `CreateDialogsProvider` with kind `"log"`. The `C` handler ignores typing targets, modifier chords, and open dialogs.

7. **Sync is explicitly simulated.**
   `useSyncStore` is non-persisted and drives only the indicator. The popover exposes all four states so reviewers can inspect the design, and labels the simulation clearly.

8. **Momentum math is centralized.**
   `src/lib/momentum.ts` owns day bucketing, intensity, streaks, calendar weeks, totals, and active-day counts. Dashboard, Research Feed, and the calendar component share it, avoiding three subtly different implementations.

9. **Recently opened artifacts are UI state.**
   `ui-store` keeps up to ten recent projects/notebooks/papers with a timestamp. It is persisted because it is device UI state, not research data, and gives "Continue working" a useful fallback without extra API calls.

10. **Notifications stay in the mock provider.**
    The existing `AppNotification` shape was extended with the `review` kind. The header popover and the inbox share `notificationKindMeta` for consistent labels and tones.

### Problems and resolutions

| Problem | Resolution |
| --- | --- |
| Feed duplicated logged work because logging also created an activity event | Added `researchLogId` to activity events and filtered those events out of the feed |
| Existing Stage 1 databases had no `researchLog` collection | Added a v1 → v2 migration with seeded log/review data while preserving existing collections |
| Dashboard had no concept of "recently opened" items | Added persisted `recentArtifacts` to `ui-store` and recorded views on project, notebook, and paper open |
| Quick Capture could fire while typing in another form | Guard checks tag name, `contentEditable`, modifier keys, and open `role="dialog"` |
| Some dashboard cards were computed in multiple places | Extracted shared momentum helpers and reused the log view builder |
| Review notifications had no icon/tone mapping in the header | Replaced the local `kindTone` map with shared `notificationKindMeta` |
| Lazy routes initially appeared as "Loading page" during smoke tests | Waited for page-specific text; confirmed the lazy chunks load and no errors are logged |

### Verification

- `npm run typecheck` — pass.
- `npm run lint` — pass.
- `npm test` — 51 tests across 11 files, all passing.
- `npm run build` — pass; 3,234 modules transformed.
- Browser smoke test on November 20, 2026:
  - Demo login succeeded.
  - Today dashboard showed momentum, scored focus totals, today's log, review requests, overdue tasks, and deadlines.
  - Research Log rendered 27 entries after the smoke-test entry, correct summary cards, chart, and filters.
  - Research Feed rendered 42 events, filtered to 26 research-log events, and opened a day drawer.
  - Notifications rendered 7 items; the `?tab=reviews` deep link activated the Reviews tab; tab switching worked.
  - Pressing `C` opened Quick Capture. A 45-minute Analysis entry was created, appeared on Today/Log/Feed, and persisted after reload. The entry was removed afterward, restoring the seeded demo.
  - Create menu → Log research activity, command palette entries, the help shortcut card, and the sync simulator states were verified.
  - No console errors or warnings were recorded.

### Follow-ups

- Phase 2 is intentionally not started.
- Browser tests did not cover narrow mobile widths; see `TESTING.md` for the outstanding manual checklist.
- Notification creation is still seed-only.

---

## November 19, 2026 — Phase 1 foundations

### Scope completed

- Added Phase 1 domain types: `ResearchMode`, `ArtifactType`, `ArtifactRef`, `ResearchLogEntry`, `ResearchFeedSource`, `ResearchFeedItem`; extended `ActivityCategory` and `NotificationKind`.
- Extended `ActivityEvent` with optional `workspaceId`, `mode`, `artifact`, and `researchLogId`.
- Built the development identity layer (`types`, `development-provider`, singleton selection, React hooks).
- Added `src/lib/momentum.ts` and the shared momentum calendar.
- Upgraded seed data with 26 research log entries and 3 review notifications.
- Implemented database v2 and the v1 → v2 migration.
- Added API services for artifacts, workspace members, research log, feed, and notifications.
- Built the Research Log page and form, Research Feed page and items, day drawer, Notifications page, and sync indicator.
- Integrated routing, sidebar, header, Create menu, command palette, help menu, notifications popover, and Quick Capture.
- Extended the dashboard API and page with Phase 1 sections.

### Notes

- Stage 1 behavior and routes were preserved throughout.
- The mock provider stayed the only persistence mechanism; no network requests were introduced.

---

## Stage 1 baseline (before Phase 1)

- React + TypeScript + Vite workspace shell with local demo authentication.
- Dashboard, projects, tasks, milestones, notebooks, library, files, activity, settings, and onboarding.
- Shared design system (Tailwind tokens, Radix primitives, shared cards/tables/empty states).
- Local demo database seeded with six projects, notebooks, papers, files, tasks, milestones, and activity.
- Lazy-loaded app routes and manual vendor chunks.
- Baseline automated tests for demo APIs, login, routing, library helpers, and formatting.
