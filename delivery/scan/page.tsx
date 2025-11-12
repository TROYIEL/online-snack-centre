"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Loader2, QrCode, CheckCircle, Package } from "lucide-react"

export default function ScanQRPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [qrCode, setQrCode] = useState("")
  const [isScanning, setIsScanning] = useState(false)
  const [delivery, setDelivery] = useState<any>(null)

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      // Check if user is delivery personnel
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

      if (profile?.role !== "delivery_personnel" && profile?.role !== "admin") {
        toast({
          title: "Access Denied",
          description: "Only delivery personnel can access this page.",
          variant: "destructive",
        })
        router.push("/")
        return
      }

      setUser(user)
    }

    checkUser()
  }, [router, toast])

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsScanning(true)

    try {
      const supabase = createClient()

      // Find delivery by QR code
      const { data: deliveryData, error: deliveryError } = await supabase
        .from("deliveries")
        .select("*, order:orders(*)")
        .eq("qr_code", qrCode.trim())
        .single()

      if (deliveryError || !deliveryData) {
        throw new Error("Invalid QR code or delivery not found")
      }

      setDelivery(deliveryData)
    } catch (error: any) {
      console.error("[v0] Error scanning QR code:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to scan QR code.",
        variant: "destructive",
      })
    } finally {
      setIsScanning(false)
    }
  }

  const handleUpdateStatus = async (newStatus: string) => {
    if (!delivery) return

    setIsScanning(true)

    try {
      const supabase = createClient()

      const updates: any = {
        status: newStatus,
        delivery_person_id: user.id,
      }

      if (newStatus === "delivered") {
        updates.actual_delivery_time = new Date().toISOString()
      }

      if (newStatus === "in_transit" && !delivery.estimated_delivery_time) {
        // Set estimated delivery time to 30 minutes from now
        const estimatedTime = new Date()
        estimatedTime.setMinutes(estimatedTime.getMinutes() + 30)
        updates.estimated_delivery_time = estimatedTime.toISOString()
      }

      const { error: deliveryError } = await supabase.from("deliveries").update(updates).eq("id", delivery.id)

      if (deliveryError) throw deliveryError

      // Update order status
      let orderStatus = delivery.order.status
      if (newStatus === "picked_up") orderStatus = "out_for_delivery"
      if (newStatus === "delivered") orderStatus = "delivered"

      const { error: orderError } = await supabase
        .from("orders")
        .update({ status: orderStatus })
        .eq("id", delivery.order_id)

      if (orderError) throw orderError

      toast({
        title: "Status Updated",
        description: `Delivery status updated to ${newStatus.replace(/_/g, " ")}`,
      })

      // Refresh delivery data
      const { data: updatedDelivery } = await supabase
        .from("deliveries")
        .select("*, order:orders(*)")
        .eq("id", delivery.id)
        .single()

      setDelivery(updatedDelivery)
    } catch (error: any) {
      console.error("[v0] Error updating status:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update status.",
        variant: "destructive",
      })
    } finally {
      setIsScanning(false)
    }
  }

  const handleReset = () => {
    setDelivery(null)
    setQrCode("")
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen">
      <Header />

      <div className="container py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="mb-8 text-3xl font-bold">QR Code Scanner</h1>

          {!delivery ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  Scan Delivery QR Code
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleScan} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="qrCode">QR Code</Label>
                    <Input
                      id="qrCode"
                      placeholder="Enter or scan QR code"
                      value={qrCode}
                      onChange={(e) => setQrCode(e.target.value)}
                      required
                      autoFocus
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter the QR code manually or use a QR scanner app to scan
                    </p>
                  </div>

                  <Button type="submit" disabled={isScanning} className="w-full" size="lg">
                    {isScanning ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Scanning...
                      </>
                    ) : (
                      <>
                        <QrCode className="mr-2 h-4 w-4" />
                        Scan QR Code
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>Delivery Details</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">Order: {delivery.order.order_number}</p>
                    </div>
                    <Button variant="outline" onClick={handleReset}>
                      Scan Another
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Current Status</p>
                      <p className="font-semibold">{delivery.status.replace(/_/g, " ").toUpperCase()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Order Total</p>
                      <p className="font-semibold">UGX {delivery.order.total.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Payment Method</p>
                      <p className="font-semibold">
                        {delivery.order.payment_method
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Payment Status</p>
                      <p className="font-semibold">{delivery.order.payment_status.toUpperCase()}</p>
                    </div>
                  </div>

                  {delivery.order.delivery_notes && (
                    <div className="rounded-lg border p-4 bg-muted/50">
                      <p className="text-sm font-semibold mb-1">Delivery Notes:</p>
                      <p className="text-sm">{delivery.order.delivery_notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Update Delivery Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {delivery.status === "pending" && (
                    <Button
                      onClick={() => handleUpdateStatus("assigned")}
                      disabled={isScanning}
                      className="w-full"
                      size="lg"
                    >
                      {isScanning ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Package className="mr-2 h-4 w-4" />
                      )}
                      Accept Delivery
                    </Button>
                  )}

                  {delivery.status === "assigned" && (
                    <Button
                      onClick={() => handleUpdateStatus("picked_up")}
                      disabled={isScanning}
                      className="w-full"
                      size="lg"
                    >
                      {isScanning ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Package className="mr-2 h-4 w-4" />
                      )}
                      Mark as Picked Up
                    </Button>
                  )}

                  {delivery.status === "picked_up" && (
                    <Button
                      onClick={() => handleUpdateStatus("in_transit")}
                      disabled={isScanning}
                      className="w-full"
                      size="lg"
                    >
                      {isScanning ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Package className="mr-2 h-4 w-4" />
                      )}
                      Start Delivery
                    </Button>
                  )}

                  {delivery.status === "in_transit" && (
                    <Button
                      onClick={() => handleUpdateStatus("delivered")}
                      disabled={isScanning}
                      className="w-full bg-green-600 hover:bg-green-700"
                      size="lg"
                    >
                      {isScanning ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="mr-2 h-4 w-4" />
                      )}
                      Mark as Delivered
                    </Button>
                  )}

                  {delivery.status === "delivered" && (
                    <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-semibold text-green-900">Delivery Completed</p>
                          <p className="text-sm text-green-700">
                            Delivered at {new Date(delivery.actual_delivery_time).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
