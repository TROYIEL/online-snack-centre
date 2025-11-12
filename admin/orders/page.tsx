"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"
import type { Order } from "@/lib/types/database"

export default function AdminOrdersPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    const checkAdminAndFetchOrders = async () => {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

      if (!profile || profile.role !== "admin") {
        router.push("/")
        return
      }

      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false })

      if (!error && data) {
        setOrders(data)
      }

      setIsLoading(false)
    }

    checkAdminAndFetchOrders()
  }, [router])

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500",
      confirmed: "bg-blue-500",
      preparing: "bg-purple-500",
      ready_for_delivery: "bg-orange-500",
      out_for_delivery: "bg-indigo-500",
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

  return (
    <div className="min-h-screen">
      <Header />

      <div className="container py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Manage Orders</h1>
          <Button variant="ghost" onClick={() => router.push("/admin")}>
            ← Back to Dashboard
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Orders ({orders.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/orders/${order.id}`)}
                >
                  <div className="space-y-1">
                    <p className="font-semibold">{order.order_number}</p>
                    <p className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold">UGX {order.total.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {order.payment_method.replace(/_/g, " ")}
                      </p>
                    </div>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status.replace(/_/g, " ").toUpperCase()}
                    </Badge>
                  </div>
                </div>
              ))}

              {orders.length === 0 && <div className="py-12 text-center text-muted-foreground">No orders found</div>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
