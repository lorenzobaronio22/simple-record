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
    mockDb.query.events.findMany.mockResolvedValue([])
    mockDb.insert.mockReturnValue(mockDb)
    mockDb.values.mockResolvedValue(undefined)
  })

  it('should add and fetch events', async () => {
    const { addEvent, fetchEvents, events } = useEvents()

    // Mock the data for the fetch
    const mockEvents = [
      {
        id: '1',
        timestamp: new Date('2026-02-21T10:00:00Z'),
      },
    ]
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

  it('should handle fetch errors gracefully', async () => {
    const { fetchEvents, error, loading } = useEvents()

    const testError = new Error('Database connection failed')
    mockDb.query.events.findMany.mockRejectedValueOnce(testError)

    try {
      await fetchEvents()
    } catch (err) {
      // Expected to throw
    }

    expect(error.value).not.toBeNull()
    expect(error.value?.message).toBe('Database connection failed')
    expect(loading.value).toBe(false)
  })

  it('should handle add event errors gracefully', async () => {
    const { addEvent, error, loading } = useEvents()

    const testError = new Error('Failed to insert event')
    mockDb.insert.mockImplementationOnce(() => {
      throw testError
    })

    try {
      await addEvent()
    } catch (err) {
      // Expected to throw
    }

    expect(error.value).not.toBeNull()
    expect(error.value?.message).toBe('Failed to insert event')
    expect(loading.value).toBe(false)
  })

  it('should update loading state during fetch', async () => {
    const { fetchEvents, loading } = useEvents()

    mockDb.query.events.findMany.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve([]), 100)
        })
    )

    const fetchPromise = fetchEvents()
    expect(loading.value).toBe(true)

    await fetchPromise
    expect(loading.value).toBe(false)
  })

  it('should update loading state during add event', async () => {
    const { addEvent, loading } = useEvents()

    mockDb.values.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve(undefined), 100)
        })
    )

    const addPromise = addEvent()
    expect(loading.value).toBe(true)

    await addPromise
    expect(loading.value).toBe(false)
  })

  it('should reject future timestamps', async () => {
    const { addEvent, error } = useEvents()

    // Mock current time
    const originalNow = Date.now
    Date.now = vi.fn(() => new Date('2026-02-21T10:00:00Z').getTime())

    try {
      await addEvent()
    } catch (err) {
      expect(error.value).not.toBeNull()
      expect(error.value?.message).toMatch(/future timestamps/)
    }

    Date.now = originalNow
  })

  it('should clear error on successful fetch', async () => {
    const { fetchEvents, error } = useEvents()

    // First, set an error
    mockDb.query.events.findMany.mockRejectedValueOnce(new Error('Test error'))
    try {
      await fetchEvents()
    } catch {
      // Expected
    }
    expect(error.value).not.toBeNull()

    // Then, successful fetch should clear the error
    mockDb.query.events.findMany.mockResolvedValueOnce([])
    await fetchEvents()
    expect(error.value).toBeNull()
  })

  it('should clear error on successful add event', async () => {
    const { addEvent, error } = useEvents()

    // First, set an error by failing insert
    mockDb.insert.mockImplementationOnce(() => {
      throw new Error('Insert failed')
    })
    try {
      await addEvent()
    } catch {
      // Expected
    }
    expect(error.value).not.toBeNull()

    // Then, successful add should clear the error
    mockDb.insert.mockReturnValueOnce(mockDb)
    mockDb.values.mockResolvedValueOnce(undefined)
    mockDb.query.events.findMany.mockResolvedValueOnce([])
    await addEvent()
    expect(error.value).toBeNull()
  })
})
