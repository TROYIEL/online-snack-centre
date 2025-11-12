"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Package, Clock, CheckCircle, XCircle, Truck } from "lucide-react"
import type { Delivery, Order } from "@/lib/types/database"
import { DeliveryMap } from "@/components/delivery-map"

interface DeliveryWithOrder extends Delivery {
  order: Order & {
    delivery_addresses: {
      latitude: number | null
      longitude: number | null
    } | null
  }
}

export default function TrackDeliveryPage() {
  const params = useParams()
  const router = useRouter()
  const deliveryId = params.id as string

  const [delivery, setDelivery] = useState<DeliveryWithOrder | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchDelivery = async () => {
      const supabase = createClient()

      const { data, error } = await supabase
        .from("deliveries")
        .select("*, order:orders(*, delivery_addresses(latitude, longitude))")
        .eq("id", deliveryId)
        .single()

      if (error || !data) {
        console.error("[v0] Error fetching delivery:", error)
        setIsLoading(false)
        return
      }

      setDelivery(data as any)
      setIsLoading(false)
    }

    fetchDelivery()

    // Set up real-time subscription for delivery updates
    const supabase = createClient()
    const channel = supabase
      .channel(`delivery-${deliveryId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "deliveries",
          filter: `id=eq.${deliveryId}`,
        },
        (payload) => {
          setDelivery((prev) => (prev ? { ...prev, ...payload.new } : null))
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [deliveryId])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />
      case "assigned":
        return <Package className="h-5 w-5 text-blue-500" />
      case "picked_up":
        return <Truck className="h-5 w-5 text-purple-500" />
      case "in_transit":
        return <Truck className="h-5 w-5 text-orange-500" />
      case "delivered":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Package className="h-5 w-5" />
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500",
      assigned: "bg-blue-500",
      picked_up: "bg-purple-500",
      in_transit: "bg-orange-500",
      delivered: "bg-green-500",
      failed: "bg-red-500",
    }
    return colors[status] || "bg-gray-500"
  }

  const deliverySteps = [
    { status: "pending", label: "Order Placed", description: "Your order has been received" },
    { status: "assigned", label: "Delivery Assigned", description: "A delivery person has been assigned" },
    { status: "picked_up", label: "Picked Up", description: "Your order has been picked up" },
    { status: "in_transit", label: "In Transit", description: "Your order is on the way" },
    { status: "delivered", label: "Delivered", description: "Your order has been delivered" },
  ]

  const getCurrentStepIndex = (status: string) => {
    return deliverySteps.findIndex((step) => step.status === status)
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

  if (!delivery) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container py-8">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Delivery not found</h3>
              <Button onClick={() => router.push("/orders")}>View Orders</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const currentStepIndex = getCurrentStepIndex(delivery.status)

  return (
    <div className="min-h-screen">
      <Header />

      <div className="container py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <Button variant="ghost" onClick={() => router.push(`/orders/${delivery.order_id}`)}>
              ← Back to Order
            </Button>
          </div>

          {delivery.order.delivery_addresses?.latitude && delivery.order.delivery_addresses?.longitude && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Live Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <DeliveryMap
                  deliveryId={deliveryId}
                  deliveryLat={delivery.order.delivery_addresses.latitude}
                  deliveryLng={delivery.order.delivery_addresses.longitude}
                  currentLat={delivery.current_latitude || undefined}
                  currentLng={delivery.current_longitude || undefined}
                />
              </CardContent>
            </Card>
          )}

          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Delivery Tracking</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Order: {delivery.order.order_number}</p>
                </div>
                <Badge className={getStatusColor(delivery.status)}>
                  {delivery.status.replace(/_/g, " ").toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted">
                  <Package className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-semibold">QR Code</p>
                    <p className="text-sm font-mono text-muted-foreground">{delivery.qr_code}</p>
                  </div>
                </div>

                {delivery.estimated_delivery_time && (
                  <div className="flex items-center gap-3 p-4 rounded-lg border">
                    <Clock className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-semibold">Estimated Delivery</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(delivery.estimated_delivery_time).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

                {delivery.actual_delivery_time && (
                  <div className="flex items-center gap-3 p-4 rounded-lg border border-green-200 bg-green-50">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="font-semibold text-green-900">Delivered At</p>
                      <p className="text-sm text-green-700">
                        {new Date(delivery.actual_delivery_time).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Delivery Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {deliverySteps.map((step, index) => {
                  const isCompleted = index <= currentStepIndex
                  const isCurrent = index === currentStepIndex

                  return (
                    <div key={step.status} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full ${
                            isCompleted ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle className="h-5 w-5" />
                          ) : (
                            <div className="h-2 w-2 rounded-full bg-current" />
                          )}
                        </div>
                        {index < deliverySteps.length - 1 && (
                          <div className={`h-12 w-0.5 ${isCompleted ? "bg-primary" : "bg-muted"}`} />
                        )}
                      </div>
                      <div className={`flex-1 ${index < deliverySteps.length - 1 ? "pb-6" : ""}`}>
                        <h4 className={`font-semibold ${isCurrent ? "text-primary" : ""}`}>{step.label}</h4>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
