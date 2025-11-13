"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"
import type { Delivery, Order } from "@/lib/types/database"

interface DeliveryWithOrder extends Delivery {
  order: Order
}

export default function AdminDeliveriesPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [deliveries, setDeliveries] = useState<DeliveryWithOrder[]>([])

  useEffect(() => {
    const checkAdminAndFetchDeliveries = async () => {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    

      const { data, error } = await supabase
        .from("deliveries")
        .select("*, order:orders(*)")
        .order("created_at", { ascending: false })

      if (!error && data) {
        setDeliveries(data as any)
      }

      setIsLoading(false)
    }

    checkAdminAndFetchDeliveries()
  }, [router])

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
          <h1 className="text-3xl font-bold">Manage Deliveries</h1>
          <Button variant="ghost" onClick={() => router.push("/admin")}>
            ← Back to Dashboard
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Deliveries ({deliveries.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {deliveries.map((delivery) => (
                <div
                  key={delivery.id}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/delivery/track/${delivery.id}`)}
                >
                  <div className="space-y-1">
                    <p className="font-semibold">Order: {delivery.order.order_number}</p>
                    <p className="text-sm font-mono text-muted-foreground">QR: {delivery.qr_code}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(delivery.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className={getStatusColor(delivery.status)}>
                      {delivery.status.replace(/_/g, " ").toUpperCase()}
                    </Badge>
                  </div>
                </div>
              ))}

              {deliveries.length === 0 && (
                <div className="py-12 text-center text-muted-foreground">No deliveries found</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
