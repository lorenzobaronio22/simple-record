import { describe, it, expect, beforeEach } from 'vitest';
import { useEvents } from '~/composables/useEvents';
import Dexie from 'dexie';
import 'fake-indexeddb/auto';

describe('useEvents', () => {
  beforeEach(async () => {
    // Reset the database before each test
    const db = new Dexie('EventsDB');
    db.version(1).stores({ events: 'timestamp' });
    await db.delete();
  });

  it('adds an event and fetches events', async () => {
    const { addEvent, events, fetchEvents } = useEvents();

    // The initial state is empty
    await fetchEvents();
    expect(events.value.length).toBe(0);

    // Add an event
    const newEvent = { timestamp: Date.now() };
    await addEvent(newEvent);

    // The state is updated
    expect(events.value.length).toBe(1);
    expect(events.value[0]).toEqual(newEvent);
  });

  it('fetches events in descending order of timestamp', async () => {
    const { addEvent, events, fetchEvents } = useEvents();

    const event1 = { timestamp: Date.now() };
    const event2 = { timestamp: Date.now() + 1000 };

    await addEvent(event1);
    await addEvent(event2);
    await fetchEvents();

    expect(events.value.length).toBe(2);
    expect(events.value[0].timestamp).toBe(event2.timestamp);
    expect(events.value[1].timestamp).toBe(event1.timestamp);
  });
});
