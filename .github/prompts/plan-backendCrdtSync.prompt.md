## Plan: Nuxt backend + local-first sync (Automerge CRDT + HLC) + SQLite

TL;DR: Keep the UI and Nuxt stack unchanged, but replace "events stored as rows" with a single local Automerge document persisted in IndexedDB (Dexie). Add a Nitro endpoint `POST /api/sync` that stores one Automerge doc per `userId` in SQLite (on a mounted volume). Client runs background sync when online, using an Automerge *change-based* protocol (no per-device sync-state on the server). Each record will include `userId` and `deviceId`, and ordering will be deterministic via an HLC string.

**Steps**

1. Define shared types + HLC generator
   - Add `shared/types.ts` with `EventRecord` including `hlc: string`, `timestamp: number`, `userId: string`, `deviceId: string`
   - Add `shared/hlc.ts` implementing `nextHlc({ nowMs, lastHlc, nodeId }) -> { hlc, wallMs }` where `hlc` is lexicographically sortable
   - Keep compatibility with current pages by preserving `timestamp` semantics (ms since epoch) as shown in `pages/logs.vue`

2. Add client identity (no UI changes)
   - Add `plugins/deviceId.client.ts` to generate/persist a stable `deviceId` (localStorage is fine)
   - Add `composables/useUserId.ts` that, for now, reads `userId` from a dev header/setting and later plugs into OIDC (see Step 7)
   - Add `public.devUserId` to runtime config for local dev ergonomics in `nuxt.config.ts`

3. Refactor local storage to "Automerge doc in IndexedDB" (keep `useEvents()` API)
   - Refactor `composables/useEvents.ts` into a façade that still returns `{ events, addEvent, fetchEvents }`
   - Move all IndexedDB/Dexie/Automerge logic into a client-only module, e.g. `composables/eventsStore.client.ts`
   - New Dexie schema (same DB name or bumped version):
     - `meta`: `{ key, value }` for `lastHlc`, `lastSyncedHeads`, etc.
     - `doc`: `{ key: 'eventsDoc', bytes: Uint8Array }` (Automerge saved bytes)
   - Ensure SSR safety: avoid constructing Dexie at module scope unless `import.meta.client` (current code does this at top-level in `composables/useEvents.ts`)

4. Event creation: attach `userId` + `deviceId`, generate HLC, keep `timestamp`
   - Update `addEvent()` so callers can keep passing `{ timestamp: Date.now() }` as in `pages/index.vue`, but internally it:
     - gets `userId`, `deviceId`
     - generates `hlc` via `nextHlc`
     - writes `{ hlc, timestamp, userId, deviceId }` into the Automerge doc (map keyed by `hlc` or `hlc:deviceId`)
   - Update derived `events.value` to be a sorted array by `hlc` descending (stable across merges)

5. Client sync loop (background when online)
   - Add `composables/useSync.client.ts` that:
     - triggers on app start, `window.online`, and a small interval while online
     - uses `$fetch('/api/sync')` with retry/backoff (minimal)
     - does not block `addEvent` UI flow (fire-and-forget sync kick)
   - Payload protocol (change-based, simplest):
     - request: `{ clientHeads: string[], changesBase64: string }` where `changes = Automerge.getChanges(doc, lastSyncedHeads)`
     - response: `{ serverHeads: string[], changesBase64: string }` where `changes = Automerge.getChanges(serverDocAfterApply, clientHeads)`
   - Client updates `lastSyncedHeads = serverHeads` after applying server changes

6. Nitro backend: `/api/sync` + SQLite persistence on mounted volume
   - Add `server/api/sync.post.ts` that:
     - derives `userId` from `x-user-id` for now (later OIDC)
     - loads doc bytes for that `userId` from SQLite (or initializes empty)
     - applies client changes, saves updated doc bytes
     - computes and returns the minimal server changes the client lacks
   - Add `server/utils/sqlite.ts` to open DB and run migrations:
     - table `docs(userId TEXT PRIMARY KEY, doc BLOB NOT NULL, updatedAt INTEGER NOT NULL)`
   - Add `runtimeConfig.sqlitePath` defaulting to `/data/simple-record.sqlite` (volume-mounted)

7. Auth shape now (dev) and later (OIDC/Keycloak)
   - Add `server/utils/auth.ts` with a single `requireUserId(event)` abstraction:
     - **now:** `x-user-id` header
     - **later:** validate OIDC access token / session and return `sub` (same call sites, swapped implementation)
   - Keep all sync authorization keyed by `userId` only (no "userId in body" trust)

8. Docker/runtime adjustments for SQLite on Alpine
   - Update `Dockerfile` to:
     - install build deps in the builder stage for the chosen SQLite driver (see Verification section for what to watch)
     - ensure runtime image has required sqlite libs
     - create `/data` and document mounting a volume there
   - Choose SQLite driver in implementation:
     - likely `better-sqlite3` (simple API), but be mindful of Alpine/musl native builds

9. Tests: keep page tests mostly unchanged; expand composable tests
   - Update `tests/composables/useEvents.test.ts` to:
     - reset the new Dexie schema/tables (no longer just `events: 'timestamp'`)
     - assert event includes `userId` and `deviceId`
     - assert ordering by `hlc` (not just timestamp)
   - Add a sync-focused unit test by mocking `global.fetch` or `$fetch` in Vitest:
     - simulate two "devices" producing divergent docs and syncing through the route handler (or a factored server helper)
   - Page tests in `tests/pages/index.test.ts` and `tests/pages/logs.test.ts` can remain as composable-mocked tests (minimal changes unless the template key changes)

**Verification**

- Unit tests: `npm test`
- Local dev (two browsers/devices):
  - run `npm run dev`
  - set different `deviceId` (separate browser profiles)
  - ensure both send same `x-user-id` and see merged logs after reconnect
- Container check (with volume): `docker build .` then run with `-v $(pwd)/data:/data`

**Decisions**

- Auth now: use `x-user-id` header (confirmed)
- Client stores `userId` and tags records (confirmed)
- HLC format: single lexicographically sortable string (confirmed)
- SQLite lives on a mounted volume (confirmed)
