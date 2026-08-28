import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { api } from '@/api/client'
import type { ExternalEvent, ExternalEventSource } from '@/api/types'

export interface UseExternalEventsOptions {
  source?: MaybeRefOrGetter<string | undefined>
  offset?: MaybeRefOrGetter<number | undefined>
  size?: MaybeRefOrGetter<number | undefined>
}

export function useExternalEvents(options: UseExternalEventsOptions = {}) {
  const sourceFilter = computed(() => {
    const raw = toValue(options.source)
    if (!raw || raw === 'all') return undefined
    return raw as ExternalEventSource
  })

  const offsetVal = computed(() => toValue(options.offset))
  const sizeVal = computed(() => toValue(options.size))

  return useQuery<ExternalEvent[], Error>({
    queryKey: computed(() => [
      'external-events',
      {
        source: sourceFilter.value ?? 'all',
        offset: offsetVal.value ?? 0,
        size: sizeVal.value ?? 20,
      },
    ]),
    queryFn: () =>
      api.listExternalEvents({
        source: sourceFilter.value,
        sortBy: 'created.at_time',
        order: 'desc',
        offset: offsetVal.value,
        size: sizeVal.value,
      }),
  })
}
