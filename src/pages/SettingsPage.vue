<template>
  <v-container fluid data-automation-id="admin-settings-page">
    <h1 class="text-h4 font-weight-bold mb-4">Settings</h1>

    <v-tabs
      v-model="activeTab"
      color="primary"
      data-automation-id="admin-settings-tabs"
    >
      <v-tab value="products" data-automation-id="admin-settings-tab-products">
        Products
      </v-tab>
      <v-tab value="discounts" data-automation-id="admin-settings-tab-discounts">
        Discounts
      </v-tab>
    </v-tabs>

    <v-window
      v-model="activeTab"
      data-automation-id="admin-settings-window"
      class="mt-4"
    >
      <v-window-item
        value="products"
        data-automation-id="admin-settings-window-products"
      >
        <SettingsTableEditor
          :rows="products"
          :columns="productColumns"
          automation-id-prefix="admin-products"
          add-label="Add Product"
          :is-loading="productsLoading"
          :error-message="productErrorMessage"
          delete-confirm-message="Are you sure you want to archive this product?"
          :on-add="handleAddProduct"
          :on-save-cell="handleSaveProductCell"
          :on-delete="handleDeleteSetting"
        />
      </v-window-item>

      <v-window-item
        value="discounts"
        data-automation-id="admin-settings-window-discounts"
      >
        <SettingsTableEditor
          :rows="discounts"
          :columns="discountColumns"
          automation-id-prefix="admin-discounts"
          add-label="Add Discount"
          :is-loading="discountsLoading"
          :error-message="discountErrorMessage"
          delete-confirm-message="Are you sure you want to inactivate this discount?"
          :on-add="handleAddDiscount"
          :on-save-cell="handleSaveDiscountCell"
          :on-delete="handleDeleteSetting"
        />
      </v-window-item>
    </v-window>

    <v-snackbar
      v-model="snackbarShow"
      color="error"
      timeout="4000"
    >
      {{ snackbarText }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SettingsTableEditor from '@/components/SettingsTableEditor.vue'
import type { SettingsTableColumn } from '@/components/settingsTable'
import {
  useProductSettings,
  useDiscountSettings,
  useCreateSetting,
  useUpdateSettingField,
  useArchiveSetting,
} from '@/composables/useSettings'
import type {
  ProductSetting,
  DiscountSetting,
  Setting,
  ProductSettingCreate,
  DiscountSettingCreate,
} from '@/api/types'

const route = useRoute()
const router = useRouter()

const activeTab = computed({
  get() {
    return route.query.tab === 'discounts' ? 'discounts' : 'products'
  },
  set(val: string) {
    router.replace({ query: { ...route.query, tab: val } })
  },
})

const productsQuery = useProductSettings()
const discountsQuery = useDiscountSettings()

const createMutation = useCreateSetting()
const updateMutation = useUpdateSettingField()
const archiveMutation = useArchiveSetting()

const products = computed<ProductSetting[]>(() => productsQuery.data.value ?? [])
const discounts = computed<DiscountSetting[]>(() => discountsQuery.data.value ?? [])

const productsLoading = computed(() => productsQuery.isLoading.value)
const discountsLoading = computed(() => discountsQuery.isLoading.value)

const productErrorMessage = ref<string | null>(null)
const discountErrorMessage = ref<string | null>(null)

const snackbarShow = ref(false)
const snackbarText = ref('')

function showError(msg: string) {
  snackbarText.value = msg
  snackbarShow.value = true
}

const productColumns: SettingsTableColumn<ProductSetting>[] = [
  {
    field: 'name',
    label: 'Name',
    editor: 'sentence',
    hint: 'Display name',
    rules: [(v: string) => Boolean(v && v.trim().length > 0) || 'Name is required'],
  },
  {
    field: 'subscription',
    label: 'Subscription',
    editor: 'word',
    hint: 'Plan identifier key, e.g. pro-monthly',
    rules: [(v: string) => (v && /^[^\s]{1,40}$/.test(v)) || '1-40 characters, no spaces'],
  },
  {
    field: 'description',
    label: 'Description',
    editor: 'sentence',
    hint: 'Short description',
  },
  {
    field: 'unit_price',
    label: 'Price (cents)',
    editor: 'count',
    hint: 'Price in integer cents / minor units',
    rules: [(v: number) => v >= 0 || 'Must be >= 0'],
  },
  {
    field: 'minimum_members',
    label: 'Min Seats',
    editor: 'count',
    hint: 'Seat floor for checkout',
    rules: [(v: number) => v >= 0 || 'Must be >= 0'],
  },
  {
    field: 'stripe_price_id',
    label: 'Stripe Price ID',
    editor: 'sentence',
    hint: 'Stripe Price id for Checkout',
  },
]

const discountColumns: SettingsTableColumn<DiscountSetting>[] = [
  {
    field: 'name',
    label: 'Name',
    editor: 'sentence',
    hint: 'Short searchable label',
    rules: [(v: string) => Boolean(v && v.trim().length > 0) || 'Name is required'],
  },
  {
    field: 'code',
    label: 'Code',
    editor: 'word',
    hint: 'Redeemable code, e.g. SAVE20',
    rules: [(v: string) => (v && /^[^\s]{1,40}$/.test(v)) || '1-40 characters, no spaces'],
  },
  {
    field: 'description',
    label: 'Description',
    editor: 'sentence',
    hint: 'Ops / bookkeeping description',
  },
  {
    field: 'free_encounters',
    label: 'Free Encounters',
    editor: 'count',
    hint: 'Encounters granted at checkout',
    rules: [(v: number) => v >= 0 || 'Must be >= 0'],
  },
  {
    field: 'max_redemptions',
    label: 'Max Redemptions',
    editor: 'count',
    hint: 'Global redemption limit (optional)',
  },
  {
    field: 'expires_at',
    label: 'Expires At',
    editor: 'dateTime',
    hint: 'Expiry timestamp',
  },
]

async function handleAddProduct() {
  productErrorMessage.value = null
  try {
    const uniqueSuffix = Date.now().toString(36)
    const payload: ProductSettingCreate = {
      type: 'Product',
      subscription: `product-${uniqueSuffix}`.slice(0, 40),
      name: 'New Product',
      unit_price: 0,
      minimum_members: 1,
      status: 'active',
    }
    await createMutation.mutateAsync(payload)
  } catch (err: any) {
    const msg = err?.message || 'Failed to add product'
    productErrorMessage.value = msg
    showError(msg)
  }
}

async function handleAddDiscount() {
  discountErrorMessage.value = null
  try {
    const uniqueSuffix = Date.now().toString(36).toUpperCase()
    const payload: DiscountSettingCreate = {
      type: 'Discount',
      code: `CODE-${uniqueSuffix}`.slice(0, 40),
      name: 'New Discount',
      free_encounters: 1,
      status: 'active',
    }
    await createMutation.mutateAsync(payload)
  } catch (err: any) {
    const msg = err?.message || 'Failed to add discount'
    discountErrorMessage.value = msg
    showError(msg)
  }
}

async function handleSaveProductCell(row: ProductSetting, field: string, value: unknown) {
  if (!row._id) return
  productErrorMessage.value = null
  try {
    await updateMutation.mutateAsync({
      id: row._id,
      update: { [field]: value },
    })
  } catch (err: any) {
    const msg = err?.message || `Failed to update ${field}`
    productErrorMessage.value = msg
    showError(msg)
  }
}

async function handleSaveDiscountCell(row: DiscountSetting, field: string, value: unknown) {
  if (!row._id) return
  discountErrorMessage.value = null
  try {
    await updateMutation.mutateAsync({
      id: row._id,
      update: { [field]: value },
    })
  } catch (err: any) {
    const msg = err?.message || `Failed to update ${field}`
    discountErrorMessage.value = msg
    showError(msg)
  }
}

async function handleDeleteSetting(setting: Setting) {
  try {
    await archiveMutation.mutateAsync(setting)
  } catch (err: any) {
    const msg = err?.message || 'Failed to archive setting'
    if (setting.type === 'Product') {
      productErrorMessage.value = msg
    } else {
      discountErrorMessage.value = msg
    }
    showError(msg)
  }
}
</script>
