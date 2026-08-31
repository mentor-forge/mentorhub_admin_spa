import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  useProductSettings,
  useDiscountSettings,
  useCreateSetting,
  useUpdateSettingField,
  useArchiveSetting,
} from './useSettings'
import { api } from '@/api/client'
import type { ProductSetting, DiscountSetting } from '@/api/types'

const mockInvalidateQueries = vi.fn()
const mockUseQuery = vi.fn()
const mockUseMutation = vi.fn()

vi.mock('@/api/client', () => ({
  api: {
    listSettings: vi.fn(),
    createSetting: vi.fn(),
    updateSetting: vi.fn(),
  },
}))

vi.mock('@tanstack/vue-query', () => ({
  useQuery: vi.fn((opts) => mockUseQuery(opts)),
  useMutation: vi.fn((opts) => mockUseMutation(opts)),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: mockInvalidateQueries,
  })),
}))

describe('useSettings composable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const sampleProducts: ProductSetting[] = [
    { _id: 'p1', type: 'Product', subscription: 'sub1', name: 'Product 1', status: 'active' },
    { _id: 'p2', type: 'Product', subscription: 'sub2', name: 'Product 2', status: 'archived' },
  ]

  const sampleDiscounts: DiscountSetting[] = [
    { _id: 'd1', type: 'Discount', code: 'CODE1', name: 'Discount 1', status: 'active' },
    { _id: 'd2', type: 'Discount', code: 'CODE2', name: 'Discount 2', status: 'inactive' },
  ]

  describe('useProductSettings', () => {
    it('configures query and filters out archived products', async () => {
      mockUseQuery.mockImplementationOnce((options) => {
        const selectFn = options.select
        return {
          data: selectFn(sampleProducts),
          isLoading: false,
        }
      })

      const query = useProductSettings()
      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['settings', { type: 'Product' }],
        })
      )
      expect(query.data).toEqual([sampleProducts[0]])

      // Test queryFn
      const queryFn = mockUseQuery.mock.calls[0][0].queryFn
      vi.mocked(api.listSettings).mockResolvedValueOnce(sampleProducts)
      await queryFn()
      expect(api.listSettings).toHaveBeenCalledWith({ type: 'Product' })
    })
  })

  describe('useDiscountSettings', () => {
    it('configures query and filters only active discounts', async () => {
      mockUseQuery.mockImplementationOnce((options) => {
        const selectFn = options.select
        return {
          data: selectFn(sampleDiscounts),
          isLoading: false,
        }
      })

      const query = useDiscountSettings()
      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['settings', { type: 'Discount' }],
        })
      )
      expect(query.data).toEqual([sampleDiscounts[0]])

      // Test queryFn
      const queryFn = mockUseQuery.mock.calls[0][0].queryFn
      vi.mocked(api.listSettings).mockResolvedValueOnce(sampleDiscounts)
      await queryFn()
      expect(api.listSettings).toHaveBeenCalledWith({ type: 'Discount' })
    })
  })

  describe('useCreateSetting', () => {
    it('calls api.createSetting and invalidates settings queries on success', async () => {
      let mutationOpts: any
      mockUseMutation.mockImplementationOnce((opts) => {
        mutationOpts = opts
        return { mutateAsync: opts.mutationFn }
      })

      useCreateSetting()
      const newProduct = { type: 'Product' as const, subscription: 'pro', name: 'Pro' }
      vi.mocked(api.createSetting).mockResolvedValueOnce({ ...newProduct, _id: 'p3' })

      await mutationOpts.mutationFn(newProduct)
      expect(api.createSetting).toHaveBeenCalledWith(newProduct)

      mutationOpts.onSuccess()
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['settings'] })
    })
  })

  describe('useUpdateSettingField', () => {
    it('calls api.updateSetting and invalidates settings queries on success', async () => {
      let mutationOpts: any
      mockUseMutation.mockImplementationOnce((opts) => {
        mutationOpts = opts
        return { mutateAsync: opts.mutationFn }
      })

      useUpdateSettingField()
      vi.mocked(api.updateSetting).mockResolvedValueOnce({ _id: 'p1', type: 'Product', name: 'New Name', subscription: 'sub1' })

      await mutationOpts.mutationFn({ id: 'p1', update: { name: 'New Name' } })
      expect(api.updateSetting).toHaveBeenCalledWith('p1', { name: 'New Name' })

      mutationOpts.onSuccess()
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['settings'] })
    })
  })

  describe('useArchiveSetting', () => {
    it('archives product with status: archived', async () => {
      let mutationOpts: any
      mockUseMutation.mockImplementationOnce((opts) => {
        mutationOpts = opts
        return { mutateAsync: opts.mutationFn }
      })

      useArchiveSetting()
      vi.mocked(api.updateSetting).mockResolvedValueOnce({ ...sampleProducts[0], status: 'archived' })

      await mutationOpts.mutationFn(sampleProducts[0])
      expect(api.updateSetting).toHaveBeenCalledWith('p1', { status: 'archived' })

      mutationOpts.onSuccess()
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['settings'] })
    })

    it('inactivates discount with status: inactive', async () => {
      let mutationOpts: any
      mockUseMutation.mockImplementationOnce((opts) => {
        mutationOpts = opts
        return { mutateAsync: opts.mutationFn }
      })

      useArchiveSetting()
      vi.mocked(api.updateSetting).mockResolvedValueOnce({ ...sampleDiscounts[0], status: 'inactive' })

      await mutationOpts.mutationFn(sampleDiscounts[0])
      expect(api.updateSetting).toHaveBeenCalledWith('d1', { status: 'inactive' })
    })

    it('throws error when setting has no _id', () => {
      let mutationOpts: any
      mockUseMutation.mockImplementationOnce((opts) => {
        mutationOpts = opts
        return { mutateAsync: opts.mutationFn }
      })

      useArchiveSetting()
      expect(() => mutationOpts.mutationFn({ type: 'Product', name: 'No ID', subscription: 'sub' } as any)).toThrow(
        'Setting has no _id'
      )
    })
  })
})
