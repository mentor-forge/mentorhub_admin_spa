import { describe, it, expect } from 'vitest'
import {
  isProductSetting,
  isDiscountSetting,
  type Error,
  type ConfigResponse,
  type ProductSetting,
  type DiscountSetting,
  type Setting,
} from './types'

describe('API Types', () => {
  describe('Error', () => {
    it('should match Error interface', () => {
      const error: Error = {
        error: 'Test error message'
      }

      expect(error.error).toBe('Test error message')
    })
  })

  describe('ConfigResponse', () => {
    it('should match ConfigResponse interface', () => {
      const config: ConfigResponse = {
        config_items: [],
        versions: [],
        enumerators: [],
        token: {
          claims: {
            sub: 'user-123',
            roles: ['admin']
          }
        }
      }

      expect(config.config_items).toEqual([])
      expect(config.versions).toEqual([])
      expect(config.enumerators).toEqual([])
      expect(config.token?.claims).toEqual({
        sub: 'user-123',
        roles: ['admin']
      })
    })

    it('should allow optional token field', () => {
      const config: ConfigResponse = {
        config_items: [],
        versions: [],
        enumerators: []
      }

      expect(config.token).toBeUndefined()
    })
  })

  describe('Type narrowing helpers', () => {
    const product: ProductSetting = {
      _id: '665f1c2a9b1e4c0a1b2c3d4e',
      type: 'Product',
      subscription: 'pro',
      name: 'Pro Plan',
      status: 'active',
    }

    const discount: DiscountSetting = {
      _id: '665f1c2a9b1e4c0a1b2c3d4f',
      type: 'Discount',
      code: 'SAVE10',
      name: 'Save 10%',
      status: 'active',
    }

    it('isProductSetting returns true for Product and false for Discount', () => {
      expect(isProductSetting(product as Setting)).toBe(true)
      expect(isProductSetting(discount as Setting)).toBe(false)
    })

    it('isDiscountSetting returns true for Discount and false for Product', () => {
      expect(isDiscountSetting(discount as Setting)).toBe(true)
      expect(isDiscountSetting(product as Setting)).toBe(false)
    })
  })
})
