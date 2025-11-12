"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { MapPicker } from "@/components/map-picker"
import { useCart } from "@/lib/contexts/cart-context"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Loader2, MapPin } from "lucide-react"
import Image from "next/image"

export default function CheckoutPage() {
  const router = useRouter()
  const { items, totalPrice, clearCart } = useCart()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [showMapPicker, setShowMapPicker] = useState(false)

  // Delivery address fields
  const [label, setLabel] = useState("")
  const [addressLine, setAddressLine] = useState("")
  const [building, setBuilding] = useState("")
  const [roomNumber, setRoomNumber] = useState("")
  const [campusZone, setCampusZone] = useState("")
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [deliveryNotes, setDeliveryNotes] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<
    "stripe" | "mtn_mobile_money" | "airtel_money" | "cash_on_delivery"
  >("cash_on_delivery")

  const deliveryFee = 2000
  const total = totalPrice + deliveryFee

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

      setUser(user)
    }

    checkUser()
  }, [router])

  useEffect(() => {
    if (items.length === 0) {
      router.push("/cart")
    }
  }, [items, router])

  const handleLocationSelect = (lat: number, lng: number) => {
    setLatitude(lat)
    setLongitude(lng)
    setShowMapPicker(false)
    toast({
      title: "Location selected",
      description: `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClient()

      // Create delivery address
      const { data: addressData, error: addressError } = await supabase
        .from("delivery_addresses")
        .insert({
          user_id: user.id,
          label,
          address_line: addressLine,
          building: building || null,
          room_number: roomNumber || null,
          campus_zone: campusZone,
          latitude,
          longitude,
          is_default: false,
        })
        .select()
        .single()

      if (addressError) throw addressError

      // Generate order number
      const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`

      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          order_number: orderNumber,
          status: "pending",
          payment_method: paymentMethod,
          payment_status: paymentMethod === "cash_on_delivery" ? "pending" : "pending",
          subtotal: totalPrice,
          delivery_fee: deliveryFee,
          total: total,
          delivery_address_id: addressData.id,
          delivery_notes: deliveryNotes || null,
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Create order items
      const orderItems = items.map((item) => ({
        order_id: orderData.id,
        product_id: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
      }))

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

      if (itemsError) throw itemsError

      // Create delivery record with QR code
      const qrCode = `QR-${orderData.id}-${Date.now()}`
      const { error: deliveryError } = await supabase.from("deliveries").insert({
        order_id: orderData.id,
        qr_code: qrCode,
        status: "pending",
      })

      if (deliveryError) throw deliveryError

      // Clear cart
      clearCart()

      toast({
        title: "Order placed successfully!",
        description: `Your order ${orderNumber} has been placed.`,
      })

      if (paymentMethod !== "cash_on_delivery") {
        router.push(`/checkout/payment?orderId=${orderData.id}&method=${paymentMethod}`)
      } else {
        router.push(`/orders/${orderData.id}`)
      }
    } catch (error: any) {
      console.error("[v0] Error creating order:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to place order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!user || items.length === 0) {
    return null
  }

  return (
    <div className="min-h-screen">
      <Header />

      <div className="container py-8">
        <h1 className="mb-8 text-3xl font-bold">Checkout</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {/* Delivery Address */}
              <Card>
                <CardHeader>
                  <CardTitle>Delivery Address</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="label">Address Label *</Label>
                      <Input
                        id="label"
                        placeholder="e.g., Hostel, Dorm"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="campusZone">Campus Zone *</Label>
                      <Input
                        id="campusZone"
                        placeholder="e.g., Main Campus, East Wing"
                        value={campusZone}
                        onChange={(e) => setCampusZone(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="addressLine">Address Line *</Label>
                    <Input
                      id="addressLine"
                      placeholder="Street address or landmark"
                      value={addressLine}
                      onChange={(e) => setAddressLine(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="building">Building</Label>
                      <Input
                        id="building"
                        placeholder="Building name or number"
                        value={building}
                        onChange={(e) => setBuilding(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="roomNumber">Room Number</Label>
                      <Input
                        id="roomNumber"
                        placeholder="Room or apartment number"
                        value={roomNumber}
                        onChange={(e) => setRoomNumber(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Delivery Location (Optional)</Label>
                    {!showMapPicker && (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full bg-transparent"
                        onClick={() => setShowMapPicker(true)}
                      >
                        <MapPin className="mr-2 h-4 w-4" />
                        {latitude && longitude ? "Change Location on Map" : "Select Location on Map"}
                      </Button>
                    )}
                    {latitude && longitude && !showMapPicker && (
                      <p className="text-sm text-muted-foreground">
                        Selected: {latitude.toFixed(6)}, {longitude.toFixed(6)}
                      </p>
                    )}
                    {showMapPicker && (
                      <div className="space-y-2">
                        <MapPicker
                          onLocationSelect={handleLocationSelect}
                          initialLat={latitude || 0.3476}
                          initialLng={longitude || 32.5825}
                        />
                        <Button type="button" variant="ghost" onClick={() => setShowMapPicker(false)}>
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deliveryNotes">Delivery Notes</Label>
                    <Textarea
                      id="deliveryNotes"
                      placeholder="Any special instructions for delivery"
                      value={deliveryNotes}
                      onChange={(e) => setDeliveryNotes(e.target.value)}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                    <div className="flex items-center space-x-2 rounded-lg border p-4">
                      <RadioGroupItem value="cash_on_delivery" id="cash" />
                      <Label htmlFor="cash" className="flex-1 cursor-pointer">
                        Cash on Delivery
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 rounded-lg border p-4">
                      <RadioGroupItem value="mtn_mobile_money" id="mtn" />
                      <Label htmlFor="mtn" className="flex-1 cursor-pointer">
                        MTN Mobile Money
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 rounded-lg border p-4">
                      <RadioGroupItem value="airtel_money" id="airtel" />
                      <Label htmlFor="airtel" className="flex-1 cursor-pointer">
                        Airtel Money
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 rounded-lg border p-4">
                      <RadioGroupItem value="stripe" id="stripe" />
                      <Label htmlFor="stripe" className="flex-1 cursor-pointer">
                        Credit/Debit Card (Stripe)
                      </Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div>
              <Card className="sticky top-20">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div key={item.product.id} className="flex gap-3">
                        <div className="relative h-16 w-16 overflow-hidden rounded-lg bg-muted">
                          <Image
                            src={item.product.image_url || `/placeholder.svg?height=64&width=64`}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{item.product.name}</p>
                          <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                        <p className="text-sm font-medium">
                          UGX {(item.product.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">UGX {totalPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Delivery Fee</span>
                      <span className="font-medium">UGX {deliveryFee.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-bold">Total</span>
                      <span className="font-bold text-primary">UGX {total.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    type="submit"
                    className="w-full bg-secondary hover:bg-secondary/90"
                    size="lg"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Placing Order...
                      </>
                    ) : (
                      "Place Order"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
