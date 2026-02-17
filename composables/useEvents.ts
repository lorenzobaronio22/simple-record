import { ref, onMounted } from 'vue'
import { useNuxtApp } from '#app'
import { v4 as uuidv4 } from 'uuid'
import { events as eventsSchema } from '~/db/schema'

export const useEvents = () => {
  const { $db } = useNuxtApp()
  const events = ref<any[]>([])

  const fetchEvents = async () => {
    events.value = await $db.query.events.findMany({
      orderBy: (events, { desc }) => [desc(events.timestamp)],
    })
  }

  const addEvent = async () => {
    const newEvent = {
      id: uuidv4(),
      timestamp: new Date(),
    }
    await $db.insert(eventsSchema).values(newEvent)
    await fetchEvents()
  }

  onMounted(fetchEvents)

  return { events, addEvent, fetchEvents }
}
