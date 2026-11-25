# ResearchOS — Testing

Last updated: **November 25, 2026**

---

## 1. Test stack

| Layer | Tool |
| --- | --- |
| Unit and integration | Vitest 2 |
| DOM environment | jsdom |
| Component rendering | Testing Library |
| Mock latency | 0 ms when `MODE === "test"` |
| Test setup | `src/test/setup.ts` (includes jest-dom matchers) |
| Configuration | `vitest.config.ts` (`globals: true`, `restoreMocks: true`) |

No end-to-end runner is configured yet. Phase 1, Phase 2, and Phase 3 browser verification was performed manually through the in-app browser.

---

## 2. Commands

```bash
npm run typecheck   # tsc -b --noEmit
npm run lint        # eslint .
npm test            # vitest run
npm run test:watch  # vitest
npm run build       # tsc -b && vite build
```

---

## 3. Latest results

Recorded November 25, 2026.

| Gate | Result |
| --- | --- |
| Typecheck | Pass |
| Lint | Pass |
| Tests | **88 passed / 88**, 13 files |
| Build | Pass, 3,622 modules transformed; pre-existing chunk warnings only |

### Test files

| File | Tests | Coverage focus |
| --- | ---: | --- |
| `src/features/reasoning.test.ts` | 7 | Experiments/runs and frozen parameters, hypothesis status/evidence counts, decision alternatives, snapshot immutability/export, history restore/versioning, diff helpers |
| `src/features/graph/graph.test.tsx` | 28 | Validation, layouts incl. 200 nodes, focus URL state, filters, NodeDetailPanel selection/detail, outline extraction/reorder, task tree rename/re-parent/cycles, file tree roll-ups/moves, graph API payloads, citation filtering |
| `src/features/research-log/research-log.test.ts` | 10 | CRUD, actor/workspace stamping, artifact resolution, activity event, persistence, filters, grouping, summaries, duration formatting, sort order |
| `src/lib/momentum.test.ts` | 8 | Day grid, bucketing, out-of-window entries, streak behavior, calendar weeks, intensity, local day keys |
| `src/features/feed/feed.test.ts` | 6 | Merge/dedupe with activity, newest-first sort, project/member/artifact/category/search filters, effective artifact type, grouping, momentum mapping |
| `src/lib/format.test.ts` | 5 | Date/number/byte/duration formatting |
| `src/features/demo-api.test.ts` | 4 | Local demo API flows and basic persistence |
| `src/services/identity/identity.test.ts` | 4 | Development principal/workspace, actor stamping, role permissions, assert/can behavior |
| `src/services/mock/storage.test.ts` | 5 | v4 seed shape, v1 → v2 → v3 → v4 migration preservation, reset |
| `src/features/notifications/notifications.test.ts` | 3 | Sort order, review seeds, unread counts, mark one/all |
| `src/features/auth/pages/login-page.test.tsx` | 3 | Login screen, validation, demo-workspace entry |
| `src/features/library/lib.test.ts` | 3 | Library helper behavior |
| `src/app/router.test.tsx` | 2 | Public and protected route behavior |

### Important assertions

- Edges that reference missing nodes or point at themselves are reported or pruned; duplicate node IDs fail validation.
- Every supported layout returns finite positions for every node; manual layout honours stored coordinates.
- The 200-node stress fixture is structurally valid and lays out all 200 nodes within a generous ceiling.
- `?focus=` is read on direct load, invalid IDs are removed safely with replace, user changes push history, back restores the previous focus, and clearing removes the parameter.
- Type/status/run filters and text search prune nodes and invalid edges.
- `NodeDetailPanel` renders the selected label, type/conclusion, status, metadata, artifact link, and related-node navigation; Escape calls close.
- Task rename persists, re-parent rejects self/descendant/cross-project/second-level parents, and failed re-parents leave the stored task intact.
- Outline extraction uses real headings, nesting by level, section moves preserve inline formatting, and moving a section inside itself is a no-op.
- File-tree folder sizes/counts roll up through descendants, orphans stay visible, and folder moves into self/descendants are rejected without changing storage.
- Graph API payloads from seeds are structurally valid; knowledge graphs use `links` only; citation payloads stay seed-centred.
- A v2 database upgrades to v3 with graph collections added and existing project/task/log records intact.
- New research log entries carry `actorId: "user_maya"` and `workspaceId: "ws_northlight"`.
- The feed shows a logged item once, even though an activity event backs it.
- `markAllRead` leaves zero unread notifications.
- Creating a run clones the experiment parameters, so editing the experiment afterwards does not change the run.
- Experiment and run status transitions reject disallowed moves.
- Hypothesis evidence counts group by supports/contradicts/neutral and evidence links resolve through the artifact resolver.
- Decision alternatives are validated and artifact links are restricted to the decision's project.
- Snapshot manifests are written once; later source edits do not change stored entries; export is real JSON with `schemaVersion: 1`.
- Restoring a version applies the structured snapshot, appends a new version, and leaves every earlier version intact.
- Table diff parsing ignores separator rows and reports added/removed/changed cells.

---

## 4. Browser smoke test — Phase 3

Performed against the Vite dev server at `http://localhost:5173` on November 24–25, 2026.

### Experiments and runs

| Check | Result |
| --- | --- |
| Experiments table | Pass; 8 seed rows, search/project/status/sort controls, table/grid toggle |
| Create experiment | Pass; Zod validation blocked empty parameters, then a valid experiment was created |
| Detail tabs | Pass; Overview, Runs (2), Parameters (3), Artifacts (3), Notes |
| Run lifecycle | Pass; allowed-next text and transitions for queued/running/succeeded/failed |
| Immutable parameters | Pass; run detail shows the frozen parameter snapshot |
| Expandable run rows | Pass; logs, parameters, artifacts, timestamps |
| Reproduce dialog | Pass; explicit mock copy: no computation, no worker, no new run |
| Experiment history | Pass; v1/v2, Current badge, +1/−1 diff, Text/Markdown/Table modes |
| Experiment status | Pass; invalid transitions rejected; status changes recorded in activity |

### Hypotheses and evidence

| Check | Result |
| --- | --- |
| Four columns | Pass; Proposed/Testing/Supported/Refuted with counts |
| Drag persistence | Pass; card moved to Testing, stored status `testing`, columns 0/4/5/0 |
| Side panel | Pass; question, statement, project, linked experiment, counts, timestamps |
| Add evidence | Pass; form added a supporting entry and incremented the supporting count |
| Artifact link | Pass; project-scoped artifact selector populated |
| Final promotion | Pass; Promote to Supported opened a confirmation alert naming the consequence |
| Activity/notification integration | Pass; “added supporting evidence”, “marked a hypothesis supported”, “Evidence recorded”, “Hypothesis supported” |

### Decisions

| Check | Result |
| --- | --- |
| Project grouping | Pass; 4 cards across project sections |
| Detail panel | Pass; `?focus=dec_ica_components`, context, decision, alternatives, linked artifacts, owner, timestamps |
| Edit modal | Pass; prefilled fields, dynamic alternative rows, project-scoped artifact suggestions |
| Status controls | Pass; Proposed/Accepted/Superseded available |

### Snapshots

| Check | Result |
| --- | --- |
| Grouping and list | Pass; 3 seeded snapshots under their projects |
| Detail manifest | Pass; 4 entries with type, revision, selected time |
| JSON export | Pass; captured `application/json` blob with schema/version, snapshot, project, manifest, and notice |
| Create snapshot | Pass; 10 selected artifacts, created and persisted |
| Delete confirmation | Pass; alert named the snapshot and manifest count; deleting removed only the snapshot |

### History and diff

| Check | Result |
| --- | --- |
| Notebook history | Pass; v1/v2, Current badge |
| Notebook restore | Pass; v1 restored, v3 created, v1/v2 preserved, editor content updated |
| Project history | Pass; v1/v2, Current badge |
| Compare gating | Pass; Compare enabled at 2 selections, Restore only at 1 historical version |
| Diff modes | Pass; Text/Markdown/Table toggles, +1/−1, removed/added lines |
| Drawer close | Pass; Radix close button and Escape close the drawer |

### Command palette and navigation

| Check | Result |
| --- | --- |
| New experiment | Pass; opened ExperimentModal |
| New hypothesis | Pass; opened hypothesis modal |
| New decision | Pass; opened DecisionModal |
| Create snapshot | Pass; opened SnapshotModal with project candidates |
| Sidebar entries | Pass; Experiments/Hypotheses/Decisions under Workspace, Snapshots under Insights |
| Project DAG node action | Pass; selected experiment node and “Open experiment” navigated to `/app/experiments/exp_cortical_cohort_a` |

### Phase 1/2 regression and console

| Check | Result |
| --- | --- |
| Dashboard, Projects, Project detail | Pass |
| Tasks, Notebooks, Notebook editor | Pass |
| Library, Files | Pass |
| Feed, Activity, Notifications | Pass; feed showed 45 events after reload, including Phase 3 activity |
| Knowledge Graph, Project DAG, Project Tree | Pass; DAG 25 nodes including reasoning records |
| Research Log, Settings | Pass |
| Console errors/warnings | None on Experiments, Experiment detail, Hypotheses, Decisions, or Snapshots |

### Responsive checks

| Width | Result |
| --- | --- |
| 390 px | Zero horizontal overflow on Experiments, Experiment detail, Hypotheses, Decisions, Snapshots after adding `relative` to table wrappers |
| 768 px | Zero horizontal overflow on the same routes |
| 1280 px | Zero horizontal overflow; desktop sidebar visible |

The `relative` fix was required because `sr-only` table captions/actions are absolutely positioned; without a positioned scroll wrapper they escaped the table and expanded the document width.

### Accessibility

| Check | Result |
| --- | --- |
| Lighthouse — Experiments | 0.96 accessibility, 1.0 best practices |
| Lighthouse — Hypotheses | 0.96 accessibility |
| Lighthouse — Decisions | 0.95 accessibility |
| Lighthouse — Snapshots | 0.95 accessibility |
| Remaining findings | Shared muted-text contrast (4.48 vs 4.5), avatar-initial contrast, and accessible-name mismatch on the global search/profile triggers |
| Dialog focus | Experiment modal focused the title input; Escape closed it with a real keydown |
| Keyboard labels | Kanban cards, history checkboxes, run expanders, and diff mode buttons expose labels/pressed state |

---

## 5. Browser smoke test — Phase 2 (historical)

Performed against the Vite dev server at `http://localhost:5173` on November 23, 2026.

### Project DAG — `/app/projects/proj_cortical/graph`

| Check | Result |
| --- | --- |
| Hypothesis → experiment → run DAG renders | Pass; 25 nodes: 1 project, 4 hypotheses, 4 experiments, 7 runs, 1 decision, 1 notebook, 3 papers, 4 datasets |
| All four layouts | Pass; each renders 25 nodes |
| Minimap toggle | Pass |
| Zoom in/out and fit | Pass; wheel zoom reported `scale(1.39474)` |
| Show/hide runs | Pass; 25 → 18 → 25 |
| Reset view | Pass |
| Singular/plural counts | Pass; “1 project / 1 notebook / 1 decision” |
| Type/status filters | Pass (filters popover; Reset restores) |
| Node selection + details panel | Pass |
| Snapshot modal | Pass; opens, closes, Escape restores focus to “Save snapshot” |
| PNG export | Pass; downloaded `cortical-dynamics-of-working-memory-graph.png`, 82 KB, `image/png` |

### Project Tree — `/app/projects/proj_cortical/tree`

| Check | Result |
| --- | --- |
| Project → milestone → task → subtask rows | Pass; three levels visible |
| Expand/collapse | Pass |
| Select task and open details | Pass |
| Mark complete / reopen | Pass; persisted through reload |
| Inline rename | Pass; double-click/pencil, saved and persisted; Escape reverted |
| Drag re-parent between milestones | Pass; “Task moved” and order persisted; reverted to original order |
| Drop task onto project root | Pass; invalid target prevented with no toast or move |
| Rename dialog Escape | Pass; focus restored to pencil trigger |

### Notebook Outline — Notebook Editor right rail

| Check | Result |
| --- | --- |
| Extracts real TipTap headings | Pass; 3 headings initially |
| Nested collapsible tree | Pass |
| Click-to-scroll | Pass; “Parameters” became active and `scrollY` changed |
| Live sync | Pass; heading count updated to 4 after editing |
| Drag reorder | Pass; moved before “Parameters”, formatting preserved, autosave persisted |
| Empty state | Pass; “No headings yet” |
| Collapse/expand rail | Pass |
| Hidden below `lg` | Pass; verified by temporarily forcing display at 656 px then removing the override |

### File Tree — File Manager left rail

| Check | Result |
| --- | --- |
| Folder expand/collapse | Pass |
| Drag file between folders | Pass; moved to Figures and back to root |
| Folder size roll-up | Pass; Figures showed 7 MB |
| Folder rename | Pass; persisted then reverted |
| Create/delete folder | Pass; temporary folder created and removed |
| Move folder to project | Pass; `proj_cortical`, then Unlinked |
| Invalid folder-into-descendant move | Pass; `dropEffect: "none"`, no move |
| Missing parents / empty tree | Pass; tree stays usable |

### Citation Graph — `/app/library?tab=graph`

| Check | Result |
| --- | --- |
| Seed neighbourhood radius 1 | Pass; 3 of 3 papers |
| Seed click opens paper detail | Pass; existing sheet opened with `?paper=paper_3` |
| Radius 2 | Pass; 4 papers incl. one reference-only node |
| “Only in my library” | Pass; 3 of 4 |
| Year range filter | Pass; 2025 → 2019 produces the empty-filter state |
| Reset filters | Pass; returns to 1 hop / 3 of 3 |
| Change seed paper | Pass; re-centred on Theta–gamma (4 of 4) |
| Topic filter | Pass; Oscillations → 2 of 4 |
| Layout selector | Pass; Radial applied |
| Loading state | Present in code and exercised on navigation between tabs; not held open for screenshots |
| Error state | Shared query error path; not forced during this smoke run |

### Knowledge Graph — `/app/knowledge`

| Check | Result |
| --- | --- |
| Graph renders from `links` | Pass; 28 nodes, six types (project, hypothesis, decision, notebook, paper, dataset) |
| Project filter | Pass; Single-Cell Atlas → 5 nodes |
| Node-type filter | Pass; Papers off → 21, back on → 28 |
| Layout selector | Pass; four options, same canvas as project DAG |
| Shared detail panel | Pass; notebook details incl. owner, tags, metrics |
| Direct `?focus=` load | Pass; panel opened for `notebook:nb_gut_inventory` |
| Reload with focus | Pass; selection restored |
| Invalid focus | Pass; `?focus=ghost-node` and an unknown paper ID were cleaned with no error |
| Clear focus | Pass; close removes the parameter |
| Escape/focus restore | Pass; filters popover closed and returned focus to “Filters” |
| Empty-state copy | Verified in code; not reachable with seeded links without deleting data |

### Phase 1 regression

| Check | Result |
| --- | --- |
| Today dashboard | Pass; all sections and counts |
| Research Log | Pass; summary cards, chart, entries |
| Research Feed | Pass; 42 events (26 log + 16 activity), filters and sections |
| Notifications popover | Pass; unread count and items |
| Quick Capture (`C`) | Pass; dialog opens, Escape closes |
| Sync Indicator | Pass; all four simulator states |
| Create menu / command palette | Pass; Phase 2 entries present, Phase 1 entries intact |
| Console errors | None on the exercised routes |

### Responsive checks

The embedded browser’s direct viewport is 656 CSS px (DPR 1.5). Tablet (900 px) and desktop (1280 px) layouts were rendered with same-origin iframes, which evaluate their own media queries.

| Width | Result |
| --- | --- |
| 656 px (mobile) | Sidebar hidden behind nav trigger; zero horizontal overflow on Today, Project DAG, Project Tree, Knowledge Graph, Files, Library citation tab, Notebooks, Feed |
| 900 px (tablet) | Sidebar hidden, nav trigger visible (`flex`); zero horizontal overflow on the same eight routes; outline rail hidden |
| 1280 px (desktop) | Sidebar visible at 260 px, nav trigger hidden (`none`); zero horizontal overflow; Project DAG 25 nodes, Knowledge Graph 28, citation graph 3; notebook outline rail visible |

This is not a device-lab run; dark mode and touch interactions were not re-tested in Phase 2.

### 200-node stress result

`buildStressGraph(200)` (200 nodes, 228 edges) was laid out five times per layout inside the live browser page:

| Layout | Runs (ms) | Result |
| --- | --- | --- |
| `dagre-lr` | 86.9, 82.3, 58.1, 55.7, 49.7 | 200 finite positions |
| `dagre-tb` | 49.1, 48.1, 48.0, 69.4, 57.5 | 200 finite positions |
| `radial` | 1.5, 0.4, 0.4, 0.3, 0.1 | 200 finite positions |

This measures layout computation only. No FPS or render-throughput claim is made.

---

## 6. Manual QA checklist

### Routes

- [x] `/app` (Today)
- [x] `/app/log`
- [x] `/app/feed`
- [x] `/app/notifications`
- [x] `/app/projects/proj_cortical/graph`
- [x] `/app/projects/proj_cortical/tree`
- [x] `/app/knowledge`
- [x] `/app/library?tab=graph`
- [x] `/app/files`
- [x] `/app/notebooks/nb_cortical_analysis`
- [x] `/app/experiments`
- [x] `/app/experiments/exp_cortical_cohort_a`
- [x] `/app/experiments/exp_heat_calibration?tab=runs`
- [x] `/app/hypotheses`
- [x] `/app/decisions?focus=dec_ica_components`
- [x] `/app/snapshots`
- [ ] Re-check every Stage 1 route after final approval: projects list/detail, tasks, notebooks list, library list, activity, settings, onboarding
- [ ] 404 route
- [ ] Direct URL reload on each route in production preview

### Graph canvas and project DAG

- [x] Custom node cards with type icon, label, status
- [x] Hover elevation and visible focus ring
- [x] Focus dims unrelated nodes
- [x] Directional arrows; dashed `cites`
- [x] Hover-only edge labels
- [x] Zoom in/out, fit, reset, minimap toggle
- [x] All four layouts
- [x] Type/status filters and show/hide runs
- [x] Selection updates URL and detail panel
- [x] Invalid `?focus=` cleaned safely; back/forward restores valid focus
- [x] PNG export
- [x] Snapshot placeholder open/close and focus restore
- [x] Experiment/run node actions navigate to real destinations

### Project tree

- [x] Three-level tree and unassigned tasks
- [x] Expand/collapse
- [x] Inline rename (save, Escape)
- [x] Drag re-parent and reload persistence
- [x] Invalid/circular drop prevented
- [x] Status complete/reopen
- [ ] Create/delete task from the tree (not in Phase 2 scope)
- [ ] Keyboard-only drag alternative

### Notebook outline

- [x] Extraction from live document
- [x] Nested tree, collapse/expand
- [x] Click-to-scroll
- [x] Live sync
- [x] Drag reorder + autosave persistence
- [x] Empty state
- [x] Hidden below `lg`

### File tree

- [x] Folder expand/collapse
- [x] Drag file/folder; roll-ups
- [x] Rename, create, delete
- [x] Move to project / unlink
- [x] Invalid descendant move prevented
- [ ] Upload into a specific folder from the tree (existing upload flow unchanged)
- [ ] Multi-select drag

### Citation and knowledge graphs

- [x] Radius 1/2, seed change
- [x] Year range, library-only, topic filters
- [x] Empty-filter state + reset
- [x] Paper sheet opens from a node
- [x] Knowledge project/type filters
- [x] Shared detail panel and artifact link
- [x] URL focus load/reload/invalid/clear
- [ ] Forced API error state
- [ ] Empty knowledge graph with seeded links removed
- [ ] Citation labels on touch devices

### Experiments, runs, hypotheses, decisions, snapshots

- [x] Experiments search/filter/sort and table/grid toggle
- [x] Create/edit experiment with key/value parameters and validation
- [x] Detail tabs and experiment status transitions
- [x] Run lifecycle, frozen parameters, logs, artifacts, expandable rows
- [x] Reproduce dialog states it is a mock operation
- [x] Hypothesis drag persistence and menu movement
- [x] Evidence form with stance and artifact link; counts update
- [x] Final promotion confirmation
- [x] Decision detail/edit, dynamic alternatives, artifact suggestions
- [x] Snapshot create, detail manifest, JSON export, delete confirmation
- [x] Notebook and project history/compare/restore
- [x] Command palette quick actions
- [ ] Delete an experiment/decision from the UI (API supports it; destructive UI is limited)
- [ ] Reorder Kanban columns with a keyboard-only alternative
- [ ] Force a run failure and inspect the failed log path

### Phase 1 flows

- [x] Today sections
- [x] Research Log create via `C`
- [x] Feed filters and day drawer
- [x] Notification tabs and review deep link
- [x] Sync simulator states
- [ ] Edit/delete a research log entry
- [ ] Quick Capture ignored while typing / with modifiers / while a dialog is open
- [ ] Mark one/all notifications read from the inbox

### Accessibility and theme

- [x] Keyboard-reachable graph nodes (`role="button"`, Tab, Enter/Space)
- [x] aria-labels include label/type/status
- [x] Escape closes overlays and restores focus (details, snapshot, rename, filters)
- [x] No color-only meaning (icons + text in legend and status)
- [x] History checkboxes and diff modes expose labels/pressed state
- [x] Modal focus lands on the first field
- [ ] Full keyboard-only pass across every new control
- [ ] Dark mode on all new surfaces
- [ ] Screen-reader pass on graph canvas and Kanban drag

Unchecked items are intentional follow-ups, not known failures.

---

## 7. Test data and isolation

- Automated tests remove `researchos.demo.db.v1` in `beforeEach` for database-sensitive suites.
- `loadDatabase()` seeds a fresh v4 database on first read.
- Storage migration tests construct legacy v1/v2/v3 objects, write them, then assert preservation after reload.
- Graph tests create deterministic fixtures for nodes/edges/tasks/folders rather than depending on seed counts.
- Browser smoke mutations were reverted where practical: file/folder moves, folder rename, tree task order/name, and notebook entry content were restored; temporary folders were deleted.
- Mock latency is disabled in test mode to keep suites fast and deterministic.

---

## 8. Known gaps

1. **No automated E2E suite.** Phase 3 interactions are covered by manual browser smoke tests plus unit/integration tests. Playwright is the recommended addition.
2. **No visual regression tests.** Graph cards, Kanban columns, and dark-mode rendering are not snapshot-tested.
3. **No device-lab run.** 390/768/1280 px layouts were verified with iframes, not physical devices.
4. **No FPS measurement.** The 200-node result is layout time only; render throughput is not profiled.
5. **No graph-authoring tests.** There is no write API for graph nodes/edges yet.
6. **No storage-quota simulation.** The save path swallows quota errors; that branch is not tested.
7. **No forced API-error UI test.** Graph/reasoning query errors use the shared error path but were not forced during the smoke run.
8. **Notification generation is tested indirectly.** Phase 3 mutations create notifications; the notification helpers themselves remain seed-tested.
9. **Workspace scoping untested.** IDs are stamped, but queries are not scoped.
10. **Document restore untested.** The contract accepts `document`, but no document editor exists.
11. **Binary snapshot export untested.** Export is a metadata manifest only.

---

## 9. Recommended CI pipeline

```text
install → typecheck → lint → test → build
```

Run on every push once the repository has CI. Add a Playwright job before Phase 4 grows the reasoning workflows further. Keep the demo database reset between browser jobs so screenshots and assertions are deterministic.
