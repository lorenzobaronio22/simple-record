import { ref, onMounted } from 'vue'
import type { EventRecord } from '~/shared/types'

/**
 * Façade that keeps the public API identical to the original useEvents():
 *   { events, addEvent, fetchEvents }
 *
 * Internally delegates to the client-only eventsStore (Automerge + Dexie).
 * During SSR the composable returns inert stubs — real data loads on mount.
 */

const events = ref<EventRecord[]>([])

export function useEvents() {
  const fetchEvents = async () => {
    if (!import.meta.client) return
    const { readAllEvents } = await import('~/composables/eventsStore.client')
    events.value = await readAllEvents()
  }

  /**
   * Callers keep passing `{ timestamp }` (see pages/index.vue).
   * We transparently attach userId, deviceId and generate the HLC.
   */
  const addEvent = async (event: { timestamp: number }) => {
    if (!import.meta.client) return
    const { addEventRecord } = await import('~/composables/eventsStore.client')
    const { useUserId } = await import('~/composables/useUserId')
    const nuxtApp = useNuxtApp()
    const userId = useUserId()
    const deviceId: string = (nuxtApp.$deviceId as string) ?? 'unknown'
    events.value = await addEventRecord(event.timestamp, userId, deviceId)
  }

  onMounted(fetchEvents)

  return {
    events,
    addEvent,
    fetchEvents,
  }
}
