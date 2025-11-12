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

    const { orderId, transactionId } = await request.json()

    // In a real implementation, you would verify the payment status with the provider's API
    // For now, we'll simulate a successful payment after a delay

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Update order payment status
    const { error } = await supabase
      .from("orders")
      .update({
        payment_status: "paid",
        status: "confirmed",
      })
      .eq("id", orderId)
      .eq("user_id", user.id)

    if (error) throw error

    return NextResponse.json({
      success: true,
      status: "paid",
      message: "Payment verified successfully",
    })
  } catch (error: any) {
    console.error("[v0] Error verifying mobile money payment:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
