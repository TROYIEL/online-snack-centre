"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

type Order = {
  id: number;
  user_id: string;
  order_number: string;
  total: number;
  payment_method: string;
  payment_status: string;
  status: string;
  location: string;
  quantity: number;
  mobile_number?: string | null;
  created_at: string;
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return;

      const { data, error } = await supabase
        .from<Order>("orders")
        .select("*")
        .eq("id", Number(id))
        .single();

      if (error) {
        console.error("Error fetching order:", error);
        alert("Failed to load order.");
        router.push("/orders");
        return;
      }

      setOrder(data);
      setLoading(false);
    };

    fetchOrder();
  }, [id, supabase, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Order not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6 bg-white shadow rounded-lg">
      <h1 className="text-2xl font-bold">Order Details</h1>

      <div className="space-y-2">
        <p>
          <span className="font-semibold">Order Number:</span> {order.order_number}
        </p>
        <p>
          <span className="font-semibold">Status:</span> {order.status}
        </p>
        <p>
          <span className="font-semibold">Payment Method:</span>{" "}
          {order.payment_method.replace(/_/g, " ")}
        </p>
        <p>
          <span className="font-semibold">Payment Status:</span> {order.payment_status}
        </p>
        <p>
          <span className="font-semibold">Quantity:</span> {order.quantity}
        </p>
        <p>
          <span className="font-semibold">Delivery Location:</span> {order.location}
        </p>
        {order.mobile_number && (
          <p>
            <span className="font-semibold">Mobile Number:</span> {order.mobile_number}
          </p>
        )}
        <p>
          <span className="font-semibold">Placed At:</span>{" "}
          {new Date(order.created_at).toLocaleString()}
        </p>
      </div>

      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span>UGX {(order.total || 0).toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Delivery Fee</span>
          <span>UGX 1000</span> {/* If you have delivery fee, replace here */}
        </div>
        <div className="flex justify-between font-bold text-lg">
          <span>Total</span>
          <span>UGX {(order.total || 0).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
