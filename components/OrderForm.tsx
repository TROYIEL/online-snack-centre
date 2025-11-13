"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function OrderForm() {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [location, setLocation] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [mobileNumber, setMobileNumber] = useState("");
  const [total, setTotal] = useState<number | "">("");

  const handleConfirmOrder = async () => {
    if (!location.trim() || !paymentMethod) {
      alert("Please fill in all required fields.");
      return;
    }

    if (!total || isNaN(Number(total))) {
      alert("Please enter a valid total amount.");
      return;
    }

    if (
      (paymentMethod === "airtel_money" || paymentMethod === "mtn_money") &&
      !mobileNumber.trim()
    ) {
      alert("Please enter your mobile money number.");
      return;
    }

    setLoading(true);

    try {
      // ✅ Get logged-in user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        alert("You must be logged in to place an order.");
        router.push("/auth/login");
        return;
      }

      // ✅ Create order data
      const newOrder = {
        user_id: user.id,
        order_number: `ORD-${Math.floor(Math.random() * 90000) + 10000}`,
        total: Number(total) * quantity,
        payment_method: paymentMethod,
        payment_status: "pending",
        status: "pending",
        location,
        quantity,
        mobile_number: mobileNumber || null,
      };

      // ✅ Insert into Supabase
      const { error: insertError } = await supabase
        .from("orders")
        .insert([newOrder]);

      if (insertError) {
        console.error("Error saving order:", insertError.message);
        alert("Failed to place order. Please try again.");
        return;
      }

      // ✅ Send SMS confirmation
      if (mobileNumber) {
        const smsResponse = await fetch("/api/send-sms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phoneNumber: mobileNumber,
            message: `Hello! Your order ${newOrder.order_number} of UGX ${(Number(
              total
            ) * quantity).toLocaleString()} has been received. We’ll confirm shortly.`,
          }),
        });

        if (!smsResponse.ok) {
          console.error("SMS failed to send:", await smsResponse.text());
        } else {
          console.log("SMS confirmation sent successfully.");
        }
      }

      alert("Order placed successfully!");
      router.push("/orders");
    } catch (err) {
      console.error("Error placing order:", err);
      alert("An error occurred while placing the order.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setPaymentMethod(null);
    setLocation("");
    setQuantity(1);
    setMobileNumber("");
    setTotal("");
  };

  return (
    <div className="max-w-md mx-auto bg-white shadow-lg rounded-2xl p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Checkout</h2>

      {/* Total Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Total Amount (UGX)
        </label>
        <input
          type="number"
          min={1000}
          value={total}
          onChange={(e) => setTotal(e.target.value === "" ? "" : Number(e.target.value))}
          placeholder="Enter total amount"
          className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>

      {/* Location Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Delivery Location
        </label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Enter your delivery address"
          className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>

      {/* Quantity */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Quantity
        </label>
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>

      {/* Payment Method */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Payment Method
        </label>
        <div className="flex flex-col gap-2">
          {["airtel_money", "mtn_money", "cash_on_delivery"].map((method) => (
            <label
              key={method}
              className={`flex items-center gap-3 border rounded-lg px-4 py-2 cursor-pointer transition ${
                paymentMethod === method
                  ? "border-indigo-600 bg-indigo-50"
                  : "border-gray-300"
              }`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={method}
                checked={paymentMethod === method}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="accent-indigo-600"
              />
              <span className="capitalize">{method.replace(/_/g, " ")}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Mobile Number (only for Airtel or MTN) */}
      {(paymentMethod === "airtel_money" || paymentMethod === "mtn_money") && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mobile Money Number
          </label>
          <input
            type="tel"
            placeholder="e.g. 0771234567"
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
      )}

      {/* Buttons */}
      <div className="flex justify-between items-center gap-3">
        <button
          onClick={handleCancel}
          className="w-1/2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          disabled={loading}
        >
          Cancel
        </button>

        <button
          onClick={handleConfirmOrder}
          disabled={loading || !paymentMethod}
          className="w-1/2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Placing..." : "Confirm Order"}
        </button>
      </div>
    </div>
  );
}
