/**
 * Client-only module that manages the Automerge document backed by IndexedDB
 * (via Dexie). This is the single source of truth for events on the client.
 *
 * MUST only be imported when `import.meta.client` is true (or inside .client.ts
 * files / onMounted / etc.).
 */
import Dexie from 'dexie'
import * as Automerge from '@automerge/automerge'
import type { EventsDoc, EventRecord } from '~/shared/types'
import { nextHlc } from '~/shared/hlc'

// ─── Dexie schema ───────────────────────────────────────────────────────────

interface MetaRow {
  key: string
  value: string
}

interface DocRow {
  key: string
  bytes: Uint8Array
}

class EventsDB extends Dexie {
  meta!: Dexie.Table<MetaRow, string>
  doc!: Dexie.Table<DocRow, string>

  constructor() {
    super('EventsDB')
    this.version(2).stores({
      meta: 'key',
      doc: 'key',
      // Drop the old v1 `events` table if it exists
    })
    // Explicitly delete the legacy table from v1
    this.version(3).stores({
      events: null, // remove legacy table
      meta: 'key',
      doc: 'key',
    })
  }
}

const db = new EventsDB()

// ─── Automerge doc helpers ──────────────────────────────────────────────────

const DOC_KEY = 'eventsDoc'
const META_LAST_HLC = 'lastHlc'
const META_SYNCED_HEADS = 'lastSyncedHeads'

/** Load the persisted Automerge doc (or create a fresh one). */
export async function loadDoc(): Promise<Automerge.Doc<EventsDoc>> {
  const row = await db.doc.get(DOC_KEY)
  if (row?.bytes) {
    return Automerge.load<EventsDoc>(row.bytes as Automerge.BinaryDocument)
  }
  return Automerge.from<EventsDoc>({ events: {} })
}

/** Persist the Automerge doc bytes into IndexedDB. */
export async function saveDoc(doc: Automerge.Doc<EventsDoc>): Promise<void> {
  const bytes = Automerge.save(doc)
  await db.doc.put({ key: DOC_KEY, bytes })
}

// ─── HLC state ──────────────────────────────────────────────────────────────

export async function getLastHlc(): Promise<string> {
  const row = await db.meta.get(META_LAST_HLC)
  return row?.value ?? ''
}

export async function setLastHlc(hlc: string): Promise<void> {
  await db.meta.put({ key: META_LAST_HLC, value: hlc })
}

// ─── Sync-heads state ───────────────────────────────────────────────────────

export async function getLastSyncedHeads(): Promise<string[]> {
  const row = await db.meta.get(META_SYNCED_HEADS)
  if (!row?.value) return []
  return JSON.parse(row.value) as string[]
}

export async function setLastSyncedHeads(heads: string[]): Promise<void> {
  await db.meta.put({ key: META_SYNCED_HEADS, value: JSON.stringify(heads) })
}

// ─── High-level API used by useEvents ───────────────────────────────────────

/**
 * Add a new event record into the local Automerge document.
 *
 * Returns the updated sorted events list so callers can refresh their
 * reactive state immediately (no round-trip through IndexedDB read).
 */
export async function addEventRecord(
  timestamp: number,
  userId: string,
  deviceId: string
): Promise<EventRecord[]> {
  const lastHlc = await getLastHlc()
  const { hlc } = nextHlc({ nowMs: timestamp, lastHlc, nodeId: deviceId })
  await setLastHlc(hlc)

  let doc = await loadDoc()
  doc = Automerge.change(doc, (d) => {
    d.events[hlc] = { hlc, timestamp, userId, deviceId }
  })
  await saveDoc(doc)

  return sortedEvents(doc)
}

/** Read all events from the persisted doc, sorted by HLC descending. */
export async function readAllEvents(): Promise<EventRecord[]> {
  const doc = await loadDoc()
  return sortedEvents(doc)
}

/** Extract a sorted-by-HLC-descending array from a doc. */
function sortedEvents(doc: Automerge.Doc<EventsDoc>): EventRecord[] {
  return Object.values(doc.events).sort((a, b) => (b.hlc > a.hlc ? 1 : b.hlc < a.hlc ? -1 : 0))
}

// ─── Sync helpers (used by useSync) ─────────────────────────────────────────

/**
 * Compute changes the server doesn't have (since `lastSyncedHeads`).
 * Returns `{ changes, heads }` where `heads` are the current doc heads.
 */
export async function getChangesForSync(): Promise<{
  changes: Uint8Array[]
  heads: Automerge.Heads
}> {
  const doc = await loadDoc()
  const heads = Automerge.getHeads(doc)
  const syncedHeadsStr = await getLastSyncedHeads()

  if (syncedHeadsStr.length === 0) {
    // First sync – send the full save
    const allChanges = Automerge.getAllChanges(doc)
    return { changes: allChanges, heads }
  }

  const syncedHeads = syncedHeadsStr as unknown as Automerge.Heads
  const changes = Automerge.getChanges(doc, syncedHeads)
  return { changes, heads }
}

/**
 * Apply changes received from the server and persist the result.
 * Returns the new sorted events list.
 */
export async function applyServerChanges(
  changesRaw: Uint8Array[]
): Promise<EventRecord[]> {
  let doc = await loadDoc()
  const [newDoc] = Automerge.applyChanges(doc, changesRaw)
  doc = newDoc
  await saveDoc(doc)
  return sortedEvents(doc)
}

/** Reset the database — useful for tests. */
export async function resetDB(): Promise<void> {
  await db.delete()
  await db.open()
}
