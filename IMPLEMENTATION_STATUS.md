# ResearchOS — Implementation Status

Last updated: **November 23, 2026**

Current phase: **Phase 2 — Research Knowledge Graph: complete, awaiting approval**

Phase 1 and the Stage 1 baseline are preserved. Phase 3 has **not** been started. No authentication, backend, realtime, AI, or OAuth work has been started; authentication remains deferred to Phase 9.

---

## 1. Phase overview

| Phase | Scope | Status |
| --- | --- | --- |
| Stage 1 | Core research workspace: auth shell, onboarding, dashboard, projects, tasks, milestones, notebooks, library, files, activity, settings, local demo data | Complete (baseline preserved) |
| Phase 1 | Daily Research Experience: Today dashboard, Research Log, Research Feed, Notifications, Quick Capture, Sync Indicator, development identity abstraction | Complete (approved) |
| Phase 2 | Research Knowledge Graph: shared graph canvas, project DAG, project tree, notebook outline, file tree, citation graph, knowledge graph | **Complete, awaiting approval** |
| Phases 3–8 | Defined by the Stage 2+ specification | Not started |
| Phase 9 | Authentication (Clerk or equivalent) behind the identity provider | Not started (by design) |

---

## 2. Quality-gate results

Run from the repository root on November 23, 2026.

| Gate | Command | Result |
| --- | --- | --- |
| TypeScript | `npm run typecheck` | Pass, no diagnostics |
| Lint | `npm run lint` | Pass, no warnings or errors |
| Automated tests | `npm test` | Pass, **80 tests in 12 files** |
| Production build | `npm run build` | Pass, **3,581 modules transformed**; pre-existing chunk-size/circular-chunk warnings only |
| Console errors | Browser smoke test | None on the Phase 1 and Phase 2 routes exercised |
| Broken routes | Manual smoke test | `/app/projects/:id/graph`, `/app/projects/:id/tree`, `/app/knowledge`, and the Library citation tab all resolve through lazy loading |
| End-to-end persistence | Manual smoke test | Tree rename/re-parent, file moves, notebook outline reorder, and task status changes survived reloads |

### Measured 200-node result

The stress fixture (`buildStressGraph(200)`, 228 edges) was laid out in the live browser and repeated five times per layout. This is layout computation time only; no frame-rate or render-throughput claim is made.

| Layout | Runs (ms) | Result |
| --- | --- | --- |
| `dagre-lr` | 86.9, 82.3, 58.1, 55.7, 49.7 | 200 finite positions |
| `dagre-tb` | 49.1, 48.1, 48.0, 69.4, 57.5 | 200 finite positions |
| `radial` | 1.5, 0.4, 0.4, 0.3, 0.1 | 200 finite positions |

The canvas memoizes layout and node/edge derivations; positions are recalculated only when nodes, edges, or layout change.

---

## 3. Phase 2 requirement checklist

### Shared graph foundation

| Requirement | Status | Implementation |
| --- | --- | --- |
| Graph domain types | Done | `GraphNode` (`id`, `type`, `label`, optional `status`, `parentId`, `metadata`) and `GraphEdge` (`id`, `from`, `to`, `type`) in `src/types` |
| Node types | Done | project, experiment, run, hypothesis, paper, notebook, dataset, decision |
| Edge types | Done | depends, derived_from, cites, tests, links, branches |
| Edge validation | Done | `validateGraph` reports duplicate node IDs, dangling edges, and self-links; `filterValidEdges` prunes references outside the visible view |
| GraphCanvas contract | Done | `nodes`, `edges`, `layout`, `focusId`, click/layout/focus handlers, legend/filters/toolbar/empty-state slots, `className` |
| Custom node cards | Done | Type icon, label, status, metadata, hover elevation, visible focus ring, unrelated-node dimming |
| Directional edges | Done | Arrow markers per edge type; `cites`/`derived_from`/`links` dashed; edge labels revealed on hover |
| Zoom and fit | Done | Zoom in/out, fit view, reset control, minimap toggle, layout selector |
| Memoized rendering | Done | Layout, related-node set, flow nodes, and flow edges are memoized |
| Keyboard accessibility | Done | Nodes are `role="button"`, Tab-reachable, labelled with label/type/status, Enter/Space selects, Escape closes the detail panel and restores focus |

### Project DAG — `/app/projects/:id/graph`

| Requirement | Status | Implementation |
| --- | --- | --- |
| Hypothesis → experiment → run DAG | Done | Seeded graph records reuse existing projects and link to artifacts |
| Branch/merge relationships | Done | `branches` and `derived_from` edges; hypotheses with `kind: "conclusion"` act as conclusions |
| Filters | Done | Node-type multi-select, status chips, show/hide runs |
| Selection and details | Done | Shared `NodeDetailPanel` with linked artifacts and related-node navigation |
| Experiment/run actions | Done (Phase 3 placeholders) | “Open experiment” and “View run logs” surface a clearly limited placeholder toast |
| Snapshot modal | Done (placeholder) | Opens, traps focus, closes via button/Escape, restores focus to “Save snapshot” |
| Layout selector | Done | Four layouts: left-to-right DAG, top-to-bottom DAG, radial, manual |
| PNG export | Done | Real SVG serialization + canvas draw; verified download of an 82 KB PNG |
| Reset/fit and counts | Done | Reset view, singular/plural node and edge labels |

### Project Tree — `/app/projects/:id/tree`

| Requirement | Status | Implementation |
| --- | --- | --- |
| Project → Milestones → Tasks → Subtasks | Done | One subtask level; unassigned tasks grouped explicitly |
| Expand/collapse | Done | Per-node controls with state |
| Inline rename | Done | Double-click or pencil, Enter/blur saves, Escape cancels and restores focus |
| Drag re-parent | Done | Tasks move between milestones/parents; persisted through `tasksApi.reparent` |
| Persistence | Done | Rename/re-parent/status changes survive reload |
| Status pills and due dates | Done | Existing task status/priority metadata reused |
| Details panel | Done | Selected task details, complete/reopen, linked project context |
| Invalid/circular parents | Done | Self, descendant, cross-project, and second-level parents rejected before write; records preserved on failure |

### Notebook Outline — Notebook Editor right rail

| Requirement | Status | Implementation |
| --- | --- | --- |
| Extract real TipTap headings | Done | HTML parsed with DOM APIs; nested by level |
| Collapsible tree | Done | Parent/child sections expand and collapse |
| Click to scroll | Done | Uses the live editor instance supplied by `onEditorReady` |
| Live sync | Done | Updates as the document changes without reload |
| Drag reorder | Done | Moves the heading’s full section; formatting preserved; persisted through autosave |
| Empty state | Done | “No headings yet” guidance |
| Collapsible rail and responsiveness | Done | Rail collapses; hidden below `lg` |

### File Tree — File Manager left rail

| Requirement | Status | Implementation |
| --- | --- | --- |
| Folders and files | Done | Recursive tree, unassigned files, missing-parent orphans kept visible |
| Expand/collapse | Done | Per-folder controls |
| Drag files/folders | Done | Drop onto folders or the root; nested moves persist |
| Context menu | Done | Rename, move to project, delete folder; delete lifts children instead of deleting them |
| Folder size roll-ups | Done | Size and file counts aggregate through descendants |
| Empty/missing parents | Done | Orphans surface safely instead of disappearing |
| Prevent invalid folder moves | Done | Self and descendant targets rejected; UI shows no-drop and API throws |
| Refresh after mutation | Done | Queries invalidated; verified after moves/renames/deletes |

### Citation Graph — Research Library tab

| Requirement | Status | Implementation |
| --- | --- | --- |
| Seed-paper neighbourhood | Done | Undirected BFS with radius 1–2 |
| Year range | Done | From/to year selects |
| Only in my library | Done | External reference-only nodes filtered out |
| Tag filter | Done | Topic facet derived from paper tags |
| Change seed paper | Done | Seed selector re-centres the graph |
| Open paper detail | Done | Click opens the existing library paper sheet (`?paper=`) |
| States | Done | Loading skeleton, empty-filter state, populated graph; API error is surfaced by the shared query error path |
| Mock citation honesty | Done | Copy states citations are mock and not externally verified |

### Knowledge Graph — `/app/knowledge`

| Requirement | Status | Implementation |
| --- | --- | --- |
| Artifact graph via `links` | Done | Notebooks, papers, datasets, hypotheses, decisions, and owning projects |
| Project/type filters | Done | Project selector + node-type checkboxes + show runs |
| Layout selector | Done | Same four layouts as the project DAG |
| Shared detail panel | Done | Linked artifacts and artifact navigation |
| Shared URL focus | Done | `?focus=` selects and restores nodes |
| Empty state | Done | Exact copy: “Link artifacts from any notebook or paper to start building your knowledge graph.” |

### Data, navigation, and tests

| Requirement | Status | Implementation |
| --- | --- | --- |
| Promise-based graph APIs | Done | `graphApi.project`, `knowledge`, `citations`, `citationUniverse`, `validate` |
| Simulated latency | Done | Uses the existing mock transport (90 ms dev, 0 ms tests) |
| Workspace/actor metadata | Done | Graph reads and existing mutations continue through the identity-aware database |
| v3-compatible persistence | Done | Adds `graphNodes`, `graphEdges`, `citations`; v1→v2→v3 migrations preserve records |
| Realistic connected seeds | Done | Existing six projects plus experiments, runs, hypotheses, decisions, and citations |
| No Phase 1 reset | Done | Migration only appends missing collections |
| Safe invalid references | Done | Invalid edges dropped at read time; invalid `?focus=` cleaned safely |
| Routes and navigation | Done | New routes, project dropdown links, sidebar Knowledge Graph, command palette entry |
| Automated coverage | Done | Validation, layouts (including 200 nodes), focus URL state, filters, detail panel, tree rename/re-parent/cycles, outline extraction/reorder, file moves, citation filters, persistence |

---

## 4. Phase 1 preservation

- Today, Research Log, Research Feed, Notifications, Quick Capture, and the Sync Indicator were re-smoke-tested with no regressions.
- Existing routes, design tokens, shared components, and mock APIs are unchanged in behavior.
- The sidebar, header, Create menu, and command palette gained only Phase 2 entries.
- Quick Capture still opens with `C`, ignores typing/modifiers/open dialogs, and persists through the existing log API.
- The database migration appends graph records without replacing Stage 1/Phase 1 collections.

---

## 5. Known limitations

1. **Local browser only.** All records live in `localStorage`; there is no server, multi-device sync, or realtime collaboration.
2. **Read-only graph domain.** Graph nodes/edges are seeded; there is no UI to author links or edit node metadata in this phase.
3. **Mock citations.** Citation edges and external reference-only paper nodes are synthetic and explicitly not externally verified.
4. **PNG export scope.** Export serializes the current SVG view; external images/fonts without CORS access would be omitted. Verified in Chromium only.
5. **Manual layout is display-only.** Stored coordinates/grid placement are used for the manual layout, but dragging nodes does not persist new coordinates.
6. **Phase 3 placeholders.** Project-DAG experiment/run actions and the snapshot modal are deliberate placeholders, labelled as such in the UI.
7. **Development identity.** The current user is always the demo workspace owner; permissions exist but are not backed by authentication, and queries are not workspace-scoped.
8. **Simulated sync.** The sync indicator performs no network I/O.
9. **Responsive verification.** Direct viewport was 656 px (mobile); 900 px (tablet) and 1280 px (desktop) were verified with same-origin iframes inside the embedded browser. No horizontal overflow was found on eight routes. This is not a device-lab run, and the notebook outline is intentionally hidden below `lg`.
10. **Performance reporting.** The 200-node result measures layout computation, not frame rate or render throughput.
11. **Notification generation.** Notifications remain seed-only; Phase 2 actions do not create notifications.

---

## 6. Deferred to later phases

- Graph authoring: create/edit nodes and edges, link artifacts from notebooks/papers, and graph mutations with validation.
- Real experiment and run-log workflows behind the project-DAG actions.
- Snapshot capture/share beyond the placeholder modal.
- Verified citation import (DOI/Crossref/OpenAlex) and real citation provenance.
- Real authentication and authorization (Phase 9), backend persistence, real sync, realtime collaboration.
- Workspace-scoped queries and multi-workspace switching.
- Feed pagination, saved filters, and notification generation from domain events.
- Mobile-specific interaction refinements and device-lab verification.

---

## 7. Exact next task

**Wait for user approval of Phase 2.** After approval, begin **Phase 3** exactly as defined in the Stage 2+ specification, in order, without starting any later phase.
