"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface OrderFormProps {
  productName: string;
  onClose: () => void;
  onOrderPlaced?: () => void; // optional callback to refresh orders
}

export default function OrderForm({ productName, onClose, onOrderPlaced }: OrderFormProps) {
  const supabase = createClient();
  const [location, setLocation] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("You must be logged in to place an order.");

      // Insert order into Supabase
      const { error } = await supabase.from("orders").insert([
        {
          user_id: user.id,
          product_name: productName,
          quantity,
          location,
          payment_method: paymentMethod,
        },
      ]);

      if (error) throw error;

      alert("✅ Order placed successfully!");
      onClose();

      // Refresh orders on account page if callback provided
      if (onOrderPlaced) onOrderPlaced();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          ✖
        </button>

        <h2 className="text-2xl font-semibold text-center mb-4">
          Order: {productName}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-red-500">{error}</p>}

          {/* Location */}
          <div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter your location around campus"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
              required
            />
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium mb-1">Quantity</label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
              required
            />
          </div>

          {/* Payment */}
          <div>
            <label className="block text-sm font-medium mb-2">Payment Method</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 border rounded-lg p-2 cursor-pointer hover:bg-gray-100">
                <input
                  type="radio"
                  name="payment"
                  value="MTN Mobile Money"
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  required
                />
                <span>MTN Mobile Money</span>
              </label>
              <label className="flex items-center gap-2 border rounded-lg p-2 cursor-pointer hover:bg-gray-100">
                <input
                  type="radio"
                  name="payment"
                  value="Airtel Money"
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  required
                />
                <span>Airtel Money</span>
              </label>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-between mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              disabled={loading}
            >
              {loading ? "Placing..." : "Confirm Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
