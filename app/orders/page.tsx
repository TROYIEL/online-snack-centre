"use client";

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Package } from "lucide-react"
import Link from "next/link"
import type { Order } from "@/lib/types/database"

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  const supabase = createClient()

  const fetchOrders = useCallback(async (userId: string) => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching orders:", error)
    } else {
      setOrders(data || [])
    }
    setIsLoading(false)
  }, [supabase])

  // Effect 1: Authentication check and initial fetch
  useEffect(() => {
    const authCheck = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      setUser(user)
      fetchOrders(user.id) // Fetch initial data
    }
    authCheck()
  }, [router, supabase, fetchOrders])


  // Effect 2: Supabase Real-time Subscription for instant updates
  useEffect(() => {
    if (!user) return; // Wait for user to be authenticated

    // Set up the real-time channel
    const ordersChannel = supabase
      .channel('user_orders_updates')
      .on<Order>(
        'postgres_changes',
        { 
          event: '*', // Listen for INSERT, UPDATE, DELETE
          schema: 'public', 
          table: 'orders',
          filter: `user_id=eq.${user.id}` // Filter orders specific to this user
        },
        (payload) => {
          // A change happened, re-fetch the entire list to ensure consistency and correct sorting
          // For high-volume apps, direct state manipulation (insert/update/delete) is better, 
          // but re-fetching is safer and easier to maintain consistency.
          console.log('Realtime change received:', payload.eventType);
          fetchOrders(user.id);
        }
      )
      .subscribe();

    // Cleanup function to unsubscribe when the component unmounts
    return () => {
      ordersChannel.unsubscribe();
    };
  }, [user, supabase, fetchOrders]); // Dependency on user ensures subscription starts only after login

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

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500",
      paid: "bg-green-500",
      failed: "bg-red-500",
      refunded: "bg-gray-500",
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

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container py-8">
        <h1 className="mb-8 text-4xl font-extrabold text-gray-900">My Orders</h1>

        {orders.length === 0 ? (
          <Card className="border-2 border-dashed border-gray-300">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Package className="h-16 w-16 text-gray-400 mb-6" />
              <h3 className="text-2xl font-semibold mb-2 text-gray-700">No orders yet</h3>
              <p className="text-gray-500 mb-8">Start shopping to place your first order!</p>
              <Button asChild className="px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl">
                <Link href="/products">Browse Snacks</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="hover:border-primary transition-all duration-200">
                <CardHeader className="p-4 sm:p-6 pb-0">
                  <div className="flex items-start justify-between">
                    <div>
                      {/* Assuming order_number is part of the Order type */}
                      <CardTitle className="text-xl font-bold text-indigo-700">Order #{order.order_number || order.id.substring(0, 8)}</CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        Placed on: {new Date(order.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={`px-3 py-1 font-semibold ${getStatusColor(order.status)}`}>
                        {order.status.replace(/_/g, " ").toUpperCase()}
                      </Badge>
                      <Badge variant="secondary" className={`px-3 py-1 font-semibold text-white ${getPaymentStatusColor(order.payment_status)}`}>
                        {order.payment_status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Payment Method</p>
                      <p className="font-medium text-gray-900">
                        {order.payment_method.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-sm text-gray-500">Total Amount</p>
                      <p className="text-2xl font-extrabold text-green-600">UGX {order.total.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="mt-6">
                    <Button asChild variant="outline" className="w-full bg-white border-indigo-200 text-indigo-600 hover:bg-indigo-50">
                      <Link href={`/orders/${order.id}`}>View Details</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}