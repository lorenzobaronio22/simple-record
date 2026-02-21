import { ref, onMounted } from 'vue'
import { useNuxtApp } from '#app'
import { v4 as uuidv4 } from 'uuid'
import { events as eventsSchema } from '~/db/schema'

interface Event {
  id: string
  timestamp: Date
}

export const useEvents = () => {
  const { $db } = useNuxtApp()
  const events = ref<Event[]>([])
  const loading = ref(false)
  const error = ref<Error | null>(null)

  const validateTimestamp = (timestamp: Date): boolean => {
    // Prevent future timestamps
    return timestamp.getTime() <= Date.now()
  }

  const fetchEvents = async () => {
    loading.value = true
    error.value = null
    try {
      events.value = await $db.query.events.findMany({
        orderBy: (events, { desc }) => [desc(events.timestamp)],
      })
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Failed to fetch events')
      error.value = errorObj
      throw errorObj
    } finally {
      loading.value = false
    }
  }

  const addEvent = async () => {
    const now = new Date()

    if (!validateTimestamp(now)) {
      const err = new Error('Cannot record events with future timestamps')
      error.value = err
      throw err
    }

    loading.value = true
    error.value = null
    try {
      const newEvent = {
        id: uuidv4(),
        timestamp: now,
      }
      await $db.insert(eventsSchema).values(newEvent)
      await fetchEvents()
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Failed to record event')
      error.value = errorObj
      throw errorObj
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    fetchEvents().catch(() => {
      // Error is stored in error.value, silently fail on mount
    })
  })

  return { events, addEvent, fetchEvents, loading, error }
}
