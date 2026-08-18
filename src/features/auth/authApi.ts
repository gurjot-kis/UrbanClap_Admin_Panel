import { baseApi } from '../../store/api/baseApi'
import type {
  AdminLoginRequest,
  ApiResponse,
  LoginData,
  LoginRequest,
  ProfileResponse,
  RegisterRequest,
  User
} from './authTypes'

export const authApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    register: builder.mutation<ApiResponse<LoginData>, RegisterRequest>({
      query: body => ({
        url: '/users/register',
        method: 'POST',
        body
      }),
      invalidatesTags: ['Auth']
    }),
    login: builder.mutation<ApiResponse<LoginData>, LoginRequest>({
      query: body => ({
        url: '/users/login',
        method: 'POST',
        body
      }),
      invalidatesTags: ['Auth']
    }),
    // Admin Login
    adminLogin: builder.mutation<ApiResponse<LoginData>, AdminLoginRequest>({
      query: body => ({
        url: '/login',
        method: 'POST',
        body
      }),
      invalidatesTags: ['Auth']
    }),
    getProfile: builder.query<ApiResponse<ProfileResponse>, void>({
      query: () => ({
        url: '/users/profile-details',
        method: 'GET'
      }),
      extraOptions: {
        requiresAuth: true
      }
    }),
    uploadAvatar: builder.mutation<
      ApiResponse<{ avatarUrl: string }>,
      FormData
    >({
      query: body => ({
        url: '/users/upload-avatar',
        method: 'POST',
        body
      })
    }),
    updateProfile: builder.mutation<ApiResponse<User>, Partial<User>>({
      query: body => ({
        url: '/users/profile',
        method: 'PUT',
        body
      }),
      extraOptions: {
        requiresAuth: true
      }
    })
  })
})

export const {
  useRegisterMutation,
  useAdminLoginMutation,
  useLoginMutation,
  useLazyGetProfileQuery,
  useUploadAvatarMutation,
  useUpdateProfileMutation
} = authApi
