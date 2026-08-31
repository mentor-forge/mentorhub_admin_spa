import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref, defineComponent, h } from 'vue'
import SettingsPage from './SettingsPage.vue'
import type { ProductSetting, DiscountSetting } from '@/api/types'

const mockRoute = {
  query: { tab: 'products' },
}
const mockRouter = {
  replace: vi.fn(),
}

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
  useRouter: () => mockRouter,
}))

const mockProductsData = ref<ProductSetting[]>([
  { _id: 'p1', type: 'Product', subscription: 'sub1', name: 'Product 1', status: 'active' },
])
const mockDiscountsData = ref<DiscountSetting[]>([
  { _id: 'd1', type: 'Discount', code: 'CODE1', name: 'Discount 1', status: 'active' },
])
const mockProductsLoading = ref(false)
const mockDiscountsLoading = ref(false)

const mockCreateMutateAsync = vi.fn()
const mockUpdateMutateAsync = vi.fn()
const mockArchiveMutateAsync = vi.fn()

vi.mock('@/composables/useSettings', () => ({
  useProductSettings: () => ({
    data: mockProductsData,
    isLoading: mockProductsLoading,
  }),
  useDiscountSettings: () => ({
    data: mockDiscountsData,
    isLoading: mockDiscountsLoading,
  }),
  useCreateSetting: () => ({
    mutateAsync: mockCreateMutateAsync,
  }),
  useUpdateSettingField: () => ({
    mutateAsync: mockUpdateMutateAsync,
  }),
  useArchiveSetting: () => ({
    mutateAsync: mockArchiveMutateAsync,
  }),
}))

const VContainerStub = defineComponent({
  name: 'VContainer',
  setup(_, { slots, attrs }) {
    return () => h('div', { class: 'v-container', ...attrs }, slots.default?.())
  },
})

const VTabsStub = defineComponent({
  name: 'VTabs',
  props: ['modelValue'],
  emits: ['update:modelValue'],
  setup(props, { slots, attrs }) {
    return () => h('div', { class: 'v-tabs', 'data-tab': props.modelValue, ...attrs }, slots.default?.())
  },
})

const VTabStub = defineComponent({
  name: 'VTab',
  props: ['value'],
  setup(props, { slots, attrs }) {
    return () => h('button', { class: 'v-tab', 'data-value': props.value, ...attrs }, slots.default?.())
  },
})

const VWindowStub = defineComponent({
  name: 'VWindow',
  props: ['modelValue'],
  setup(_, { slots, attrs }) {
    return () => h('div', { class: 'v-window', ...attrs }, slots.default?.())
  },
})

const VWindowItemStub = defineComponent({
  name: 'VWindowItem',
  props: ['value'],
  setup(props, { slots, attrs }) {
    return () => h('div', { class: 'v-window-item', 'data-value': props.value, ...attrs }, slots.default?.())
  },
})

const VSnackbarStub = defineComponent({
  name: 'VSnackbar',
  setup(_, { slots, attrs }) {
    return () => h('div', { class: 'v-snackbar', ...attrs }, slots.default?.())
  },
})

const SettingsTableEditorStub = defineComponent({
  name: 'SettingsTableEditor',
  props: [
    'rows',
    'columns',
    'automationIdPrefix',
    'addLabel',
    'isLoading',
    'errorMessage',
    'onAdd',
    'onSaveCell',
    'onDelete',
  ],
  setup(props) {
    return () =>
      h('div', { class: 'settings-table-editor-stub', 'data-prefix': props.automationIdPrefix }, [
        h(
          'button',
          {
            class: 'trigger-add',
            onClick: () => props.onAdd?.(),
          },
          props.addLabel
        ),
        h('button', {
          class: 'trigger-save',
          onClick: () => props.onSaveCell?.(props.rows?.[0], 'name', 'Updated Name'),
        }),
        h('button', {
          class: 'trigger-delete',
          onClick: () => props.onDelete?.(props.rows?.[0]),
        }),
      ])
  },
})

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRoute.query = { tab: 'products' }
    mockProductsLoading.value = false
    mockDiscountsLoading.value = false
  })

  function mountPage() {
    return mount(SettingsPage, {
      global: {
        stubs: {
          VContainer: VContainerStub,
          VTabs: VTabsStub,
          VTab: VTabStub,
          VWindow: VWindowStub,
          VWindowItem: VWindowItemStub,
          VSnackbar: VSnackbarStub,
          SettingsTableEditor: SettingsTableEditorStub,
        },
      },
    })
  }

  it('renders page root, tabs, and window containers with automation IDs', () => {
    const wrapper = mountPage()

    expect(wrapper.find('[data-automation-id="admin-settings-page"]').exists()).toBe(true)
    expect(wrapper.find('[data-automation-id="admin-settings-tabs"]').exists()).toBe(true)
    expect(wrapper.find('[data-automation-id="admin-settings-tab-products"]').exists()).toBe(true)
    expect(wrapper.find('[data-automation-id="admin-settings-tab-discounts"]').exists()).toBe(true)
    expect(wrapper.find('[data-automation-id="admin-settings-window-products"]').exists()).toBe(true)
    expect(wrapper.find('[data-automation-id="admin-settings-window-discounts"]').exists()).toBe(true)
  })

  it('initializes tab from route query tab=discounts', () => {
    mockRoute.query = { tab: 'discounts' }
    const wrapper = mountPage()

    const tabs = wrapper.findComponent(VTabsStub)
    expect(tabs.props('modelValue')).toBe('discounts')
  })

  it('updates route query when active tab is changed', async () => {
    const wrapper = mountPage()
    const tabs = wrapper.findComponent(VTabsStub)
    tabs.vm.$emit('update:modelValue', 'discounts')

    expect(mockRouter.replace).toHaveBeenCalledWith({
      query: { tab: 'discounts' },
    })
  })

  it('handles Add Product flow', async () => {
    mockCreateMutateAsync.mockResolvedValueOnce({ _id: 'p2', type: 'Product' })

    const wrapper = mountPage()
    const productsTable = wrapper.find('[data-prefix="admin-products"]')
    const addBtn = productsTable.find('.trigger-add')
    await addBtn.trigger('click')

    expect(mockCreateMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'Product',
        name: 'New Product',
        status: 'active',
      })
    )
  })

  it('handles Add Discount flow', async () => {
    mockCreateMutateAsync.mockResolvedValueOnce({ _id: 'd2', type: 'Discount' })

    const wrapper = mountPage()
    const discountsTable = wrapper.find('[data-prefix="admin-discounts"]')
    const addBtn = discountsTable.find('.trigger-add')
    await addBtn.trigger('click')

    expect(mockCreateMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'Discount',
        name: 'New Discount',
        status: 'active',
      })
    )
  })

  it('handles saving cell edits for Product and Discount', async () => {
    mockUpdateMutateAsync.mockResolvedValue(undefined)

    const wrapper = mountPage()
    const productsTable = wrapper.find('[data-prefix="admin-products"]')
    await productsTable.find('.trigger-save').trigger('click')

    expect(mockUpdateMutateAsync).toHaveBeenCalledWith({
      id: 'p1',
      update: { name: 'Updated Name' },
    })

    const discountsTable = wrapper.find('[data-prefix="admin-discounts"]')
    await discountsTable.find('.trigger-save').trigger('click')

    expect(mockUpdateMutateAsync).toHaveBeenCalledWith({
      id: 'd1',
      update: { name: 'Updated Name' },
    })
  })

  it('handles deleting (archiving) a Setting', async () => {
    mockArchiveMutateAsync.mockResolvedValue(undefined)

    const wrapper = mountPage()
    const productsTable = wrapper.find('[data-prefix="admin-products"]')
    await productsTable.find('.trigger-delete').trigger('click')

    expect(mockArchiveMutateAsync).toHaveBeenCalledWith(mockProductsData.value[0])
  })

  it('catches and displays error when adding product fails', async () => {
    mockCreateMutateAsync.mockRejectedValueOnce(new Error('Duplicate product key'))

    const wrapper = mountPage()
    const productsTable = wrapper.find('[data-prefix="admin-products"]')
    await productsTable.find('.trigger-add').trigger('click')

    expect(wrapper.text()).toContain('Duplicate product key')
  })
})
