import { ref, onMounted } from 'vue'
import Dexie from 'dexie'

interface Event {
  timestamp: number
}

class EventsDB extends Dexie {
  events: Dexie.Table<Event, number>

  constructor() {
    super('EventsDB')
    this.version(1).stores({
      events: 'timestamp',
    })
    this.events = this.table('events')
  }
}

const db = new EventsDB()
const events = ref<Event[]>([])

export function useEvents() {
  const fetchEvents = async () => {
    const allEvents = await db.events.orderBy('timestamp').reverse().toArray()
    events.value = allEvents
  }

  const addEvent = async (event: Event) => {
    await db.events.add(event)
    await fetchEvents()
  }

  onMounted(fetchEvents)

  return {
    events,
    addEvent,
    fetchEvents,
  }
}
