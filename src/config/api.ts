const RAW_API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim()

export const API_BASE_URL = (RAW_API_BASE_URL && RAW_API_BASE_URL.length > 0
  ? RAW_API_BASE_URL
  : 'http://localhost:3000'
).replace(/\/+$/, '')

export const resolveMediaUrl = (value: string): string => {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (/^(blob:|data:|https?:\/\/)/i.test(trimmed)) return trimmed
  return `${API_BASE_URL}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`
}
