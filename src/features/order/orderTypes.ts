export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'completed'

export type PaymentMethod = 'cod' | 'online'

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

export type CancellationCancelledBy = 'user' | 'admin' | 'vendor' | null

export interface OrderCustomer {
  _id: string
  name: string
  email: string
}

export interface Order {
  _id: string
  orderNumber: string
  customer: OrderCustomer
  totalItems: number
  grandTotal: number
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  status: OrderStatus
  createdAt: string
}

export interface OrderPricing {
  itemsTotal: number
  taxAmount: number
  deliveryFee: number
  discount: number
  grandTotal: number
}

export interface OrderCancellation {
  cancelledBy: CancellationCancelledBy
  reason: string | null
  cancelledAt: string | null
  refundAmount: number | null
}

export interface OrderItemSnapshot {
  name: string
  slug: string
  mainImage: string
}

export interface OrderItemVariant {
  key: string
  label: string
  image: string | null
}

export interface OrderItem {
  snapshot: OrderItemSnapshot
  variant: OrderItemVariant
  product_id: string
  unitPrice: number
  quantity: number
  lineTotal: number
}

export interface OrderPayment {
  _id: string
  user: string
  order_id: string
  slotBooking_id: string
  amount: number
  currency: string
  method: PaymentMethod
  provider: string
  status: PaymentStatus
  providerOrderId: string | null
  transactionId: string | null
  signature: string | null
  gatewayResponse: unknown | null
  paidAt: string | null
  failureReason: string | null
  attempt: number
  refunds: unknown[]
  createdAt: string
  updatedAt: string
}

export interface OrderStatusHistory {
  status: string
  note: string
  changedAt: string
}

export interface OrderDetails {
  pricing: OrderPricing
  cancellation: OrderCancellation
  _id: string
  orderNumber: string
  user: string
  address_id: string
  slotBooking_id: string
  vendor_id: string | null
  items: OrderItem[]
  couponCode: string | null
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  payment_id: OrderPayment
  status: OrderStatus
  statusHistory: OrderStatusHistory[]
  deliveredAt: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface GetOrdersParams {
  page?: number
  limit?: number
  status?: OrderStatus
  search?: string
}

export interface OrderPagination {
  page: number
  limit: number
  total: number
  pages: number
}

export interface GetOrdersResponse {
  success: boolean
  code: number
  message: string
  data: Order[]
  pagination: OrderPagination
}

export interface GetOrderByIdResponse {
  success: boolean
  code: number
  message: string
  data: OrderDetails
}


export interface UpdateOrderStatusRequest {
  orderId: string;
  status: OrderStatus;
}

export interface UpdateOrderStatusResponse {
  success: boolean;
  code: number;
  message: string;
  data: OrderDetails;
}