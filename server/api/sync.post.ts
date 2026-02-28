/**
 * POST /api/sync
 *
 * Change-based Automerge sync endpoint.
 *
 * Request body:
 *   { clientHeads: string[], changesBase64: string }
 *
 * Response body:
 *   { serverHeads: string[], changesBase64: string }
 */
import * as Automerge from '@automerge/automerge'
import type { EventsDoc } from '~/shared/types'
import { requireUserId } from '~/server/utils/auth'
import { getDB } from '~/server/utils/sqlite'

// ─── base-64 <-> Uint8Array helpers (same encoding as client) ───────────────

function encodeChanges(changes: Uint8Array[]): string {
  if (changes.length === 0) return ''
  let totalLen = 0
  for (const c of changes) totalLen += 4 + c.byteLength
  const buf = new Uint8Array(totalLen)
  let offset = 0
  for (const c of changes) {
    const dv = new DataView(buf.buffer, offset, 4)
    dv.setUint32(0, c.byteLength, false)
    offset += 4
    buf.set(c, offset)
    offset += c.byteLength
  }
  return Buffer.from(buf).toString('base64')
}

function decodeChanges(b64: string): Uint8Array[] {
  if (!b64) return []
  const raw = new Uint8Array(Buffer.from(b64, 'base64'))
  const out: Uint8Array[] = []
  let offset = 0
  while (offset < raw.byteLength) {
    const dv = new DataView(raw.buffer, offset, 4)
    const len = dv.getUint32(0, false)
    offset += 4
    out.push(raw.slice(offset, offset + len))
    offset += len
  }
  return out
}

// ─── Handler ────────────────────────────────────────────────────────────────

export default defineEventHandler(async (event) => {
  const userId = requireUserId(event)

  const body = await readBody<{
    clientHeads: string[]
    changesBase64: string
  }>(event)

  if (!body || !Array.isArray(body.clientHeads)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request body' })
  }

  const db = getDB()

  // 1. Load (or init) the server doc for this user
  const row = db.prepare('SELECT doc FROM docs WHERE userId = ?').get(userId) as
    | { doc: Buffer }
    | undefined

  let doc: Automerge.Doc<EventsDoc>
  if (row?.doc) {
    doc = Automerge.load<EventsDoc>(new Uint8Array(row.doc) as Automerge.BinaryDocument)
  } else {
    doc = Automerge.from<EventsDoc>({ events: {} })
  }

  // Remember heads *before* applying client changes so we can diff later
  const headsBeforeApply = Automerge.getHeads(doc)

  // 2. Apply incoming client changes
  const clientChanges = decodeChanges(body.changesBase64)
  if (clientChanges.length > 0) {
    const [merged] = Automerge.applyChanges(doc, clientChanges)
    doc = merged
  }

  // 3. Persist updated doc
  const savedBytes = Automerge.save(doc)
  db.prepare(
    'INSERT INTO docs (userId, doc, updatedAt) VALUES (?, ?, ?) ON CONFLICT(userId) DO UPDATE SET doc = excluded.doc, updatedAt = excluded.updatedAt'
  ).run(userId, Buffer.from(savedBytes), Date.now())

  // 4. Compute changes the client lacks
  //    Client told us its heads; we return everything it doesn't have.
  const clientHeads = body.clientHeads as unknown as Automerge.Heads
  let serverChangesForClient: Uint8Array[] = []
  try {
    serverChangesForClient = Automerge.getChanges(doc, clientHeads)
  } catch {
    // If heads are unknown (first sync / corrupted), send everything
    serverChangesForClient = Automerge.getAllChanges(doc)
  }

  const serverHeads = Automerge.getHeads(doc).map(String)

  return {
    serverHeads,
    changesBase64: encodeChanges(serverChangesForClient),
  }
})
