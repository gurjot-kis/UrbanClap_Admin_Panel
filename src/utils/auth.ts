import type { AuthUser } from '../types/auth'

const AUTH_TOKEN_KEY = 'authToken'
const AUTH_USER_KEY = 'authUser'

export const getStoredUser = (): AuthUser | null => {
  const storedUser = localStorage.getItem(AUTH_USER_KEY)

  if (!storedUser) {
    return null
  }

  try {
    return JSON.parse(storedUser) as AuthUser
  } catch {
    localStorage.removeItem(AUTH_USER_KEY)
    localStorage.removeItem(AUTH_TOKEN_KEY)
    return null
  }
}

export const getStoredToken = (): string | null => localStorage.getItem(AUTH_TOKEN_KEY)



export const setAuthSession = (user: AuthUser): void => {
  localStorage.setItem(AUTH_TOKEN_KEY, user.token)
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
}

export const clearAuthSession = (): void => {
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(AUTH_USER_KEY)
}
