# ResearchOS — API Documentation

Last updated: **November 20, 2026**

Phase 1 APIs are Promise-based frontend service modules backed by the local demo database. They are intentionally shaped so a FastAPI client can replace the mock transport without changing pages.

---

## 1. Conventions

| Topic | Behavior |
| --- | --- |
| Module location | `src/features/<feature>/api.ts` |
| Transport | `readDb` / `mutateDb` from `src/services/mock/client.ts` |
| Return type | `Promise<T>` for reads and writes |
| Latency | 90 ms in development, 0 ms in tests |
| Persistence | `localStorage` key `researchos.demo.db.v1`, version 2 |
| Identity | Supplied by `identityProvider`, never by page code |
| Permissions | Asserted inside mutating APIs |
| Errors | `Error` with a user-readable message; pages surface a toast or error state |
| Cache keys | Declared in `src/lib/query-keys.ts` |
| Sorting | Newest first unless noted |

TanStack Query is the expected consumer. Mutations invalidate the query keys they affect.

### Query keys

```ts
queryKeys = {
  projects, project(id), projectSummaries,
  tasks, milestones,
  notebooks, notebook(id),
  papers, files, folders,
  activity,
  notifications,
  dashboard,
  analytics,
  profile,
  workspace,
  preferences,
  identity,
  members,        // ["workspace", "members"]
  artifacts,
  researchLog,    // ["research-log"]
  feed,           // ["feed"]
}
```

### Shared errors

| Condition | Message |
| --- | --- |
| Missing permission | `Missing permission: <permission>` |
| Log entry not found | `Research log entry not found` |
| Editing another actor's entry without `workspace:manage` | `You can only edit your own log entries` |
| Deleting another actor's entry without `workspace:manage` | `You can only delete your own log entries` |

---

## 2. Research Log API

`src/features/research-log/api.ts`

### `researchLogApi.list(): Promise<ResearchLogView[]>`

Returns all entries sorted by `occurredAt` descending, enriched with:

```ts
interface ResearchLogView extends ResearchLogEntry {
  actor: Person;
  projectTitle: string | null;
  artifactUrl: string | null;
}
```

Unknown actors fall back to an "Unknown researcher" person. Unknown projects yield `projectTitle: null`.

### `researchLogApi.create(input: ResearchLogInput): Promise<ResearchLogView>`

Requires `log:write`.

```ts
interface ResearchLogInput {
  mode: ResearchMode;             // reading | writing | experiment | analysis | review | admin
  title: string;                  // trimmed
  notes?: string;                 // trimmed; empty becomes undefined
  durationMinutes: number;
  occurredAt: string;             // ISO or datetime-local value
  projectId: string | null;
  artifact: ArtifactRef | null;
}
```

Behavior:

- Resolves the actor and workspace from the identity provider.
- Validates the project exists; otherwise stores `null`.
- Validates the artifact against database truth; unknown artifacts become `null`.
- Appends the entry with `createdAt`/`updatedAt` timestamps and sorts by occurrence.
- Writes a `research` activity event with `mode`, `artifact`, `workspaceId`, and `researchLogId`.
- Returns the newly enriched view.

### `researchLogApi.update(id, input): Promise<ResearchLogView>`

Requires `log:write`; requires ownership or `workspace:manage`.

Updates mode, title, notes, duration, occurrence, project, and artifact, then refreshes `updatedAt`, sorts, and writes an `updated a research log entry` activity event. Throws if the entry is missing.

### `researchLogApi.remove(id): Promise<{ id: string }>`

Requires `log:write`; requires ownership or `workspace:manage`.

Removes the entry and writes a `deleted a research log entry` activity event. The event retains the original project/mode context.

### Form validation (client)

`src/features/research-log/schema.ts`:

| Field | Rules |
| --- | --- |
| `mode` | One of the six modes |
| `title` | 3–140 characters after trim |
| `durationMinutes` | Integer, 5–1,440 |
| `occurredAt` | Non-empty valid date/time |
| `notes` | Optional, ≤ 2,000 characters |
| `projectId` | String (`"none"` or project ID) |
| `artifactKey` | String (`"none"` or `type:id`) |

### Pure helpers

`src/features/research-log/lib.ts`

| Function | Purpose |
| --- | --- |
| `toLogViews(db)` | Enrich and sort entries |
| `formatDuration(minutes)` | `25m`, `1h`, `1h 35m` |
| `filterLogViews(views, filters)` | Mode, project (`all`/`none`/ID), date range, search |
| `groupLogViews(views)` | Day groups with Today/Yesterday labels |
| `modeBreakdown(views)` | Minutes/entries/colors per mode |
| `summarizeLog(views)` | Today/week totals, active days, top mode |
| `toDateTimeLocal(value)` | Format for `datetime-local` inputs |
| `rangeStart(range)` | Start of today/7-day/30-day window |

---

## 3. Research Feed API

`src/features/feed/api.ts`

### `feedApi.list(): Promise<ResearchFeedItem[]>`

Merges two sources:

1. `db.activity` events **without** `researchLogId`.
2. All `db.researchLog` entries.

Normalization:

| Field | Activity source | Research log source |
| --- | --- | --- |
| `id` | `activity:<eventId>` | `log:<entryId>` |
| `source` | `"activity"` | `"research-log"` |
| `category` | event category | `"research"` |
| `action` | event action | `logged <duration> of <mode>` |
| `target` | event target | entry title |
| `detail` | event detail | entry notes |
| `actor` | event actor | directory lookup by `actorId` |
| `projectId` | event project | entry project |
| `artifact` | event artifact | entry artifact |
| `mode` | event mode | entry mode |
| `durationMinutes` | absent | entry duration |
| `createdAt` | event time | `occurredAt` |

Result is sorted by `createdAt` descending. Events that reference a log entry are skipped, so logged work appears exactly once.

### Pure helpers

`src/features/feed/lib.ts`

| Function | Purpose |
| --- | --- |
| `effectiveArtifactType(item)` | Explicit artifact type, else category-derived type, else `"none"` |
| `filterFeedItems(items, filters)` | Project, member, artifact type, category, search |
| `groupFeedItems(items)` | Day groups with Today/Yesterday labels |
| `feedMomentumEntries(items)` | `{ createdAt, minutes }` for momentum helpers |

Filter sentinels: `projectId` supports `"all"` and `"none"`; `artifactType` supports `"all"` and `"none"`; `category`/`memberId` support `"all"`.

---

## 4. Notifications API

`src/features/notifications/api.ts`

### `notificationsApi.list(): Promise<AppNotification[]>`

Returns all notifications sorted newest first. Kinds: `deadline`, `assignment`, `mention`, `review`, `system`.

### `notificationsApi.markRead(id): Promise<AppNotification[]>`

Sets `read: true` when found and returns the updated collection. Unknown IDs are ignored.

### `notificationsApi.markAllRead(): Promise<AppNotification[]>`

Marks every notification read.

### `notificationsApi.unreadCount(): Promise<number>`

Counts unread notifications.

The header popover still uses `list` and filters locally; the inbox uses the same list plus tabs.

---

## 5. Artifacts API

`src/features/artifacts/api.ts`

### `artifactsApi.list(): Promise<ArtifactOption[]>`

Scans the database and returns linkable records:

```ts
interface ArtifactOption extends ArtifactRef {
  projectId: string | null;
  href: string;
  meta: string; // project name, artifact label, or type fallback
}
```

Sources: projects, notebooks, papers, files, tasks, milestones.

### Helpers (`src/features/artifacts/lib.ts`)

| Function | Purpose |
| --- | --- |
| `scanArtifacts(db)` | Build artifact options from database truth |
| `resolveArtifact(db, type, id)` | Return a valid `ArtifactRef` or `null` |
| `artifactHref(ref)` | Route for project/notebook/paper/file; tasks and milestones go to `/app/tasks` |
| `parseArtifactKey(key)` | Parse `type:id` from a select value |
| `artifactKey(ref)` | Serialize an artifact to `type:id` or `"none"` |

---

## 6. Workspace API

`src/features/workspace/api.ts`

### `workspaceApi.members(): Promise<Person[]>`

Returns the workspace member directory derived from people referenced by database records, sorted by name. This supplies feed member filters without importing seed arrays.

`src/services/mock/directory.ts` exposes `buildPersonDirectory(db)` and `userToPerson(user)` internally for the same purpose.

---

## 7. Identity API

`src/services/identity/index.ts`

### `identityProvider.getIdentity(): Promise<Identity>`

Current implementation: `DevelopmentIdentityProvider`.

```ts
interface Identity {
  user: {
    id: string; name: string; email: string; initials: string;
    role: string; institution: string; avatarColor: string;
  };
  workspace: { id: string; name: string; slug: string };
  role: "owner" | "admin" | "editor" | "commenter" | "viewer";
  permissions: Permission[];
  provider: "development" | "clerk";
}
```

Development behavior: reads the demo user/workspace, assigns `owner`, and returns the owner permission set.

### `getCurrentActor(): Promise<CurrentActor>`

```ts
{ userId: string; workspaceId: string; name: string; initials: string }
```

Used for stamping records and activity events.

### Permission helpers

| Function | Purpose |
| --- | --- |
| `permissionsForRole(role)` | Copy of the role's permission list |
| `can(identity, permission)` | Boolean check |
| `assertPermission(identity, permission)` | Throws `Missing permission: <permission>` |

Permission values: `artifact:read`, `artifact:write`, `artifact:delete`, `log:write`, `review:submit`, `member:manage`, `workspace:manage`, `integration:manage`, `data:export`.

### React hooks (`use-identity.ts`)

| Hook | Returns |
| --- | --- |
| `useIdentity()` | TanStack Query result for the identity (60 s stale time) |
| `usePermissions()` | `{ identity, role, isLoading, can(permission) }` |

---

## 8. Dashboard API

`src/features/dashboard/api.ts`

### `dashboardApi.get(): Promise<DashboardPayload>`

Reads the database once and returns:

```ts
{
  user, workspace, preferences, analytics, stats,
  projects: ProjectSummary[],
  tasks, milestones, notebooks, papers, files,
  activity: ActivityEvent[],
  researchLog: ResearchLogView[],
  notifications: AppNotification[], // newest first
}
```

`stats` retains the Stage 1 shape (`activeProjects`, `completedProjects`, `pendingTasks`, `documents`, `notebookEntries`, `libraryPapers`, `overdueTasks`, `storageUsed`). Phase 1 sections derive from `researchLog`, `notifications`, `tasks`, `milestones`, and `activity`.

---

## 9. Database schema (v2)

`src/services/mock/storage.ts`, `src/services/mock/seed.ts`, `src/types/index.ts`

```ts
interface ResearchDatabase {
  version: 2;
  user: UserProfile;
  workspace: Workspace;
  preferences: AppPreferences;
  projects: Project[];
  tasks: Task[];
  milestones: Milestone[];
  notebooks: Notebook[];
  papers: Paper[];
  files: ResearchFile[];
  folders: Folder[];
  activity: ActivityEvent[];
  researchLog: ResearchLogEntry[];   // added in v2
  notifications: AppNotification[];
  analytics: AnalyticsPoint[];
}
```

### ResearchLogEntry

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | `log_*` |
| `workspaceId` | string | From identity |
| `actorId` | string | From identity |
| `projectId` | string \| null | Validated against projects |
| `mode` | ResearchMode | Six modes |
| `title` | string | Trimmed |
| `notes` | string? | Optional |
| `durationMinutes` | number | 5–1,440 via form; API trusts input shape |
| `artifact` | ArtifactRef \| null | Resolved from database truth |
| `occurredAt` | ISO string | When work happened |
| `createdAt` | ISO string | Record creation |
| `updatedAt` | ISO string | Last mutation |

### ActivityEvent additions

| Field | Type | Notes |
| --- | --- | --- |
| `workspaceId` | string? | Stamped on new events |
| `mode` | ResearchMode? | Present for research events |
| `artifact` | ArtifactRef \| null? | Linked artifact |
| `researchLogId` | string? | Back-reference used to de-duplicate the feed |

Events are capped at 120 entries (`logActivity`).

### Migration

| From | To | Behavior |
| --- | --- | --- |
| none | 2 | Full seed |
| 1 | 2 | Add seeded `researchLog` if absent, append review notifications if none, preserve all existing collections |
| > 2 | 2 | Reseed (forward-incompatible database) |
| invalid JSON | 2 | Reseed |

Storage key intentionally remains `researchos.demo.db.v1` so upgrades find Stage 1 data.

---

## 10. Client-side state APIs

### UI store (`src/store/ui-store.ts`)

| Member | Purpose |
| --- | --- |
| `theme`, `sidebarCollapsed`, `mobileNavOpen`, `commandOpen`, `createMenuOpen` | Existing shell state |
| `recentArtifacts` | Up to 10 `{ type, id, label, href, projectId, viewedAt }` |
| `recordArtifactView(artifact)` | Upsert and move to front, trim to 10 |
| `clearRecentArtifacts()` | Reset history |

### Sync store (`src/store/sync-store.ts`)

| Member | Purpose |
| --- | --- |
| `status` | `synced` \| `syncing` \| `offline` \| `conflict` |
| `lastSyncedAt` | Timestamp for the indicator |
| `setStatus(status)` | Simulator control |
| `beginSync()` | Set syncing |
| `markSynced()` | Set synced and refresh timestamp |

No network request is made.

---

## 11. Future REST mapping

When FastAPI is introduced, each service method maps to a conventional endpoint. The frontend contract should remain stable:

| Service method | Suggested endpoint |
| --- | --- |
| `researchLogApi.list` | `GET /api/workspaces/:workspaceId/research-log` |
| `researchLogApi.create` | `POST /api/workspaces/:workspaceId/research-log` |
| `researchLogApi.update` | `PATCH /api/research-log/:id` |
| `researchLogApi.remove` | `DELETE /api/research-log/:id` |
| `feedApi.list` | `GET /api/workspaces/:workspaceId/feed` |
| `notificationsApi.list` | `GET /api/workspaces/:workspaceId/notifications` |
| `notificationsApi.markRead` | `PATCH /api/notifications/:id` |
| `notificationsApi.markAllRead` | `POST /api/workspaces/:workspaceId/notifications/read-all` |
| `artifactsApi.list` | `GET /api/workspaces/:workspaceId/artifacts` |
| `workspaceApi.members` | `GET /api/workspaces/:workspaceId/members` |
| `dashboardApi.get` | `GET /api/workspaces/:workspaceId/dashboard` |

Server responsibilities for that phase: workspace scoping, authorization, validation, pagination, and conflict handling.
