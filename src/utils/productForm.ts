import type { AuthUser } from '../types/auth'
import { ROLES } from './roles'

export const getProductOwnershipQuery = (user: AuthUser): { role: string; user_id: string } => {
  const role = user.role === ROLES.VENDOR ? ROLES.VENDOR : ROLES.SUPER_ADMIN
  return { role, user_id: user.user_id }
}

export const appendProductListQuery = (params: URLSearchParams, user: AuthUser): void => {
  const { role, user_id } = getProductOwnershipQuery(user)
  params.set('user_id', user_id)
  params.set('role', role)
}

export const appendProductOwnership = (formData: FormData, user: AuthUser): void => {
  const { role, user_id } = getProductOwnershipQuery(user)
  formData.append('role', role)
  formData.append('user_id', user_id)
}

export const parseProductApiError = async (res: Response, fallback: string): Promise<string> => {
  try {
    const json = await res.json()
    return String(json?.message || fallback)
  } catch {
    return fallback
  }
}

export interface CategoryOption {
  id?: string
  category_id?: string
  name?: string
  category_name?: string
  [key: string]: unknown
}

export interface SubCategoryOption {
  id?: string
  sub_category_id?: string
  name?: string
  sub_category_name?: string
  [key: string]: unknown
}

export const getCategoryOptionId = (item: CategoryOption): string =>
  String(item.id ?? item.category_id ?? '')

export const getSubCategoryOptionId = (item: SubCategoryOption): string =>
  String(item.id ?? item.sub_category_id ?? '')

export const getOptionName = (item: CategoryOption | SubCategoryOption): string =>
  String(item.name ?? item.category_name ?? item.sub_category_name ?? '')
