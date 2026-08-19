export interface DashboardData {
  totalUsers: number
  totalProducts: number
  totalOrders: number
  totalEarning: string
}

export interface GetDashboardResponse {
  success: boolean
  code: number
  message: string
  data: DashboardData
}