import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { api } from '@/api/client'
import {
  isProductSetting,
  type Setting,
  type SettingCreate,
  type SettingUpdate,
  type ProductSetting,
  type DiscountSetting,
} from '@/api/types'

export function useProductSettings() {
  return useQuery<Setting[], Error, ProductSetting[]>({
    queryKey: ['settings', { type: 'Product' }],
    queryFn: () => api.listSettings({ type: 'Product' }),
    select: (data) => data.filter((s): s is ProductSetting => s.type === 'Product' && s.status !== 'archived'),
  })
}

export function useDiscountSettings() {
  return useQuery<Setting[], Error, DiscountSetting[]>({
    queryKey: ['settings', { type: 'Discount' }],
    queryFn: () => api.listSettings({ type: 'Discount' }),
    select: (data) => data.filter((s): s is DiscountSetting => s.type === 'Discount' && s.status === 'active'),
  })
}

export function useCreateSetting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: SettingCreate) => api.createSetting(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })
}

export function useUpdateSettingField() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, update }: { id: string; update: SettingUpdate }) =>
      api.updateSetting(id, update),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })
}

export function useArchiveSetting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (setting: Setting) => {
      if (!setting._id) throw new Error('Setting has no _id')
      const status = isProductSetting(setting) ? 'archived' : 'inactive'
      return api.updateSetting(setting._id, { status })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })
}
