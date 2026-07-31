import { describe, it, expect } from 'vitest'
import type { Error, ConfigResponse } from './types'

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
})
