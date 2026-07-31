// Type definitions based on OpenAPI spec

export interface Error {
  error: string
}

export interface ConfigResponse {
  config_items: unknown[]
  versions: unknown[]
  enumerators: unknown[]
  token?: {
    claims?: Record<string, unknown>
  }
}
