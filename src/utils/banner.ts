export const UPLOAD_AREA_OPTIONS = [
  { value: 'website', label: 'Website' },
  { value: 'app', label: 'App' },
] as const

export type UploadArea = (typeof UPLOAD_AREA_OPTIONS)[number]['value']

export function normalizeUploadArea(value: unknown): UploadArea {
  return value === 'app' ? 'app' : 'website'
}

export function formatUploadAreaLabel(value: unknown): string {
  return normalizeUploadArea(value) === 'app' ? 'App' : 'Website'
}
