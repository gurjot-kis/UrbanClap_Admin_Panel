export type AuthUser = {
  _id:string,
  user_id: string
  name: string
  email: string
  token: string
  role?: string
  status?: number
  profilePicture?: string
}

export type LoginApiResponse = {
  success: boolean
  code: number
  message: string
  data?: AuthUser
}
