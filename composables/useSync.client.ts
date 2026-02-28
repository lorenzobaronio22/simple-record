/**
 * Client-only composable that runs a background sync loop when online.
 *
 * Protocol (change-based, no per-device sync-state on server):
 *   → POST /api/sync  { clientHeads, changesBase64 }
 *   ← 200             { serverHeads, changesBase64 }
 *
 * The composable is activated by `app.vue` (or a plugin) and never blocks
 * the UI — sync is fire-and-forget with retry / back-off.
 */
import {
  getChangesForSync,
  applyServerChanges,
  setLastSyncedHeads,
} from '~/composables/eventsStore.client'
import { useUserId } from '~/composables/useUserId'

const SYNC_INTERVAL_MS = 30_000 // 30 s
const RETRY_BASE_MS = 2_000

/**
 * Encode an array of Uint8Array changes into a single base-64 string.
 * Each change is length-prefixed (4-byte big-endian) so the receiver can
 * split them back apart.
 */
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
  return btoa(String.fromCharCode(...buf))
}

/** Inverse of `encodeChanges`. */
function decodeChanges(b64: string): Uint8Array[] {
  if (!b64) return []
  const raw = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
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

export { encodeChanges, decodeChanges }

let running = false

export function useSync() {
  if (running) return
  running = true

  const userId = useUserId()

  let timer: ReturnType<typeof setTimeout> | null = null
  let retries = 0

  async function sync() {
    try {
      const { changes, heads } = await getChangesForSync()
      const clientHeads = heads.map(String)
      const changesBase64 = encodeChanges(changes)

      const res = await $fetch<{
        serverHeads: string[]
        changesBase64: string
      }>('/api/sync', {
        method: 'POST',
        headers: { 'x-user-id': userId },
        body: { clientHeads, changesBase64 },
      })

      // Apply server changes
      const serverChanges = decodeChanges(res.changesBase64)
      if (serverChanges.length > 0) {
        const updatedEvents = await applyServerChanges(serverChanges)
        // Refresh the shared reactive ref
        const { useEvents } = await import('~/composables/useEvents')
        const { events } = useEvents()
        events.value = updatedEvents
      }

      await setLastSyncedHeads(res.serverHeads)
      retries = 0
    } catch {
      retries++
    }
    scheduleNext()
  }

  function scheduleNext() {
    if (timer) clearTimeout(timer)
    const delay =
      retries > 0
        ? Math.min(RETRY_BASE_MS * 2 ** (retries - 1), 60_000)
        : SYNC_INTERVAL_MS
    timer = setTimeout(sync, delay)
  }

  // Kick on start
  sync()

  // Re-sync when coming back online
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
      retries = 0
      sync()
    })
  }
}
