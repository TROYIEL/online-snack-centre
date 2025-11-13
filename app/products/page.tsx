// app/products/page.tsx
"use client"; // <--- ADD THIS LINE

import { useEffect, useState } from "react"; // <--- Import hooks
import { Header } from "@/components/header";
import { ProductCard } from "@/components/product-card";
import { createClient } from "@/lib/supabase/client"; // <--- Use client version of createClient
import type { Product } from "@/lib/types/database";
import { Loader2 } from "lucide-react";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient(); // Initialize client-side Supabase

  // --- Fallback Data (moved inside component for easier state use) ---
  const fallbackProducts: Product[] = [
    {
      id: 1,
      name: "pringles snacks",
      price: 10000,
      description: "To be delivered around bugema university.",
      image_url: "https://oztcaeveyhffpbgvzurx.supabase.co/storage/v1/object/public/products/25449510_MzAwLTMwMC1mYTdkYWE5YzA5.webp",
    },
    // ... rest of your fallback products (keep them here) ...
    {
      id: 25,
      name: "Bessa ",
      price: 5000,
      description: "To be delivered around bugema university.",
      image_url: "https://oztcaeveyhffpbgvzurx.supabase.co/storage/v1/object/public/products/638048852259665041.webp",
    },
  ];

  useEffect(() => {
    const fetchProducts = async () => {
      // Data fetching is now done client-side inside useEffect
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("id", { ascending: false });

      if (error) {
        console.error("❌ Supabase error:", error.message);
        // On error, we can still use the fallback data
        setProducts(fallbackProducts);
      } else if (data && data.length > 0) {
        setProducts(data);
      } else {
        // If data is empty but no error, use fallback
        setProducts(fallbackProducts);
      }
      setIsLoading(false);
    };

    fetchProducts();
  }, [supabase]); // Dependency on supabase client (though stable, it's good practice)

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container flex min-h-[60vh] items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      </div>
    );
  }

  const productsToShow = products.length > 0 ? products : fallbackProducts;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-10">
        <section
          className="relative mb-8 text-center rounded-2xl overflow-hidden bg-cover bg-center"
          style={{
            backgroundImage: "url('/product banner.jpg')", // put your image in /public/banners/
          }}
        >
          {/* Overlay for readability */}
          <div className="absolute inset-0 bg-black/50" />

          <div className="relative z-10 py-20 px-4 text-white">
            <h1 className="text-4xl font-bold tracking-tight"></h1>
            <p className="mt-2 text-lg">
              {/* Content here */}
            </p>
          </div>
        </section>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {productsToShow.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        
        {products.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            No products available from the database. Showing fallback.
          </div>
        )}
      </main>
    </div>
  );
}