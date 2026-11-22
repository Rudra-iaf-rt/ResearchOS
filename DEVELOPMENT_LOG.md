# ResearchOS — Development Log

Newest entries first. This log records scope, decisions, problems, and verification for each implementation phase.

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
