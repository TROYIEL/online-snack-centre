import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { amount, orderId, orderNumber } = await request.json()

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Stripe expects amount in cents/smallest currency unit
      currency: "ugx",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        orderId,
        orderNumber,
        userId: user.id,
      },
    })

    // Update order with payment intent ID
    await supabase
      .from("orders")
      .update({
        stripe_payment_intent_id: paymentIntent.id,
      })
      .eq("id", orderId)
      .eq("user_id", user.id)

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })
  } catch (error: any) {
    console.error("[v0] Error creating payment intent:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
