<template>
  <v-container fluid data-automation-id="admin-logs-page">
    <div class="d-flex justify-space-between align-center mb-4 flex-wrap ga-4">
      <h1 class="text-h4 font-weight-bold">Logs</h1>

      <div class="d-flex align-center ga-3">
        <v-select
          v-model="selectedSource"
          :items="sourceOptions"
          item-title="title"
          item-value="value"
          label="Source"
          density="compact"
          variant="outlined"
          hide-details
          style="width: 160px;"
          data-automation-id="admin-logs-source-select"
        />

        <v-btn
          variant="outlined"
          prepend-icon="mdi-refresh"
          data-automation-id="admin-logs-refresh-button"
          :loading="isLoading"
          @click="handleRefresh"
        >
          Refresh
        </v-btn>
      </div>
    </div>

    <v-alert
      v-if="errorMessage"
      type="error"
      variant="tonal"
      class="mb-4"
      data-automation-id="admin-logs-error"
    >
      {{ errorMessage }}
    </v-alert>

    <v-progress-linear v-if="isLoading" indeterminate color="primary" class="mb-2" />

    <div class="table-responsive">
      <v-table density="compact" class="elevation-1" data-automation-id="admin-logs-table">
        <thead>
          <tr>
            <th class="text-left font-weight-bold" style="min-width: 180px;">Received At</th>
            <th class="text-left font-weight-bold" style="width: 120px;">Source</th>
            <th class="text-left font-weight-bold">External ID</th>
            <th class="text-left font-weight-bold" style="width: 160px;">Recorded By</th>
            <th class="text-right font-weight-bold" style="width: 80px;">Details</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!isLoading && displayedEvents.length === 0">
            <td
              colspan="5"
              class="text-center py-6 text-medium-emphasis"
              data-automation-id="admin-logs-empty"
            >
              No external events found.
            </td>
          </tr>
          <template
            v-for="(event, index) in displayedEvents"
            :key="event._id || event.external_id || index"
          >
            <tr data-automation-id="admin-logs-row">
              <td data-automation-id="admin-logs-time-display">
                {{ formatEventDate(event.created?.at_time) }}
              </td>
              <td>
                <v-chip
                  size="small"
                  :color="event.source === 'stripe' ? 'deep-purple-darken-1' : 'blue-darken-1'"
                  label
                  data-automation-id="admin-logs-source-display"
                >
                  {{ event.source }}
                </v-chip>
              </td>
              <td class="text-truncate font-mono" style="max-width: 250px;" data-automation-id="admin-logs-external-id-display">
                {{ event.external_id || '—' }}
              </td>
              <td class="text-truncate" style="max-width: 160px;" data-automation-id="admin-logs-user-display">
                {{ event.created?.by_user || 'system' }}
              </td>
              <td class="text-right">
                <v-btn
                  :icon="isExpanded(event._id || String(index)) ? 'mdi-chevron-up' : 'mdi-chevron-down'"
                  size="small"
                  variant="text"
                  aria-label="Toggle details"
                  data-automation-id="admin-logs-detail-toggle"
                  @click="toggleExpand(event._id || String(index))"
                />
              </td>
            </tr>
            <tr
              v-if="isExpanded(event._id || String(index))"
              class="bg-grey-lighten-4"
            >
              <td colspan="5" class="pa-4" data-automation-id="admin-logs-detail-display">
                <div class="d-flex flex-column ga-2">
                  <div v-if="event.payload_hash" class="text-caption font-mono text-medium-emphasis text-truncate">
                    <strong>Payload Hash:</strong> {{ event.payload_hash }}
                  </div>
                  <div v-if="event.created?.correlation_id" class="text-caption font-mono text-medium-emphasis text-truncate">
                    <strong>Correlation ID:</strong> {{ event.created.correlation_id }}
                  </div>
                  <div>
                    <strong class="text-caption">Normalized Payload:</strong>
                    <pre class="json-code mt-1">{{ formatJson(event.normalized_body) }}</pre>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </v-table>
    </div>

    <div v-if="hasMore" class="d-flex justify-center mt-4">
      <v-btn
        variant="tonal"
        color="primary"
        :loading="isLoading"
        data-automation-id="admin-logs-load-more-button"
        @click="loadMore"
      >
        Load More
      </v-btn>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { formatDate } from '@mentor-forge/mentorhub_spa_utils'
import { useExternalEvents } from '@/composables/useExternalEvents'
import type { ExternalEvent } from '@/api/types'

const route = useRoute()
const router = useRouter()

const sourceOptions = [
  { title: 'All', value: 'all' },
  { title: 'Cognito', value: 'cognito' },
  { title: 'Stripe', value: 'stripe' },
]

const selectedSource = computed({
  get() {
    const s = route.query.source as string
    return s === 'cognito' || s === 'stripe' ? s : 'all'
  },
  set(val: string) {
    const query = { ...route.query }
    if (val === 'all') {
      delete query.source
    } else {
      query.source = val
    }
    router.replace({ query })
  },
})

const offset = ref(0)
const pageSize = 20
const accumulatedEvents = ref<ExternalEvent[]>([])
const expandedRows = ref<Set<string>>(new Set())

const { data, isLoading, error, refetch } = useExternalEvents({
  source: selectedSource,
  offset,
  size: pageSize,
})

watch(selectedSource, () => {
  offset.value = 0
  accumulatedEvents.value = []
  expandedRows.value.clear()
})

watch(data, (newEvents) => {
  if (!newEvents) return
  if (offset.value === 0) {
    accumulatedEvents.value = newEvents
  } else {
    // Append unique events
    const existingIds = new Set(accumulatedEvents.value.map((e, idx) => e._id || `${e.external_id}-${idx}`))
    const additional = newEvents.filter((e, idx) => !existingIds.has(e._id || `${e.external_id}-${idx}`))
    accumulatedEvents.value = [...accumulatedEvents.value, ...additional]
  }
}, { immediate: true })

const displayedEvents = computed(() => accumulatedEvents.value)
const hasMore = computed(() => (data.value?.length ?? 0) >= pageSize)

const errorMessage = computed(() => {
  if (!error.value) return null
  return error.value.message || 'Failed to load external event logs'
})

function formatEventDate(val?: string): string {
  if (!val) return '—'
  try {
    return formatDate(val)
  } catch {
    return val
  }
}

function formatJson(val?: unknown): string {
  if (!val) return '{}'
  return JSON.stringify(val, null, 2)
}

function isExpanded(id: string): boolean {
  return expandedRows.value.has(id)
}

function toggleExpand(id: string) {
  if (expandedRows.value.has(id)) {
    expandedRows.value.delete(id)
  } else {
    expandedRows.value.add(id)
  }
}

async function handleRefresh() {
  offset.value = 0
  await refetch()
}

function loadMore() {
  offset.value += pageSize
}
</script>

<style scoped>
.table-responsive {
  overflow-x: auto;
}

.font-mono {
  font-family: monospace;
}

.json-code {
  max-height: 240px;
  overflow: auto;
  background: #f5f5f5;
  border-radius: 4px;
  padding: 8px 12px;
  font-family: monospace;
  font-size: 0.85rem;
  line-height: 1.4;
}
</style>
