"use client";

import { useState } from "react";
import type { Product } from "@/lib/types/database";
import OrderForm from "@/components/OrderForm";

export function ProductCard({ product }: { product: Product }) {
  const [showOrderForm, setShowOrderForm] = useState(false);

  return (
    <div className="group relative rounded-2xl border p-4 shadow-sm hover:shadow-md transition">
      {/* Product Image */}
      <div className="aspect-square w-full overflow-hidden rounded-xl bg-gray-100">
        <img
          src={product.image_url || "/placeholder.png"}
          alt={product.name}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Product Details */}
      <div className="mt-4 text-center space-y-1">
        <h3 className="font-semibold text-lg">{product.name}</h3>
        <p className="text-sm text-muted-foreground">
          {product.description || "No description available."}
        </p>
        <p className="text-primary font-bold mt-1">SHS {product.price}</p>
      </div>

      {/* Order Button */}
      <div className="mt-4 flex justify-center">
        <button
          className="bg-primary text-white px-4 py-2 rounded-full hover:bg-primary/80 transition"
          onClick={() => setShowOrderForm(true)}
        >
          Order
        </button>
      </div>

      {/* Order Form Popup */}
      {showOrderForm && (
        <OrderForm
          productName={product.name}
          onClose={() => setShowOrderForm(false)}
        />
      )}
    </div>
  );
}
