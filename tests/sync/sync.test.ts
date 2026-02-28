import { describe, it, expect } from 'vitest'
import 'fake-indexeddb/auto'
import * as Automerge from '@automerge/automerge'
import type { EventsDoc } from '~/shared/types'
import { nextHlc } from '~/shared/hlc'

/**
 * Simulate two devices producing divergent docs and merging them
 * (the core of what the /api/sync handler does).
 */
describe('sync: two-device merge', () => {
  /** Create a fresh doc and round-trip through save/load for a clean root. */
  function createDoc(): Automerge.Doc<EventsDoc> {
    const d = Automerge.from<EventsDoc>({ events: {} })
    return Automerge.load<EventsDoc>(Automerge.save(d) as Automerge.BinaryDocument)
  }

  /** Fork a doc via save/load to guarantee independent document roots. */
  function fork(doc: Automerge.Doc<EventsDoc>): Automerge.Doc<EventsDoc> {
    return Automerge.load<EventsDoc>(Automerge.save(doc) as Automerge.BinaryDocument)
  }

  function addToDoc(
    doc: Automerge.Doc<EventsDoc>,
    ts: number,
    userId: string,
    deviceId: string,
    lastHlc: string
  ): { doc: Automerge.Doc<EventsDoc>; hlc: string } {
    const { hlc } = nextHlc({ nowMs: ts, lastHlc, nodeId: deviceId })
    const updated = Automerge.change(doc, (d) => {
      d.events[hlc] = { hlc, timestamp: ts, userId, deviceId }
    })
    return { doc: updated, hlc }
  }

  it('merges events from two devices without data loss', () => {
    // Common ancestor
    const origin = createDoc()

    // Device A forks and creates an event
    let docA = fork(origin)
    const a1 = addToDoc(docA, 1000, 'user1', 'device-A', '')
    docA = a1.doc

    // Device B forks and creates a different event
    let docB = fork(origin)
    const b1 = addToDoc(docB, 1001, 'user1', 'device-B', '')
    docB = b1.doc

    // Simulate server: merge both forks using Automerge.merge
    const merged = Automerge.merge(fork(docA), docB)

    const allEvents = Object.values(merged.events)
    expect(allEvents.length).toBe(2)

    const deviceIds = allEvents.map((e) => e.deviceId).sort()
    expect(deviceIds).toEqual(['device-A', 'device-B'])
  })

  it('change-based round-trip preserves data', () => {
    const origin = createDoc()

    // Device A
    let docA = fork(origin)
    const a1 = addToDoc(docA, 1000, 'user1', 'A', '')
    docA = a1.doc
    const a2 = addToDoc(docA, 2000, 'user1', 'A', a1.hlc)
    docA = a2.doc

    // Server receives A's doc entirely (simulating first-sync with getAllChanges)
    let server = fork(origin)
    const allA = Automerge.getAllChanges(docA)
    ;[server] = Automerge.applyChanges(server, allA)

    // After merging, server should have same events as A
    expect(Object.values(server.events).length).toBe(2)

    // Another device B syncs an event
    let docB = fork(origin)
    const b1 = addToDoc(docB, 1500, 'user1', 'B', '')
    docB = b1.doc
    const allB = Automerge.getAllChanges(docB)
    ;[server] = Automerge.applyChanges(server, allB)

    // Server now has 3 events
    expect(Object.values(server.events).length).toBe(3)

    // A merges with server to get B's event
    const merged = Automerge.merge(fork(docA), server)
    expect(Object.values(merged.events).length).toBe(3)

    // Verify all devices represented
    const deviceIds = Object.values(merged.events)
      .map((e) => e.deviceId)
      .sort()
    expect(deviceIds).toEqual(['A', 'A', 'B'])
  })
})
