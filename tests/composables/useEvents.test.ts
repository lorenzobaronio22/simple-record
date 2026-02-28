import { describe, it, expect, beforeEach, vi } from 'vitest'
import 'fake-indexeddb/auto'
import {
  addEventRecord,
  readAllEvents,
  resetDB,
} from '~/composables/eventsStore.client'

const TEST_USER = 'test-user'
const TEST_DEVICE = 'test-device-1'

describe('eventsStore', () => {
  beforeEach(async () => {
    await resetDB()
  })

  it('adds an event and reads events', async () => {
    const events = await readAllEvents()
    expect(events.length).toBe(0)

    const ts = Date.now()
    const updated = await addEventRecord(ts, TEST_USER, TEST_DEVICE)

    expect(updated.length).toBe(1)
    expect(updated[0].timestamp).toBe(ts)
    expect(updated[0].userId).toBe(TEST_USER)
    expect(updated[0].deviceId).toBe(TEST_DEVICE)
    expect(typeof updated[0].hlc).toBe('string')
  })

  it('orders events by hlc descending', async () => {
    const ts1 = Date.now()
    const ts2 = ts1 + 1000
    await addEventRecord(ts1, TEST_USER, TEST_DEVICE)
    const updated = await addEventRecord(ts2, TEST_USER, TEST_DEVICE)

    expect(updated.length).toBe(2)
    // Most recent first
    expect(updated[0].timestamp).toBe(ts2)
    expect(updated[1].timestamp).toBe(ts1)
    // hlc ordering matches
    expect(updated[0].hlc > updated[1].hlc).toBe(true)
  })

  it('includes userId and deviceId in every record', async () => {
    await addEventRecord(Date.now(), 'alice', 'phone-1')
    await addEventRecord(Date.now() + 1, 'alice', 'phone-1')
    const all = await readAllEvents()

    for (const e of all) {
      expect(e.userId).toBe('alice')
      expect(e.deviceId).toBe('phone-1')
    }
  })
})
