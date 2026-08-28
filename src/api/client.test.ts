import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { redirectToIdpLogin, useAuth } from '@mentor-forge/mentorhub_spa_utils'
import { api, ApiError } from './client'
import type {
  ConfigResponse,
  ExternalEvent,
  ProductSetting,
  DiscountSetting,
  ProductSettingCreate,
  SettingUpdate,
} from './types'

vi.mock('@mentor-forge/mentorhub_spa_utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@mentor-forge/mentorhub_spa_utils')>()
  return {
    ...actual,
    redirectToIdpLogin: vi.fn(),
    useAuth: vi.fn(() => ({
      logout: vi.fn(),
      isAuthenticated: { value: false },
      roles: { value: [] },
    })),
  }
})

const mockFetch = vi.fn()
global.fetch = mockFetch

describe('API Client', () => {
  beforeEach(() => {
    mockFetch.mockClear()
    vi.mocked(redirectToIdpLogin).mockClear()
    vi.mocked(useAuth).mockClear()
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Config', () => {
    beforeEach(() => {
      localStorage.setItem('access_token', 'test-token')
    })

    it('should fetch config successfully', async () => {
      const mockConfig: ConfigResponse = {
        config_items: [],
        versions: [],
        enumerators: [],
        token: { claims: {} }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {
          get: (name: string) => name === 'content-length' ? '100' : null
        },
        json: async () => mockConfig
      })

      const result = await api.getConfig()

      expect(result).toEqual(mockConfig)
      expect(mockFetch).toHaveBeenCalledWith(
        '/admin/api/config',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token'
          })
        })
      )
    })
  })

  describe('Settings', () => {
    beforeEach(() => {
      localStorage.setItem('access_token', 'test-token')
    })

    const sampleProduct: ProductSetting = {
      _id: '665f1c2a9b1e4c0a1b2c3d4e',
      type: 'Product',
      subscription: 'enterprise',
      name: 'Enterprise Plan',
      status: 'active',
    }

    const sampleDiscount: DiscountSetting = {
      _id: '665f1c2a9b1e4c0a1b2c3d4f',
      type: 'Discount',
      code: 'SUMMER20',
      name: 'Summer 20%',
      status: 'active',
    }

    it('listSettings calls endpoint without query params when none provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => '100' },
        json: async () => [sampleProduct, sampleDiscount],
      })

      const result = await api.listSettings()

      expect(result).toEqual([sampleProduct, sampleDiscount])
      expect(mockFetch).toHaveBeenCalledWith(
        '/admin/api/setting',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json',
          }),
        })
      )
    })

    it('listSettings includes query parameters and offset/size headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => '100' },
        json: async () => [sampleProduct],
      })

      const result = await api.listSettings({
        type: 'Product',
        typeIn: ['Product', 'Discount'],
        sortBy: 'name',
        order: 'asc',
        offset: 10,
        size: 50,
      })

      expect(result).toEqual([sampleProduct])
      expect(mockFetch).toHaveBeenCalledWith(
        '/admin/api/setting?type=Product&type%5Bin_list%5D=Product&type%5Bin_list%5D=Discount&sort_by=name&order=asc',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
            'offset': '10',
            'size': '50',
          }),
        })
      )
    })

    it('createSetting sends POST with JSON body', async () => {
      const newProduct: ProductSettingCreate = {
        type: 'Product',
        subscription: 'starter',
        name: 'Starter Plan',
        status: 'active',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: { get: () => '100' },
        json: async () => ({ ...newProduct, _id: '665f1c2a9b1e4c0a1b2c3d50' }),
      })

      const result = await api.createSetting(newProduct)

      expect(result._id).toBe('665f1c2a9b1e4c0a1b2c3d50')
      expect(mockFetch).toHaveBeenCalledWith(
        '/admin/api/setting',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newProduct),
        })
      )
    })

    it('getSetting fetches single setting by id', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => '100' },
        json: async () => sampleProduct,
      })

      const result = await api.getSetting('665f1c2a9b1e4c0a1b2c3d4e')

      expect(result).toEqual(sampleProduct)
      expect(mockFetch).toHaveBeenCalledWith(
        '/admin/api/setting/665f1c2a9b1e4c0a1b2c3d4e',
        expect.objectContaining({
          method: 'GET',
        })
      )
    })

    it('updateSetting sends PATCH with JSON body', async () => {
      const update: SettingUpdate = {
        name: 'Updated Enterprise',
        unit_price: 9900,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => '100' },
        json: async () => ({ ...sampleProduct, ...update }),
      })

      const result = await api.updateSetting('665f1c2a9b1e4c0a1b2c3d4e', update)

      expect(result.name).toBe('Updated Enterprise')
      expect(mockFetch).toHaveBeenCalledWith(
        '/admin/api/setting/665f1c2a9b1e4c0a1b2c3d4e',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(update),
        })
      )
    })
  })

  describe('External Events', () => {
    beforeEach(() => {
      localStorage.setItem('access_token', 'test-token')
    })

    const sampleEvent: ExternalEvent = {
      _id: '665f1c2a9b1e4c0a1b2c3d60',
      source: 'stripe',
      external_id: 'evt_12345',
      payload_hash: 'hash123',
      normalized_body: { type: 'customer.subscription.created' },
    }

    it('listExternalEvents sends query params and offset/size headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => '100' },
        json: async () => [sampleEvent],
      })

      const result = await api.listExternalEvents({
        source: 'stripe',
        sortBy: 'created.at_time',
        order: 'desc',
        offset: 0,
        size: 20,
      })

      expect(result).toEqual([sampleEvent])
      expect(mockFetch).toHaveBeenCalledWith(
        '/admin/api/external-event?source=stripe&sort_by=created.at_time&order=desc',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'offset': '0',
            'size': '20',
          }),
        })
      )
    })
  })

  describe('Response handling & Errors', () => {
    it('returns empty object on 204 or content-length 0', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: { get: () => '0' },
      })

      const result = await api.getConfig()
      expect(result).toEqual({})
    })

    it('throws ApiError with error message from json response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ error: 'Invalid setting payload' }),
      })

      await expect(api.createSetting({} as any)).rejects.toThrow('Invalid setting payload')
    })

    it('handles non-json error response gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => {
          throw new Error('Not JSON')
        },
      })

      await expect(api.getConfig()).rejects.toThrow('HTTP 500: Internal Server Error')
    })
  })

  describe('401 Unauthorized Handling', () => {
    const mockLogout = vi.fn()

    beforeEach(() => {
      localStorage.setItem('access_token', 'invalid-token')
      localStorage.setItem('token_expires_at', '2026-12-31T23:59:59Z')
      localStorage.setItem('user_roles', JSON.stringify(['admin']))
      vi.mocked(useAuth).mockReturnValue({
        logout: mockLogout,
        isAuthenticated: { value: true },
        roles: { value: ['admin'] },
      })
    })

    it('should clear session and redirect on 401 error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ error: 'Invalid token' })
      })

      try {
        await api.getConfig()
      } catch {
        // Error is expected to be thrown
      }

      expect(mockLogout).toHaveBeenCalledOnce()
      expect(redirectToIdpLogin).toHaveBeenCalledOnce()
    })
  })
})
