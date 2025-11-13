import { createClient } from "@/lib/supabase/server";
import { Head } from "@/components/head";
import { Button } from "@/components/ui/button";
import ImageClient from "@/components/ImageClient";
import Link from "next/link";
import type { Product, Category } from "@/lib/types/database";

// Dummy products for fallback
const dummyProducts = [
  { id: 101, name: "beef Gorillos", price: 2000, image_url: "https://oztcaeveyhffpbgvzurx.supabase.co/storage/v1/object/public/products/beef.webp" },
  { id: 102, name: "Pringles Snacks", price: 15000, image_url: "https://oztcaeveyhffpbgvzurx.supabase.co/storage/v1/object/public/products/25449510_MzAwLTMwMC1mYTdkYWE5YzA5.webp" },
  { id: 103, name: "Coated Groundnuts", price: 10000, image_url: "https://oztcaeveyhffpbgvzurx.supabase.co/storage/v1/object/public/products/26366476_MzAwLTIyNS1kZGI5NjllMGE5.webp" },
  { id: 104, name: "Rihanna Digestive Biscuits", price: 30000, image_url: "https://oztcaeveyhffpbgvzurx.supabase.co/storage/v1/object/public/products/27024883_MzAwLTMzNi0yMDRjZjkzNWFk.webp" },
  { id: 105, name: "Crunchy Bagia", price: 1300, image_url: "https://oztcaeveyhffpbgvzurx.supabase.co/storage/v1/object/public/products/Baggia-100g-scaled-300x450.jpg" },
  { id: 106, name: "Coated Peanuts", price: 1300, image_url: "https://oztcaeveyhffpbgvzurx.supabase.co/storage/v1/object/public/products/Coated-Peanuts-150g-scaled-300x450.jpg" },
  { id: 107, name: "GORILLO-PIZZA-FLAVOUR", price: 2500, image_url: "https://oztcaeveyhffpbgvzurx.supabase.co/storage/v1/object/public/products/GORILLO-PIZZA-FLAVOUR.png" },
  { id: 108, name: "Daddies", price: 2500, image_url: "https://oztcaeveyhffpbgvzurx.supabase.co/storage/v1/object/public/products/Screenshot_20240810_115558_Gallery.jpg" },
];

// Helper function for currency formatting (UGX)
const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-UG', {
        style: 'currency',
        currency: 'UGX', 
        minimumFractionDigits: 0,
    }).format(price);
};

export default async function HomePage() {
  const supabase = await createClient();

  // Fetch featured products
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("is_available", true)
    .limit(8)
    .order("created_at", { ascending: false });

  // Fetch categories
  const { data: categories } = await supabase.from("categories").select("*").limit(6);

  // Combine products with dummy fallback
  const combinedProducts: (Product | typeof dummyProducts[number])[] = products && products.length > 0 ? products : dummyProducts;

  return (
    <div className="min-h-screen">
      <Head />

      {/* Hero Section */}
      <section
        className="relative border-b bg-gradient-to-b from-primary/5 to-background bg-[url('/banner.jpg')] bg-cover bg-center bg-no-repeat"
      >
        <div className="absolute inset-0 bg-black/50"></div> {/* Darker overlay for text visibility */}
        <div className="relative container flex flex-col items-center gap-8 py-16 text-center md:py-24 text-white">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl text-black-300 drop-shadow-lg">
          
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-gray-100 drop-shadow-md">
 
          </p>
        </div>
      </section>

      

      {/* Categories Section */}
      {categories && categories.length > 0 && (
        <section className="border-b py-12">
          <div className="container">
            <h2 className="mb-8 text-2xl font-bold text-center sm:text-left">Shop by Category</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
              {categories.map((category: Category) => (
                <Link
                  key={category.id}
                  href={`/products?category=${category.id}`}
                  className="group flex flex-col items-center gap-2 rounded-lg border bg-card p-4 transition-all hover:border-primary hover:shadow-md"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 transition-colors group-hover:bg-primary/20">
                    <span className="text-2xl">{category.name.charAt(0)}</span>
                  </div>
                  <span className="text-center text-sm font-medium">{category.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

     {/* Featured Products Section */}
<section className="py-12">
  <div className="container">
    <h2 className="text-3xl font-bold mb-10 text-center text-gray-800">Featured Products</h2>

    <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
      {combinedProducts.map((product) => (
        <Link
          key={product.id}
          href={`/products/${product.id}`}
          className="group block bg-card rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:scale-[1.02] hover:shadow-xl border"
        >
          <div className="relative w-full h-48 overflow-hidden">
             {/* 🚨 Use the new ImageClient component here 🚨 */}
            <ImageClient 
              src={product.image_url} 
              alt={product.name} 
              className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-80" 
            />
          </div>
          {/* ... rest of the card content ... */}
        </Link>
      ))}
    </div>
  </div>
</section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>&copy; 2025 ONLINE SNACK CENTER. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}