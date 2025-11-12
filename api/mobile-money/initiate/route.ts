import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { orderId, phoneNumber, provider, amount } = await request.json()

    // In a real implementation, you would integrate with MTN or Airtel Mobile Money APIs
    // For now, we'll simulate the process

    // Generate a transaction ID
    const transactionId = `MM-${provider.toUpperCase()}-${Date.now()}-${Math.floor(Math.random() * 10000)}`

    // Update order with mobile money transaction ID
    await supabase
      .from("orders")
      .update({
        mobile_money_transaction_id: transactionId,
        payment_status: "pending",
      })
      .eq("id", orderId)
      .eq("user_id", user.id)

    // In production, you would:
    // 1. Call the mobile money provider's API to initiate payment
    // 2. Return the transaction reference
    // 3. Set up a webhook to receive payment confirmation
    // 4. Update order status when payment is confirmed

    return NextResponse.json({
      success: true,
      transactionId,
      message: `Payment request sent to ${phoneNumber}. Please check your phone to complete the payment.`,
    })
  } catch (error: any) {
    console.error("[v0] Error initiating mobile money payment:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
