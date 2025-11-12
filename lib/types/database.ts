export type UserRole = "customer" | "delivery_personnel" | "admin"

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready_for_delivery"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"

export type PaymentMethod = "stripe" | "mtn_mobile_money" | "airtel_money" | "cash_on_delivery"

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded"

export type DeliveryStatus = "pending" | "assigned" | "picked_up" | "in_transit" | "delivered" | "failed"

export interface Profile {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  role: UserRole
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface DeliveryAddress {
  id: string
  user_id: string
  label: string
  address_line: string
  building: string | null
  room_number: string | null
  campus_zone: string
  latitude: number | null
  longitude: number | null
  is_default: boolean
  created_at: string
}

export interface Category {
  id: string
  name: string
  description: string | null
  image_url: string | null
  created_at: string
}

export interface Product {
  id: string
  name: string
  description: string | null
  category_id: string | null
  price: number
  image_url: string | null
  stock_quantity: number
  is_available: boolean
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  user_id: string
  order_number: string
  status: OrderStatus
  payment_method: PaymentMethod
  payment_status: PaymentStatus
  subtotal: number
  delivery_fee: number
  total: number
  delivery_address_id: string | null
  delivery_notes: string | null
  stripe_payment_intent_id: string | null
  mobile_money_transaction_id: string | null
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  price: number
  created_at: string
}

export interface Delivery {
  id: string
  order_id: string
  delivery_person_id: string | null
  qr_code: string
  status: DeliveryStatus
  current_latitude: number | null
  current_longitude: number | null
  estimated_delivery_time: string | null
  actual_delivery_time: string | null
  delivery_notes: string | null
  created_at: string
  updated_at: string
}

export interface Review {
  id: string
  order_id: string
  user_id: string
  product_id: string
  rating: number
  comment: string | null
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: "order" | "delivery" | "payment" | "system"
  is_read: boolean
  created_at: string
}
