"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Loader2, CreditCard, Smartphone, CheckCircle } from "lucide-react"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

function StripePaymentForm({ orderId, amount }: { orderId: string; amount: number }) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      })

      if (error) {
        throw new Error(error.message)
      }

      if (paymentIntent && paymentIntent.status === "succeeded") {
        // Confirm payment on backend
        await fetch("/api/confirm-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            paymentIntentId: paymentIntent.id,
          }),
        })

        toast({
          title: "Payment successful!",
          description: "Your order has been confirmed.",
        })

        router.push(`/orders/${orderId}`)
      }
    } catch (error: any) {
      console.error("[v0] Payment error:", error)
      toast({
        title: "Payment failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button type="submit" disabled={!stripe || isProcessing} className="w-full" size="lg">
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>Pay UGX {amount.toLocaleString()}</>
        )}
      </Button>
    </form>
  )
}

function MobileMoneyPayment({ orderId, amount, provider }: { orderId: string; amount: number; provider: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [transactionId, setTransactionId] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)

  const handleInitiate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)

    try {
      const response = await fetch("/api/mobile-money/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          phoneNumber,
          provider,
          amount,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error)
      }

      setTransactionId(data.transactionId)
      toast({
        title: "Payment initiated",
        description: data.message,
      })
    } catch (error: any) {
      console.error("[v0] Mobile money error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to initiate payment.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleVerify = async () => {
    setIsVerifying(true)

    try {
      const response = await fetch("/api/mobile-money/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          transactionId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error)
      }

      toast({
        title: "Payment verified!",
        description: "Your order has been confirmed.",
      })

      router.push(`/orders/${orderId}`)
    } catch (error: any) {
      console.error("[v0] Verification error:", error)
      toast({
        title: "Verification failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsVerifying(false)
    }
  }

  if (transactionId) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-semibold text-green-900">Payment request sent!</p>
              <p className="text-sm text-green-700 mt-1">
                Please check your phone and enter your PIN to complete the payment.
              </p>
              <p className="text-xs text-green-600 mt-2 font-mono">Transaction ID: {transactionId}</p>
            </div>
          </div>
        </div>

        <Button onClick={handleVerify} disabled={isVerifying} className="w-full" size="lg">
          {isVerifying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying Payment...
            </>
          ) : (
            "I've Completed the Payment"
          )}
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleInitiate} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="256XXXXXXXXX"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          required
        />
        <p className="text-xs text-muted-foreground">
          Enter your {provider === "mtn" ? "MTN" : "Airtel"} Mobile Money number
        </p>
      </div>

      <div className="rounded-lg border p-4 bg-muted/50">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Amount to pay</span>
          <span className="text-lg font-bold">UGX {amount.toLocaleString()}</span>
        </div>
      </div>

      <Button type="submit" disabled={isProcessing} className="w-full" size="lg">
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Initiating Payment...
          </>
        ) : (
          <>
            <Smartphone className="mr-2 h-4 w-4" />
            Send Payment Request
          </>
        )}
      </Button>
    </form>
  )
}

export default function PaymentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get("orderId")
  const paymentMethod = searchParams.get("method") as "stripe" | "mtn_mobile_money" | "airtel_money"

  const [order, setOrder] = useState<any>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchOrderAndSetupPayment = async () => {
      if (!orderId || !paymentMethod) {
        router.push("/checkout")
        return
      }

      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      // Fetch order
      const { data: orderData, error } = await supabase.from("orders").select("*").eq("id", orderId).single()

      if (error || !orderData) {
        router.push("/orders")
        return
      }

      setOrder(orderData)

      // Setup Stripe payment if needed
      if (paymentMethod === "stripe") {
        const response = await fetch("/api/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: orderData.total,
            orderId: orderData.id,
            orderNumber: orderData.order_number,
          }),
        })

        const data = await response.json()
        setClientSecret(data.clientSecret)
      }

      setIsLoading(false)
    }

    fetchOrderAndSetupPayment()
  }, [orderId, paymentMethod, router])

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
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Button variant="ghost" onClick={() => router.push("/checkout")}>
              ← Back to Checkout
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {paymentMethod === "stripe" ? (
                  <>
                    <CreditCard className="h-5 w-5" />
                    Card Payment
                  </>
                ) : (
                  <>
                    <Smartphone className="h-5 w-5" />
                    {paymentMethod === "mtn_mobile_money" ? "MTN Mobile Money" : "Airtel Money"}
                  </>
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground">Order: {order.order_number}</p>
            </CardHeader>
            <CardContent>
              {paymentMethod === "stripe" && clientSecret ? (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <StripePaymentForm orderId={order.id} amount={order.total} />
                </Elements>
              ) : paymentMethod === "mtn_mobile_money" || paymentMethod === "airtel_money" ? (
                <MobileMoneyPayment
                  orderId={order.id}
                  amount={order.total}
                  provider={paymentMethod === "mtn_mobile_money" ? "mtn" : "airtel"}
                />
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
