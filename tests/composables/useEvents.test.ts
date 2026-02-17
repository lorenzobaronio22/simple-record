import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useEvents } from '../../composables/useEvents'

const mockDb = {
  query: {
    events: {
      findMany: vi.fn(),
    },
  },
  insert: vi.fn(() => mockDb),
  values: vi.fn(),
}

vi.mock('#app', () => ({
  useNuxtApp: () => ({ $db: mockDb }),
}))

vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')
  return {
    ...actual,
    onMounted: vi.fn(),
  }
})

describe('useEvents', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should add and fetch events', async () => {
    const { addEvent, fetchEvents, events } = useEvents()

    // Mock the data for the fetch
    const mockEvents = [{ id: '1', timestamp: new Date() }]
    mockDb.query.events.findMany.mockResolvedValue(mockEvents)

    // Fetch events
    await fetchEvents()
    expect(mockDb.query.events.findMany).toHaveBeenCalled()
    expect(events.value).toEqual(mockEvents)

    // Add event
    await addEvent()
    expect(mockDb.insert).toHaveBeenCalled()
    expect(mockDb.values).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.any(String),
        timestamp: expect.any(Date),
      })
    )
  })
})
