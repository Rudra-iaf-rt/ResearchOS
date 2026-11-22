# ResearchOS — Testing

Last updated: **November 20, 2026**

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

No end-to-end runner is configured yet. Phase 1 browser verification was performed manually through the in-app browser.

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

Recorded November 20, 2026.

| Gate | Result |
| --- | --- |
| Typecheck | Pass |
| Lint | Pass |
| Tests | **51 passed / 51**, 11 files |
| Build | Pass, 3,234 modules transformed |

### Test files

| File | Tests | Coverage focus |
| --- | ---: | --- |
| `src/features/research-log/research-log.test.ts` | 10 | CRUD, actor/workspace stamping, artifact resolution, activity event, persistence, filters, grouping, summaries, duration formatting, sort order |
| `src/lib/momentum.test.ts` | 8 | Day grid, bucketing, out-of-window entries, streak behavior, calendar weeks, intensity, local day keys |
| `src/features/feed/feed.test.ts` | 6 | Merge/dedupe with activity, newest-first sort, project/member/artifact/category/search filters, effective artifact type, grouping, momentum mapping |
| `src/features/demo-api.test.ts` | 4 | Local demo API flows and basic persistence |
| `src/services/identity/identity.test.ts` | 4 | Development principal/workspace, actor stamping, role permissions, assert/can behavior |
| `src/services/mock/storage.test.ts` | 3 | v2 seed shape, v1 → v2 migration preservation, reset |
| `src/features/notifications/notifications.test.ts` | 3 | Sort order, review seeds, unread counts, mark one/all |
| `src/features/auth/pages/login-page.test.tsx` | 3 | Login screen, validation, demo-workspace entry |
| `src/features/library/lib.test.ts` | 3 | Library helper behavior |
| `src/app/router.test.tsx` | 2 | Public and protected route behavior |
| `src/lib/format.test.ts` | 5 | Date/number/byte/duration formatting |

### Important assertions

- New research log entries carry `actorId: "user_maya"` and `workspaceId: "ws_northlight"` from the identity provider.
- A freshly logged entry creates exactly one activity event with `category: "research"` and a matching `researchLogId`.
- The feed shows a logged item once, even though an activity event backs it.
- Editing and deleting produce activity events and remove the record from the database.
- A v1 database is upgraded to v2 with existing projects and task counts intact.
- `markAllRead` leaves zero unread notifications.
- Permissions reject a viewer from `artifact:write` while allowing an owner.

---

## 4. Browser smoke test — Phase 1

Performed against the Vite dev server at `http://127.0.0.1:5173` on November 20, 2026.

| Check | Result |
| --- | --- |
| Demo login from `/login` | Pass; redirects to `/app` |
| Today dashboard renders Phase 1 sections | Pass |
| Continue working shows recent notebooks/papers | Pass |
| Research streak, focused today, last 7 days | Pass; values reflect logged entries |
| Today's research log shows entries | Pass |
| Open review requests and review deep link | Pass |
| Overdue tasks and today's deadlines | Pass |
| `/app/log` statistics and chart | Pass |
| `/app/log` mode/project/date/search filters | Pass (mode filter exercised; helper behavior unit-tested) |
| `/app/feed` merged timeline | Pass; 42 events (26 research log + 16 activity) |
| `/app/feed` category filter | Pass; Research log → 26 events |
| `/app/feed` "Open day" drawer | Pass; day events and focus total shown |
| `/app/notifications` tabs | Pass; All/Unread/Reviews/System behavior verified |
| `?tab=reviews` deep link | Pass; Reviews tab active with 3 items |
| Mark one / mark all read | Pass (API covered by tests; page wired) |
| `C` opens Quick Capture | Pass; verified with a real keypress |
| Quick Capture submission | Pass; 45-minute Analysis entry created, toast shown |
| Entry appears on Today, Log, and Feed | Pass |
| Persistence after reload | Pass; entry remained after full reload |
| Console errors/warnings | None observed on `/app`, `/app/log`, `/app/feed`, `/app/notifications` |

### Test data created during smoke testing

A single entry titled `Smoke test: reviewed ICA diagnostics` (45 minutes, Analysis) was added to the local demo database to verify create → Today/Log/Feed → reload persistence. It was removed after verification, restoring the demo to 26 research log entries and 42 feed events. Automated tests always remove the demo database in `beforeEach`, so they are unaffected.

---

## 5. Manual QA checklist

### Routes

- [x] `/app` (Today)
- [x] `/app/log`
- [x] `/app/feed`
- [x] `/app/notifications`
- [ ] Re-check all Stage 1 routes after final approval: projects, project detail, tasks, notebooks, notebook editor, library, files, activity, settings
- [ ] 404 route
- [ ] Direct URL reload on each route in production preview

### Research Log

- [x] Create via page action
- [x] Create via `C`
- [x] Create via Create menu (shared dialog)
- [ ] Edit an existing entry
- [ ] Delete an entry and confirm removal from Today/Feed
- [ ] Validation: title too short, duration below 5, invalid time
- [ ] Project and artifact selectors
- [ ] All filter combinations and Clear filters
- [ ] Empty state after filtering
- [ ] Error state (simulate storage failure)

### Research Feed

- [x] Timeline renders and sorts newest first
- [x] Category filter
- [x] Day drawer
- [ ] Project filter
- [ ] Member filter
- [ ] Artifact type filter (`No artifact`, each type)
- [ ] Search across action, target, detail, actor
- [ ] Combined filters and Clear filters
- [ ] Momentum day selection
- [ ] Empty filtered state

### Notifications

- [x] Tabs and counts
- [x] Review deep link
- [ ] Mark one read from the inbox
- [ ] Mark all read and verify header badge
- [ ] Header "View all" navigation
- [ ] Notification hover/focus states

### Quick Capture and shell

- [x] `C` on a normal page
- [ ] `C` ignored while typing in an input/textarea/editor
- [ ] `C` ignored with Ctrl/Meta/Alt
- [ ] `C` ignored while another dialog is open
- [x] Command palette entry
- [x] Help menu shortcut card
- [x] Sync simulator: all four states, auto-settle, "Simulate a sync"

### Responsive, theme, accessibility

- [ ] Widths: 390 px, 768 px, 1024 px, 1440 px
- [ ] Mobile sidebar sheet opens/closes and closes on navigation
- [ ] Dark mode on new pages
- [ ] Keyboard-only navigation for filters, tabs, and dialogs
- [ ] Focus visible on all interactive elements
- [ ] No horizontal overflow in cards, tables, charts, or drawers

Unchecked items are intentional follow-ups, not known failures.

---

## 6. Test data and isolation

- Automated tests remove `researchos.demo.db.v1` in `beforeEach` for database-sensitive suites.
- `loadDatabase()` seeds a fresh v2 database on first read.
- Storage migration tests construct a legacy v1 object, remove `researchLog`/review notifications, write it, then assert preservation after reload.
- Feed/log tests create their own entries and assert relative counts rather than relying on absolute seed totals.
- Mock latency is disabled in test mode to keep suites fast and deterministic.

---

## 7. Known gaps

1. **No automated E2E suite.** Quick Capture, filters, drawers, tabs, and persistence are currently covered by manual smoke testing. Playwright is the recommended addition.
2. **No visual regression tests.** Chart, heatmap, and dark-mode rendering are not snapshot-tested.
3. **No mobile viewport test.** Responsive classes are implemented, but device-lab verification is outstanding.
4. **No storage-quota simulation.** The save path swallows quota errors; that branch is not tested.
5. **No test for workspace scoping.** Workspace IDs are stamped but queries are not yet scoped.
6. **No notification-generation tests.** Notifications are seeded, not produced by mutations.

---

## 8. Recommended CI pipeline

```text
install → typecheck → lint → test → build
```

Run on every push once the repository has CI. Add a Playwright job after Phase 2 if daily-experience flows continue to grow. Keep the demo database reset between browser jobs so screenshots and assertions are deterministic.
