// Type definitions based on OpenAPI spec

export interface Error {
  error: string
}

export interface Breadcrumb {
  at_time?: string
  by_user?: string
  correlation_id?: string
  from_ip?: string
}

export type ProductStatus = 'active' | 'archived'
export type DiscountStatus = 'active' | 'inactive'
export type SettingStatus = ProductStatus | DiscountStatus

export interface ProductSetting {
  _id?: string
  type: 'Product'
  subscription: string
  name: string
  description?: string
  unit_price?: number
  minimum_members?: number
  stripe_price_id?: string
  status?: ProductStatus
  created?: Breadcrumb
  saved?: Breadcrumb
}

export interface DiscountSetting {
  _id?: string
  type: 'Discount'
  code: string
  name: string
  description?: string
  free_encounters?: number
  max_redemptions?: number
  expires_at?: string
  status?: DiscountStatus
  created?: Breadcrumb
  saved?: Breadcrumb
}

export type Setting = ProductSetting | DiscountSetting

export interface ProductSettingCreate {
  type: 'Product'
  subscription: string
  name: string
  description?: string
  unit_price?: number
  minimum_members?: number
  stripe_price_id?: string
  status?: ProductStatus
}

export interface DiscountSettingCreate {
  type: 'Discount'
  code: string
  name: string
  description?: string
  free_encounters?: number
  max_redemptions?: number
  expires_at?: string
  status?: DiscountStatus
}

export type SettingCreate = ProductSettingCreate | DiscountSettingCreate

export interface SettingUpdate {
  name?: string
  description?: string
  unit_price?: number
  minimum_members?: number
  stripe_price_id?: string
  code?: string
  free_encounters?: number
  max_redemptions?: number
  expires_at?: string
  status?: string
}

export type ExternalEventSource = 'cognito' | 'stripe'

export interface ExternalEvent {
  _id?: string
  source: ExternalEventSource
  external_id?: string
  payload_hash?: string
  normalized_body?: Record<string, unknown>
  created?: Breadcrumb
}

export interface ConfigResponse {
  config_items?: unknown[]
  versions?: unknown[]
  enumerators?: unknown[]
  token?: {
    claims?: Record<string, unknown>
  }
}

export function isProductSetting(setting: Setting): setting is ProductSetting {
  return setting.type === 'Product'
}

export function isDiscountSetting(setting: Setting): setting is DiscountSetting {
  return setting.type === 'Discount'
}
