/**
 * GET /api/bannerimg — active storefront banners (server should return only rows with status = 1).
 */
export const BANNERIMG_API_PATH = '/api/bannerimg'

export type BannerimgItem = {
  banner_id?: string
  id?: string
  title?: string
  description?: string
  banner_image?: string
  order_url?: string
  orderUrl?: string
  status?: number
}

function normalizeList(payload: unknown): BannerimgItem[] {
  if (Array.isArray(payload)) return payload as BannerimgItem[]
  if (payload && typeof payload === 'object' && 'data' in payload) {
    const data = (payload as { data: unknown }).data
    if (Array.isArray(data)) return data as BannerimgItem[]
  }
  return []
}

/**
 * Fetches banner records intended for display (active only). Filtering by status is enforced on the API.
 */
export async function getBannerimg(token: string): Promise<BannerimgItem[]> {
  const res = await fetch(BANNERIMG_API_PATH, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`bannerimg: ${res.status}`)
  const json: unknown = await res.json()
  return normalizeList(json?.data ?? json)
}
