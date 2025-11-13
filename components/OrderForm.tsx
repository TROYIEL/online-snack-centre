"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle, X } from "lucide-react"; // Importing icons for better UI

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
  const [success, setSuccess] = useState(false); // New state for success message

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

      // NOTE: Assuming total is calculated server-side or handled elsewhere, 
      // but client-side total calculation is omitted here for simplicity.
      const { error } = await supabase.from("orders").insert([
        {
          user_id: user.id,
          product_name: productName,
          quantity,
          location,
          payment_method: paymentMethod,
          // Placeholder values for mandatory fields if not null in DB schema
          status: 'pending', 
          payment_status: 'pending',
          total: 0 // Replace with actual calculated total if available
        },
      ]);

      if (error) throw error;

      // Handle success locally instead of using alert()
      setSuccess(true);
      
      // Refresh orders on account page if callback provided (useful if OrdersPage is nested)
      if (onOrderPlaced) onOrderPlaced();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unknown error occurred during order placement.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-8 relative flex flex-col items-center text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Order Confirmed!</h2>
          <p className="text-gray-600 mb-6">Your order for "{productName}" has been successfully placed.</p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-2xl font-semibold text-center mb-4 text-gray-800">
          Order: {productName}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg border border-red-200">{error}</p>}

          {/* Location */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium mb-1 text-gray-700">Location</label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter your location around campus"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              required
            />
          </div>

          {/* Quantity */}
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium mb-1 text-gray-700">Quantity</label>
            <input
              id="quantity"
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              required
            />
          </div>

          {/* Payment */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">Payment Method</label>
            <div className="flex flex-wrap gap-4">
              <label className={`flex items-center gap-2 border rounded-lg p-3 cursor-pointer transition ${paymentMethod === "MTN Mobile Money" ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500' : 'hover:bg-gray-100'}`}>
                <input
                  type="radio"
                  name="payment"
                  value="MTN Mobile Money"
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  required
                  className="form-radio text-indigo-600"
                  checked={paymentMethod === "MTN Mobile Money"}
                />
                <span className="font-medium">MTN Mobile Money</span>
              </label>
              <label className={`flex items-center gap-2 border rounded-lg p-3 cursor-pointer transition ${paymentMethod === "Airtel Money" ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500' : 'hover:bg-gray-100'}`}>
                <input
                  type="radio"
                  name="payment"
                  value="Airtel Money"
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  required
                  className="form-radio text-indigo-600"
                  checked={paymentMethod === "Airtel Money"}
                />
                <span className="font-medium">Airtel Money</span>
              </label>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-medium"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || !paymentMethod}
            >
              {loading ? "Placing..." : "Confirm Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}