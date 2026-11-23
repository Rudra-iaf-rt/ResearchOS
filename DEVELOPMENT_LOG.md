# ResearchOS — Development Log

Newest entries first. This log records scope, decisions, problems, and verification for each implementation phase.

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
