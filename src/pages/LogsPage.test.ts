import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref, defineComponent, h } from 'vue'
import LogsPage from './LogsPage.vue'
import type { ExternalEvent } from '@/api/types'

const mockRoute = {
  query: {} as Record<string, string | undefined>,
}
const mockRouter = {
  replace: vi.fn(),
}

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
  useRouter: () => mockRouter,
}))

const mockData = ref<ExternalEvent[]>([])
const mockIsLoading = ref(false)
const mockError = ref<Error | null>(null)
const mockRefetch = vi.fn()

vi.mock('@/composables/useExternalEvents', () => ({
  useExternalEvents: () => ({
    data: mockData,
    isLoading: mockIsLoading,
    error: mockError,
    refetch: mockRefetch,
  }),
}))

const VContainerStub = defineComponent({
  name: 'VContainer',
  setup(_, { slots, attrs }) {
    return () => h('div', { class: 'v-container', ...attrs }, slots.default?.())
  },
})

const VSelectStub = defineComponent({
  name: 'VSelect',
  props: ['modelValue', 'items'],
  emits: ['update:modelValue'],
  setup(props, { attrs }) {
    return () =>
      h(
        'select',
        {
          ...attrs,
          value: props.modelValue,
          onChange: (e: any) => props.modelValue,
        },
        props.items?.map((item: any) =>
          h('option', { value: item.value || item }, item.title || item)
        )
      )
  },
})

const VBtnStub = defineComponent({
  name: 'VBtn',
  props: ['disabled', 'loading', 'icon'],
  setup(_, { slots, attrs }) {
    return () => h('button', attrs, slots.default?.())
  },
})

const VAlertStub = defineComponent({
  name: 'VAlert',
  setup(_, { slots, attrs }) {
    return () => h('div', { class: 'v-alert', ...attrs }, slots.default?.())
  },
})

const VProgressLinearStub = defineComponent({
  name: 'VProgressLinear',
  setup(_, { attrs }) {
    return () => h('div', { class: 'v-progress-linear', ...attrs })
  },
})

const VTableStub = defineComponent({
  name: 'VTable',
  setup(_, { slots, attrs }) {
    return () => h('table', attrs, slots.default?.())
  },
})

const VChipStub = defineComponent({
  name: 'VChip',
  setup(_, { slots, attrs }) {
    return () => h('span', { class: 'v-chip', ...attrs }, slots.default?.())
  },
})

describe('LogsPage', () => {
  const sampleEvents: ExternalEvent[] = [
    {
      _id: 'e1',
      source: 'stripe',
      external_id: 'evt_123',
      payload_hash: 'hash_abc',
      normalized_body: { customer_id: 'cus_1', amount: 5000 },
      created: {
        at_time: '2026-08-28T12:00:00Z',
        by_user: 'webhook-service',
        correlation_id: 'corr-123',
      },
    },
    {
      _id: 'e2',
      source: 'cognito',
      external_id: 'sub_456',
      payload_hash: 'hash_def',
      normalized_body: { user_id: 'usr_2' },
      created: {
        at_time: '2026-08-28T11:00:00Z',
        by_user: 'auth-service',
      },
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    mockRoute.query = {}
    mockData.value = [...sampleEvents]
    mockIsLoading.value = false
    mockError.value = null
  })

  function mountPage() {
    return mount(LogsPage, {
      global: {
        stubs: {
          VContainer: VContainerStub,
          VSelect: VSelectStub,
          VBtn: VBtnStub,
          VAlert: VAlertStub,
          VProgressLinear: VProgressLinearStub,
          VTable: VTableStub,
          VChip: VChipStub,
        },
      },
    })
  }

  it('renders table root, columns, and rows with automation IDs', () => {
    const wrapper = mountPage()

    expect(wrapper.find('[data-automation-id="admin-logs-page"]').exists()).toBe(true)
    expect(wrapper.find('[data-automation-id="admin-logs-source-select"]').exists()).toBe(true)
    expect(wrapper.find('[data-automation-id="admin-logs-refresh-button"]').exists()).toBe(true)
    expect(wrapper.find('[data-automation-id="admin-logs-table"]').exists()).toBe(true)

    const rows = wrapper.findAll('[data-automation-id="admin-logs-row"]')
    expect(rows.length).toBe(2)

    expect(wrapper.find('[data-automation-id="admin-logs-time-display"]').exists()).toBe(true)
    expect(wrapper.find('[data-automation-id="admin-logs-source-display"]').text()).toBe('stripe')
    expect(wrapper.find('[data-automation-id="admin-logs-external-id-display"]').text()).toContain('evt_123')
    expect(wrapper.find('[data-automation-id="admin-logs-user-display"]').text()).toContain('webhook-service')
  })

  it('initializes source filter from route query ?source=stripe', () => {
    mockRoute.query = { source: 'stripe' }
    const wrapper = mountPage()

    const select = wrapper.findComponent(VSelectStub)
    expect(select.props('modelValue')).toBe('stripe')
  })

  it('updates route query when source filter is modified', () => {
    const wrapper = mountPage()
    const select = wrapper.findComponent(VSelectStub)

    select.vm.$emit('update:modelValue', 'cognito')
    expect(mockRouter.replace).toHaveBeenCalledWith({
      query: { source: 'cognito' },
    })

    select.vm.$emit('update:modelValue', 'all')
    expect(mockRouter.replace).toHaveBeenCalledWith({
      query: {},
    })
  })

  it('toggles detail display showing formatted payload, hash, and correlation ID', async () => {
    const wrapper = mountPage()

    expect(wrapper.find('[data-automation-id="admin-logs-detail-display"]').exists()).toBe(false)

    // Click toggle button on first row
    const toggleBtn = wrapper.find('[data-automation-id="admin-logs-detail-toggle"]')
    await toggleBtn.trigger('click')

    const detail = wrapper.find('[data-automation-id="admin-logs-detail-display"]')
    expect(detail.exists()).toBe(true)
    expect(detail.text()).toContain('hash_abc')
    expect(detail.text()).toContain('corr-123')
    expect(detail.text()).toContain('cus_1')

    // Click again to collapse
    await toggleBtn.trigger('click')
    expect(wrapper.find('[data-automation-id="admin-logs-detail-display"]').exists()).toBe(false)
  })

  it('calls refetch when Refresh button is clicked', async () => {
    const wrapper = mountPage()
    const refreshBtn = wrapper.find('[data-automation-id="admin-logs-refresh-button"]')
    await refreshBtn.trigger('click')

    expect(mockRefetch).toHaveBeenCalledOnce()
  })

  it('renders empty state when no events and not loading', () => {
    mockData.value = []
    const wrapper = mountPage()

    expect(wrapper.find('[data-automation-id="admin-logs-empty"]').exists()).toBe(true)
    expect(wrapper.find('[data-automation-id="admin-logs-empty"]').text()).toContain('No external events found')
  })

  it('renders error alert when error occurs', () => {
    mockError.value = new Error('Database connection failed')
    const wrapper = mountPage()

    const alert = wrapper.find('[data-automation-id="admin-logs-error"]')
    expect(alert.exists()).toBe(true)
    expect(alert.text()).toContain('Database connection failed')
  })

  it('renders load more button when page has 20 items and clicking it appends next page', async () => {
    // Generate 20 items
    const twentyEvents: ExternalEvent[] = Array.from({ length: 20 }, (_, i) => ({
      _id: `e-${i}`,
      source: 'stripe',
      external_id: `evt-${i}`,
    }))
    mockData.value = twentyEvents

    const wrapper = mountPage()
    const loadMoreBtn = wrapper.find('[data-automation-id="admin-logs-load-more-button"]')
    expect(loadMoreBtn.exists()).toBe(true)

    await loadMoreBtn.trigger('click')

    // Simulate next 5 items returned
    const nextFiveEvents: ExternalEvent[] = Array.from({ length: 5 }, (_, i) => ({
      _id: `e-next-${i}`,
      source: 'stripe',
      external_id: `evt-next-${i}`,
    }))
    mockData.value = nextFiveEvents
    await wrapper.vm.$nextTick()

    const rows = wrapper.findAll('[data-automation-id="admin-logs-row"]')
    expect(rows.length).toBe(25)
  })
})
