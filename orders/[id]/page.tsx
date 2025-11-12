"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { createClient } from "@/lib/supabase/client"
import { Loader2, MapPin, Package, CreditCard, Truck } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import type { Order, OrderItem, Product, DeliveryAddress, Delivery } from "@/lib/types/database"

interface OrderWithDetails extends Order {
  order_items: (OrderItem & { product: Product })[]
  delivery_address: DeliveryAddress | null
  delivery: Delivery | null
}

export default function OrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string

  const [order, setOrder] = useState<OrderWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchOrderDetails = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      // Fetch order with related data
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .eq("user_id", user.id)
        .single()

      if (orderError || !orderData) {
        console.error("[v0] Error fetching order:", orderError)
        router.push("/orders")
        return
      }

      // Fetch order items with products
      const { data: itemsData, error: itemsError } = await supabase
        .from("order_items")
        .select("*, product:products(*)")
        .eq("order_id", orderId)

      // Fetch delivery address
      const { data: addressData } = await supabase
        .from("delivery_addresses")
        .select("*")
        .eq("id", orderData.delivery_address_id)
        .single()

      // Fetch delivery info
      const { data: deliveryData } = await supabase.from("deliveries").select("*").eq("order_id", orderId).single()

      setOrder({
        ...orderData,
        order_items: itemsData || [],
        delivery_address: addressData || null,
        delivery: deliveryData || null,
      })

      setIsLoading(false)
    }

    fetchOrderDetails()
  }, [orderId, router])

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500",
      confirmed: "bg-blue-500",
      preparing: "bg-purple-500",
      ready_for_delivery: "bg-indigo-500",
      out_for_delivery: "bg-orange-500",
      delivered: "bg-green-500",
      cancelled: "bg-red-500",
    }
    return colors[status] || "bg-gray-500"
  }

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container flex min-h-[60vh] items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (!order) {
    return null
  }

  return (
    <div className="min-h-screen">
      <Header />

      <div className="container py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.push("/orders")}>
            ← Back to Orders
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Order Info */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>Order {order.order_number}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Placed on{" "}
                      {new Date(order.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <Badge className={getStatusColor(order.status)}>
                    {order.status.replace(/_/g, " ").toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order Items
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.order_items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="relative h-20 w-20 overflow-hidden rounded-lg bg-muted">
                      <Image
                        src={item.product.image_url || `/placeholder.svg?height=80&width=80`}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{item.product.name}</h4>
                      <p className="text-sm text-muted-foreground">{item.product.description}</p>
                      <p className="text-sm mt-1">Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">UGX {(item.price * item.quantity).toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">UGX {item.price.toLocaleString()} each</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Delivery Address */}
            {order.delivery_address && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Delivery Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <p className="font-semibold">{order.delivery_address.label}</p>
                    <p className="text-sm">{order.delivery_address.address_line}</p>
                    {order.delivery_address.building && (
                      <p className="text-sm">Building: {order.delivery_address.building}</p>
                    )}
                    {order.delivery_address.room_number && (
                      <p className="text-sm">Room: {order.delivery_address.room_number}</p>
                    )}
                    <p className="text-sm">Zone: {order.delivery_address.campus_zone}</p>
                  </div>
                  {order.delivery_notes && (
                    <>
                      <Separator className="my-4" />
                      <div>
                        <p className="text-sm font-semibold mb-1">Delivery Notes:</p>
                        <p className="text-sm text-muted-foreground">{order.delivery_notes}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            {/* Payment Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Payment Method</p>
                  <p className="font-medium">
                    {order.payment_method.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Status</p>
                  <Badge variant="outline" className="mt-1">
                    {order.payment_status.toUpperCase()}
                  </Badge>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>UGX {order.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delivery Fee</span>
                    <span>UGX {order.delivery_fee.toLocaleString()}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="font-bold">Total</span>
                    <span className="font-bold text-primary">UGX {order.total.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Status */}
            {order.delivery && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Delivery Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge className="mt-1">{order.delivery.status.replace(/_/g, " ").toUpperCase()}</Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">QR Code</p>
                      <p className="font-mono text-sm mt-1">{order.delivery.qr_code}</p>
                    </div>
                    {order.delivery.estimated_delivery_time && (
                      <div>
                        <p className="text-sm text-muted-foreground">Estimated Delivery</p>
                        <p className="text-sm mt-1">
                          {new Date(order.delivery.estimated_delivery_time).toLocaleString()}
                        </p>
                      </div>
                    )}
                    <Button asChild variant="outline" className="w-full bg-transparent mt-4">
                      <Link href={`/delivery/track/${order.delivery.id}`}>Track Delivery</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
