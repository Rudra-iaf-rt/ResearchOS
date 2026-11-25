# ResearchOS — Implementation Status

Last updated: **November 25, 2026**

Current phase: **Phase 3 — Scientific Reasoning Engine: complete, awaiting approval**

Phase 1 and Phase 2 are preserved and browser-regression-tested. Phase 4 has **not** been started. No authentication, backend, realtime, AI, or OAuth work has been started; authentication remains deferred to Phase 9.

---

## 1. Phase overview

| Phase | Scope | Status |
| --- | --- | --- |
| Stage 1 | Core research workspace: auth shell, onboarding, dashboard, projects, tasks, milestones, notebooks, library, files, activity, settings, local demo data | Complete (baseline preserved) |
| Phase 1 | Daily Research Experience: Today dashboard, Research Log, Research Feed, Notifications, Quick Capture, Sync Indicator, development identity abstraction | Complete (approved) |
| Phase 2 | Research Knowledge Graph: shared graph canvas, project DAG, project tree, notebook outline, file tree, citation graph, knowledge graph | Complete (approved) |
| Phase 3 | Scientific Reasoning Engine: experiments, runs, hypotheses/evidence, decisions, snapshots, version history/diff/restore, Phase 1/2 integration | **Complete, awaiting approval** |
| Phases 4–8 | Defined by the Stage 2+ specification | Not started |
| Phase 9 | Authentication (Clerk or equivalent) behind the identity provider | Not started (by design) |

---

## 2. Quality-gate results

Run from the repository root on November 25, 2026.

| Gate | Command | Result |
| --- | --- | --- |
| TypeScript | `npm run typecheck` | Pass, no diagnostics |
| Lint | `npm run lint` | Pass, no warnings or errors |
| Automated tests | `npm test` | Pass, **88 tests in 13 files** |
| Production build | `npm run build` | Pass, **3,622 modules transformed**; pre-existing chunk-size/circular-chunk warnings only |
| Console errors | Browser smoke test | None on the Phase 1, Phase 2, or Phase 3 routes exercised |
| Persistence | Browser smoke test | Experiment creation, run transitions, hypothesis drag, evidence, decision edits, snapshot create/delete, notebook restore, and project history survived reloads |
| Responsive | Browser smoke test | No horizontal overflow at 390, 768, or 1280 px on the new routes after the table-wrapper fix |
| Accessibility | Lighthouse | **0.95–0.96** on Experiments, Hypotheses, Decisions, and Snapshots; remaining findings are shared-component contrast/name issues (see Limitations) |

---

## 3. Phase 3 requirement checklist

### Module 1 — Experiments

| Requirement | Status | Implementation |
| --- | --- | --- |
| Routes | Done | `/app/experiments`, `/app/experiments/:id` |
| Search, project filter, status filter, sort | Done | Client-side derivation in `features/experiments/lib.ts`; all filters combine |
| Table default with grid toggle | Done | Accessible table with 8 seed rows; grid cards use the same data and actions |
| `ExperimentModal` | Done | Title, project, linked hypothesis, description, key/value parameters; React Hook Form + Zod |
| Parameter validation | Done | Non-empty keys, duplicate-key rejection, at least one parameter, project/hypothesis consistency |
| Detail tabs | Done | Overview, Runs, Parameters, Artifacts, Notes |
| Status lifecycle | Done | `draft → queued → running → succeeded/failed`; invalid transitions rejected by API |
| Notes | Done | TipTap editor scoped to the experiment; autosave records a version and syncs external restores |
| Snapshot/history actions | Done | Experiment detail opens the shared Snapshot modal and `HistoryDrawer` |

### Module 2 — Runs

| Requirement | Status | Implementation |
| --- | --- | --- |
| Run lifecycle | Done | `queued → running → succeeded/failed`; transitions and allowed-next text shown in the UI |
| Immutable parameter snapshot | Done | `runsApi.create` clones the experiment parameters at creation; later edits do not rewrite the run |
| Timestamps and duration | Done | `startedAt`, `endedAt`, and `durationSeconds` are written on transitions |
| Logs | Done | Appended on start/finish; rendered in an expandable, labelled log block |
| Artifacts | Done | Per-run artifact references rendered with the existing artifact links |
| Expandable rows | Done | `RunList`/`RunRow` expose parameters, logs, artifacts, and timestamps |
| Reproduce dialog | Done (mock by requirement) | States explicitly that no computation, worker, or new run is created; only `New run` queues a run |
| No false reproduction claims | Done | Copy and actions avoid claiming a real re-execution |

### Module 3 — Hypotheses and evidence

| Requirement | Status | Implementation |
| --- | --- | --- |
| Four-column Kanban | Done | Proposed, Testing, Supported, Refuted; counts and empty drop targets |
| Drag persistence | Done | Native drag/drop plus card-menu movement; status persisted through `hypothesesApi.setStatus` |
| Evidence stances | Done | Supports, contradicts, neutral; counts derived from stored evidence |
| Linked artifacts | Done | Evidence can reference a notebook, paper, dataset, file, or decision through the existing artifact resolver |
| Linked experiments | Done | Side panel lists experiments whose `hypothesisId` matches |
| Final promotion confirmation | Done | Supported/Refuted require an alert dialog; confirmation is recorded in activity and notifications |
| `HypothesisSidePanel` / `EvidenceForm` | Done | Side panel, add/remove evidence, stance select, artifact select, validation |

### Module 4 — Decisions

| Requirement | Status | Implementation |
| --- | --- | --- |
| ADR-style records | Done | Title, context, decision, alternatives with rationale, status, owner, timestamps |
| Grouped by project | Done | Cards grouped under project headings with counts |
| Dynamic alternatives | Done | Add/remove alternative rows in `DecisionModal`; Zod validates titles/rationales |
| Artifact links | Done | Project-scoped suggestions for experiments, hypotheses, notebooks, papers, datasets/files, and decisions |
| Edit/detail panel | Done | `?focus=` detail drawer with status controls and Edit opening the modal |
| Status | Done | Proposed, accepted, superseded |

### Module 5 — Snapshots

| Requirement | Status | Implementation |
| --- | --- | --- |
| Grouped by project | Done | Project sections with snapshot counts |
| Manifest captured at creation | Done | `SnapshotManifestEntry[]` is written once; detail views never re-query source artifacts |
| Detail table | Done | Artifact, type, revision reference, selected timestamp, and real artifact navigation |
| JSON manifest export | Done | Real downloadable `application/json` document with schema/version, snapshot, project, and entries |
| DOI honesty | Done | DOI is optional, stored only when supplied, and displayed as “Not assigned” otherwise; no DOI registration |
| Delete confirmation | Done | Alert dialog names the snapshot and manifest count; source artifacts are untouched |
| `SnapshotModal` / `SnapshotManifest` | Done | Candidate selection, label/project/description/DOI, live manifest preview |

### Module 6 — History, diff, and restore

| Requirement | Status | Implementation |
| --- | --- | --- |
| `HistoryDrawer` contract | Done | `artifactType: "notebook" \| "experiment" \| "project" \| "document"`, `artifactId`, `open`, `onOpenChange` |
| Chronological versions | Done | Oldest first with version number, label, summary, author, and relative time |
| Current badge | Done | Highest version is marked Current |
| Selection limits | Done | Maximum two selections; Compare enabled only at two; Restore enabled only at one historical version |
| Restore semantics | Done | Applies the structured snapshot and creates a new version; earlier versions are never deleted |
| `DiffViewer` modes | Done | Text, Markdown (compared as text), and Table (row/cell changes) |
| Table diffs | Done | Parses pipe-delimited content; added/removed/changed cells are highlighted |
| Notebook/project integration | Done | History buttons on the notebook editor and project detail page; notebook restore refreshes editor content and draft |

### Integration and navigation

| Requirement | Status | Implementation |
| --- | --- | --- |
| Activity feed | Done | Experiment, run, hypothesis, evidence, decision, snapshot, and restore events use the existing activity log |
| Research Feed | Done | New activity categories appear in the existing timeline and category filters |
| Notifications | Done | `pushNotification` adds in-app notifications for creates, run finishes, evidence, promotions, snapshots, and restores |
| Project DAG / Knowledge Graph | Done | Reasoning records are materialized as nodes/edges using existing graph IDs; no `GraphCanvas` rewrite and no invented relationships |
| Graph node actions | Done | Node detail actions navigate to the real experiment/hypothesis/decision/run destination instead of placeholder toasts |
| Sidebar | Done | Workspace adds Experiments, Hypotheses, Decisions; Insights adds Snapshots; all existing entries remain |
| Command palette | Done | New experiment, New hypothesis, New decision, and Create snapshot open the real dialogs |
| Routes | Done | All five Phase 3 routes are lazy-loaded inside the protected app shell |

---

## 4. Database and persistence

- Database version **4** in `researchos.demo.db.v1`; v1 → v2 → v3 → v4 migration is additive.
- New collections: `experiments`, `experimentRuns`, `hypotheses`, `evidence`, `decisions`, `snapshots`, `versions`.
- New seed records reuse existing graph IDs (`exp_*`, `run_*`, `hyp_*`, `dec_*`) so Phase 2 graph views stay coherent.
- Seed counts: **8 experiments, 13 runs, 9 hypotheses, 17 evidence entries, 4 decisions, 3 snapshots, 10 versions**.
- Versions store plain-text `content` for diffing and structured `data` for lossless restore.
- Deleting an experiment/project/notebook also removes its versions; snapshots keep their frozen manifest.
- All writes go through `mutateDb`; reads go through `readDb`; no page imports seed arrays.

---

## 5. Phase 1 and Phase 2 preservation

- Dashboard, Projects, Project detail, Tasks, Notebooks, Notebook editor, Library, Files, Feed, Activity, Notifications, Knowledge Graph, Project DAG, Project Tree, Research Log, and Settings all loaded without console errors in the regression pass.
- Existing routes, design tokens, shared components, and mock APIs keep their behavior.
- The sidebar, header, Create menu, and command palette gained only additive Phase 3 entries.
- Phase 2 graph views now include reasoning nodes/edges and real node navigation; the canvas, layouts, filters, and focus URL contract are unchanged.
- The v3 → v4 migration appends reasoning collections without replacing Stage 1, Phase 1, or Phase 2 records.

---

## 6. Known limitations

1. **Local browser only.** All records live in `localStorage`; there is no server, multi-device sync, or realtime collaboration.
2. **Runs are simulated.** Status transitions, logs, durations, and artifacts are mock operations. The Reproduce dialog deliberately performs no computation and creates no run.
3. **Snapshots are metadata manifests.** They freeze artifact identity, type, title, project, revision reference, and selection time; they do not copy binary file contents or notebook bodies.
4. **DOI is researcher-supplied only.** ResearchOS does not register, resolve, or validate DOIs.
5. **Document history is contract-only.** `VersionArtifactType` includes `document`, but no document editor exists; Restore is implemented for notebooks, experiments, and projects.
6. **Seeded history is selective.** Experiment versions are seeded only for `exp_cortical_cohort_a` and `exp_catalysts_batch4`; other experiments start with no versions until edited or restored.
7. **Accessibility findings are shared.** Lighthouse reports 0.95–0.96; the remaining contrast findings come from shared muted text and avatar colors, and the accessible-name mismatch is on the global search/profile triggers, not Phase 3 screens.
8. **Responsive verification is iframe-based.** 390, 768, and 1280 px were checked in same-origin iframes inside the embedded browser, not a device lab.
9. **Graph editing remains read-only.** Reasoning relationships are materialized from stored records; there is no UI to author graph edges, and manual layout coordinates are display-only.
10. **Development identity and simulated sync.** The signed-in user is the demo workspace owner; the sync indicator performs no network I/O.
11. **Caps.** Activity is capped at 120 events and notifications at 80.

---

## 7. Deferred placeholders (three, justified)

1. **Document version restore.** The history contract accepts `document`, but no document editor exists in Phases 1–3. Implementing restore now would create a dead-end surface.
2. **Binary snapshot archives.** Snapshots intentionally freeze metadata only. Copying datasets/files would require storage quotas and export packaging beyond Phase 3.
3. **Real run execution and reproduction.** Phase 3 requires auditable mock runs; a worker/queue/execution backend is out of scope until the backend phase.

---

## 8. Exact next task

**Wait for explicit user approval of Phase 3.** After approval, begin Phase 4 exactly as defined in the Stage 2+ specification, without starting any later phase.
