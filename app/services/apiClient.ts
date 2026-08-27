import { z } from 'zod'

const envelopeSchema = z.union([
  z.object({ ok: z.literal(true), data: z.unknown() }),
  z.object({ ok: z.literal(false), error: z.object({ code: z.string(), message: z.string() }) }),
])

export class ApiError extends Error {
  constructor(public readonly code: string, message: string, public readonly status?: number) {
    super(message)
    this.name = 'ApiError'
  }
}

export function useApiClient() {
  const config = useRuntimeConfig()
  const base = String(config.public.apiBase || '').replace(/\/$/, '')

  async function request<T>(path: string, options: Parameters<typeof $fetch>[1] = {}): Promise<T> {
    if (!base) throw new ApiError('CLOUD_DISABLED', 'Sinkronisasi cloud belum dikonfigurasi.')
    try {
      const raw = await $fetch(`${base}${path}`, { timeout: 8_000, retry: 0, ...options })
      const envelope = envelopeSchema.parse(raw)
      if (!envelope.ok) throw new ApiError(envelope.error.code, envelope.error.message)
      return envelope.data as T
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError('NETWORK_ERROR', 'API cloud tidak dapat dijangkau. Pemrosesan lokal tetap tersedia.')
    }
  }

  return {
    get: <T>(path: string) => request<T>(path),
    post: <T>(path: string, body: Record<string, unknown>) => request<T>(path, { method: 'POST', body }),
    put: <T>(path: string, body: Record<string, unknown>) => request<T>(path, { method: 'PUT', body }),
    delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  }
}
