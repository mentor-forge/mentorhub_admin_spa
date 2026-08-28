import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import SettingsTableEditor from './SettingsTableEditor.vue'
import type { SettingsTableColumn } from './settingsTable'

const VBtnStub = defineComponent({
  name: 'VBtn',
  props: {
    disabled: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
    icon: { type: [Boolean, String], default: false },
  },
  setup(props, { slots, attrs }) {
    return () =>
      h(
        'button',
        {
          ...attrs,
          disabled: props.disabled,
          'data-loading': props.loading,
        },
        slots.default?.()
      )
  },
})

const VTableStub = defineComponent({
  name: 'VTable',
  setup(_, { slots, attrs }) {
    return () => h('table', attrs, slots.default?.())
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
    return () => h('div', { ...attrs, class: ['v-progress-linear', attrs.class] })
  },
})

const VDialogStub = defineComponent({
  name: 'VDialog',
  props: {
    modelValue: { type: Boolean, default: false },
  },
  setup(props, { slots }) {
    return () => (props.modelValue ? h('div', { class: 'v-dialog' }, slots.default?.()) : null)
  },
})

const VCardStub = defineComponent({
  name: 'VCard',
  setup(_, { slots }) {
    return () => h('div', { class: 'v-card' }, slots.default?.())
  },
})

const VCardTitleStub = defineComponent({
  name: 'VCardTitle',
  setup(_, { slots }) {
    return () => h('div', { class: 'v-card-title' }, slots.default?.())
  },
})

const VCardTextStub = defineComponent({
  name: 'VCardText',
  setup(_, { slots }) {
    return () => h('div', { class: 'v-card-text' }, slots.default?.())
  },
})

const VCardActionsStub = defineComponent({
  name: 'VCardActions',
  setup(_, { slots }) {
    return () => h('div', { class: 'v-card-actions' }, slots.default?.())
  },
})

const VSpacerStub = defineComponent({
  name: 'VSpacer',
  setup() {
    return () => h('div', { class: 'v-spacer' })
  },
})

describe('SettingsTableEditor component', () => {
  interface TestItem {
    _id?: string
    id?: string
    name: string
    code: string
    quantity: number
    expires_at: string
  }

  const columns: SettingsTableColumn<TestItem>[] = [
    { field: 'name', label: 'Name', editor: 'sentence' },
    { field: 'code', label: 'Code', editor: 'word' },
    { field: 'quantity', label: 'Quantity', editor: 'count' },
    { field: 'expires_at', label: 'Expires', editor: 'dateTime' },
  ]

  const sampleRows: TestItem[] = [
    { _id: '1', name: 'Item 1', code: 'C1', quantity: 10, expires_at: '2026-12-31T00:00:00Z' },
    { id: '2', name: 'Item 2', code: 'C2', quantity: 20, expires_at: '2027-01-01T00:00:00Z' },
    { name: 'Item 3', code: 'C3', quantity: 30, expires_at: '2027-02-01T00:00:00Z' },
  ]

  const mockOnAdd = vi.fn()
  const mockOnSaveCell = vi.fn()
  const mockOnDelete = vi.fn()

  const defaultProps = {
    rows: sampleRows,
    columns,
    automationIdPrefix: 'test-prefix',
    addLabel: 'Add Item',
    onAdd: mockOnAdd,
    onSaveCell: mockOnSaveCell,
    onDelete: mockOnDelete,
    isLoading: false,
    errorMessage: null,
    title: 'Test Table',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  function mountComponent(props = {}, slots = {}) {
    return mount(SettingsTableEditor, {
      props: { ...defaultProps, ...props },
      slots,
      global: {
        stubs: {
          VBtn: VBtnStub,
          VTable: VTableStub,
          VAlert: VAlertStub,
          VProgressLinear: VProgressLinearStub,
          VDialog: VDialogStub,
          VCard: VCardStub,
          VCardTitle: VCardTitleStub,
          VCardText: VCardTextStub,
          VCardActions: VCardActionsStub,
          VSpacer: VSpacerStub,
          SentenceEditor: {
            props: ['onSave', 'modelValue'],
            template: '<div class="sentence-stub" @click="onSave(\'New Sentence\')">{{ modelValue }}</div>',
          },
          WordEditor: {
            props: ['onSave', 'modelValue'],
            template: '<div class="word-stub" @click="onSave(\'New Word\')">{{ modelValue }}</div>',
          },
          CountEditor: {
            props: ['onSave', 'modelValue'],
            template: '<div class="count-stub" @click="onSave(99)">{{ modelValue }}</div>',
          },
          DateTimeEditor: {
            props: ['onSave', 'modelValue'],
            template: '<div class="datetime-stub" @click="onSave(\'2028-01-01T00:00:00Z\')">{{ modelValue }}</div>',
          },
        },
      },
    })
  }

  it('renders table root, title, add button, columns and rows', () => {
    const wrapper = mountComponent()

    expect(wrapper.find('[data-automation-id="test-prefix-table"]').exists()).toBe(true)
    expect(wrapper.find('[data-automation-id="test-prefix-add-button"]').text()).toContain('Add Item')
    expect(wrapper.html()).toContain('Test Table')

    const rows = wrapper.findAll('[data-automation-id="test-prefix-row"]')
    expect(rows.length).toBe(3)
  })

  it('renders custom title slot if provided', () => {
    const wrapper = mountComponent({}, { title: '<span class="custom-title">Custom Header</span>' })
    expect(wrapper.find('.custom-title').text()).toBe('Custom Header')
  })

  it('renders empty state message when rows is empty and not loading', () => {
    const wrapper = mountComponent({ rows: [] })

    expect(wrapper.find('[data-automation-id="test-prefix-empty"]').exists()).toBe(true)
    expect(wrapper.find('[data-automation-id="test-prefix-empty"]').text()).toContain('No items available')
  })

  it('renders loading bar when isLoading is true', () => {
    const wrapper = mountComponent({ isLoading: true })

    expect(wrapper.find('.v-progress-linear').exists()).toBe(true)
  })

  it('renders error message alert when errorMessage is provided', () => {
    const wrapper = mountComponent({ errorMessage: 'Something went wrong' })

    const error = wrapper.find('[data-automation-id="test-prefix-error"]')
    expect(error.exists()).toBe(true)
    expect(error.text()).toContain('Something went wrong')
  })

  it('calls onAdd when Add button is clicked', async () => {
    mockOnAdd.mockResolvedValueOnce(undefined)

    const wrapper = mountComponent()

    const addButton = wrapper.find('[data-automation-id="test-prefix-add-button"]')
    await addButton.trigger('click')

    expect(mockOnAdd).toHaveBeenCalledOnce()
  })

  it('calls onSaveCell for all 4 editor kinds', async () => {
    mockOnSaveCell.mockResolvedValue(undefined)

    const wrapper = mountComponent()

    // Test sentence editor save
    const sentenceStub = wrapper.find('.sentence-stub')
    await sentenceStub.trigger('click')
    expect(mockOnSaveCell).toHaveBeenCalledWith(sampleRows[0], 'name', 'New Sentence')

    // Test word editor save
    const wordStub = wrapper.find('.word-stub')
    await wordStub.trigger('click')
    expect(mockOnSaveCell).toHaveBeenCalledWith(sampleRows[0], 'code', 'New Word')

    // Test count editor save
    const countStub = wrapper.find('.count-stub')
    await countStub.trigger('click')
    expect(mockOnSaveCell).toHaveBeenCalledWith(sampleRows[0], 'quantity', 99)

    // Test dateTime editor save
    const dateTimeStub = wrapper.find('.datetime-stub')
    await dateTimeStub.trigger('click')
    expect(mockOnSaveCell).toHaveBeenCalledWith(sampleRows[0], 'expires_at', '2028-01-01T00:00:00Z')
  })

  it('handles delete flow: open dialog, cancel without deleting, confirm with onDelete', async () => {
    mockOnDelete.mockResolvedValueOnce(undefined)

    const wrapper = mountComponent({ deleteConfirmMessage: 'Custom delete warning' })

    // Click first row delete button
    const deleteButton = wrapper.find('[data-automation-id="test-prefix-delete-button"]')
    await deleteButton.trigger('click')

    // Dialog is open
    expect(wrapper.find('.v-dialog').exists()).toBe(true)
    expect(wrapper.find('.v-dialog').text()).toContain('Custom delete warning')

    // Cancel delete
    const cancelButton = wrapper.find('[data-automation-id="test-prefix-delete-cancel-button"]')
    await cancelButton.trigger('click')
    expect(wrapper.find('.v-dialog').exists()).toBe(false)
    expect(mockOnDelete).not.toHaveBeenCalled()

    // Open dialog again and confirm
    await deleteButton.trigger('click')
    const confirmButton = wrapper.find('[data-automation-id="test-prefix-delete-confirm-button"]')
    await confirmButton.trigger('click')

    expect(mockOnDelete).toHaveBeenCalledWith(sampleRows[0])
  })
})
