export type AuthUser = {
  user_id: string
  name: string
  email: string
  token: string
  profilePicture?: string
}

export type LoginApiResponse = {
  success: boolean
  code: number
  message: string
  data?: AuthUser
}
