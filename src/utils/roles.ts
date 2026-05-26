import { ROUTES, VENDOR_ROUTES } from '../routes'

export const ROLES = {
  SUPER_ADMIN: 'SuperAdmin',
  VENDOR: 'Vendor',
  USER: 'User',
} as const

export type UserRole = (typeof ROLES)[keyof typeof ROLES]

export const isVendorRole = (role?: string | null): boolean => role === ROLES.VENDOR

export const isAdminRole = (role?: string | null): boolean => role === ROLES.SUPER_ADMIN

export const getPostLoginRoute = (role?: string | null): string =>
  isVendorRole(role) ? VENDOR_ROUTES.dashboard : ROUTES.dashboard
