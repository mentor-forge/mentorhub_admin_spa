import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'
import { useExternalEvents } from './useExternalEvents'
import { api } from '@/api/client'
import type { ExternalEvent } from '@/api/types'

const mockUseQuery = vi.fn()

vi.mock('@/api/client', () => ({
  api: {
    listExternalEvents: vi.fn(),
  },
}))

vi.mock('@tanstack/vue-query', () => ({
  useQuery: vi.fn((opts) => mockUseQuery(opts)),
}))

describe('useExternalEvents composable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const sampleEvents: ExternalEvent[] = [
    {
      _id: 'e1',
      source: 'stripe',
      external_id: 'evt_1',
      payload_hash: 'hash_1',
      created: { at_time: '2026-08-28T12:00:00Z' },
    },
  ]

  it('configures query with defaults when no options passed', async () => {
    let capturedOptions: any
    mockUseQuery.mockImplementationOnce((options) => {
      capturedOptions = options
      return { data: sampleEvents, isLoading: false }
    })

    useExternalEvents()
    expect(mockUseQuery).toHaveBeenCalled()

    const key = capturedOptions.queryKey.value
    expect(key).toEqual([
      'external-events',
      {
        source: 'all',
        offset: 0,
        size: 20,
      },
    ])

    // Test queryFn
    vi.mocked(api.listExternalEvents).mockResolvedValueOnce(sampleEvents)
    const res = await capturedOptions.queryFn()
    expect(res).toEqual(sampleEvents)
    expect(api.listExternalEvents).toHaveBeenCalledWith({
      source: undefined,
      sortBy: 'created.at_time',
      order: 'desc',
      offset: undefined,
      size: undefined,
    })
  })

  it('handles reactive source filter and custom pagination', async () => {
    let capturedOptions: any
    mockUseQuery.mockImplementationOnce((options) => {
      capturedOptions = options
      return { data: sampleEvents, isLoading: false }
    })

    const source = ref('stripe')
    const offset = ref(40)
    const size = ref(100)

    useExternalEvents({ source, offset, size })

    const key = capturedOptions.queryKey.value
    expect(key).toEqual([
      'external-events',
      {
        source: 'stripe',
        offset: 40,
        size: 100,
      },
    ])

    vi.mocked(api.listExternalEvents).mockResolvedValueOnce(sampleEvents)
    await capturedOptions.queryFn()
    expect(api.listExternalEvents).toHaveBeenCalledWith({
      source: 'stripe',
      sortBy: 'created.at_time',
      order: 'desc',
      offset: 40,
      size: 100,
    })
  })
})
