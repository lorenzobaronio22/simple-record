/**
 * A single recorded event inside the Automerge document.
 *
 * `hlc` is the lexicographically-sortable Hybrid Logical Clock string that
 * doubles as the unique key inside the Automerge map.
 */
export interface EventRecord {
  /** Hybrid Logical Clock – lexicographically sortable, globally unique. */
  hlc: string
  /** Wall-clock milliseconds since epoch (kept for display compatibility). */
  timestamp: number
  /** Owner of this record (maps to OIDC `sub` later). */
  userId: string
  /** Originating device / browser profile. */
  deviceId: string
}

/**
 * Shape of the root Automerge document shared between client and server.
 *
 * Events are stored in a map keyed by `hlc` so that concurrent inserts from
 * different devices never collide (HLC is globally unique).
 */
export interface EventsDoc {
  /** Map from HLC string → EventRecord */
  events: Record<string, EventRecord>
}
