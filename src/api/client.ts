import type {
  ConfigResponse,
  Error,
  ExternalEvent,
  ExternalEventSource,
  Setting,
  SettingCreate,
  SettingUpdate,
} from './types'
import { redirectToIdpLogin, useAuth } from '@mentor-forge/mentorhub_spa_utils'

const API_BASE = `${import.meta.env.BASE_URL}api`

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: Error
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('access_token')

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    let errorData: Error | null = null
    try {
      errorData = await response.json()
    } catch {
      // Ignore JSON parse errors
    }

    if (response.status === 401) {
      const { logout } = useAuth()
      logout()
      redirectToIdpLogin()
    }

    throw new ApiError(
      errorData?.error || `HTTP ${response.status}: ${response.statusText}`,
      response.status,
      errorData || undefined
    )
  }

  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return {} as T
  }

  return response.json()
}

export interface ListSettingsParams {
  type?: 'Product' | 'Discount'
  typeIn?: string[]
  sortBy?: string
  order?: 'asc' | 'desc'
  offset?: number
  size?: number
}

export interface ListExternalEventsParams {
  source?: ExternalEventSource
  sortBy?: string
  order?: 'asc' | 'desc'
  offset?: number
  size?: number
}

export const api = {
  async getConfig(): Promise<ConfigResponse> {
    return request<ConfigResponse>('/config')
  },

  async listSettings(params?: ListSettingsParams): Promise<Setting[]> {
    const query = new URLSearchParams()
    if (params?.type) query.set('type', params.type)
    if (params?.typeIn && params.typeIn.length > 0) {
      for (const t of params.typeIn) {
        query.append('type[in_list]', t)
      }
    }
    if (params?.sortBy) query.set('sort_by', params.sortBy)
    if (params?.order) query.set('order', params.order)

    const headers: Record<string, string> = {}
    if (params?.offset !== undefined) headers['offset'] = String(params.offset)
    if (params?.size !== undefined) headers['size'] = String(params.size)

    const qs = query.toString()
    const endpoint = `/setting${qs ? `?${qs}` : ''}`
    return request<Setting[]>(endpoint, {
      method: 'GET',
      headers,
    })
  },

  async createSetting(body: SettingCreate): Promise<Setting> {
    return request<Setting>('/setting', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  async getSetting(id: string): Promise<Setting> {
    return request<Setting>(`/setting/${encodeURIComponent(id)}`, {
      method: 'GET',
    })
  },

  async updateSetting(id: string, body: SettingUpdate): Promise<Setting> {
    return request<Setting>(`/setting/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  },

  async listExternalEvents(params?: ListExternalEventsParams): Promise<ExternalEvent[]> {
    const query = new URLSearchParams()
    if (params?.source) query.set('source', params.source)
    if (params?.sortBy) query.set('sort_by', params.sortBy)
    if (params?.order) query.set('order', params.order)

    const headers: Record<string, string> = {}
    if (params?.offset !== undefined) headers['offset'] = String(params.offset)
    if (params?.size !== undefined) headers['size'] = String(params.size)

    const qs = query.toString()
    const endpoint = `/external-event${qs ? `?${qs}` : ''}`
    return request<ExternalEvent[]>(endpoint, {
      method: 'GET',
      headers,
    })
  },
}

export { ApiError }
