import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Product, Category } from "@/lib/types/database";


// Dummy products for fallback
const dummyProducts = [
  { id: 101, name: "beef Gorillos ", price:2000, image_url: "https://oztcaeveyhffpbgvzurx.supabase.co/storage/v1/object/public/products/beef.webp" },
  { id: 102, name: "Pringles Snacks", price: 15000, image_url: "https://oztcaeveyhffpbgvzurx.supabase.co/storage/v1/object/public/products/25449510_MzAwLTMwMC1mYTdkYWE5YzA5.webp" },
  { id: 103, name: "Coated Groundnuts", price: 10000, image_url: "https://oztcaeveyhffpbgvzurx.supabase.co/storage/v1/object/public/products/26366476_MzAwLTIyNS1kZGI5NjllMGE5.webp" },
  { id: 104, name: "Rihanna Digestive Biscuits", price: 30000, image_url: "https://oztcaeveyhffpbgvzurx.supabase.co/storage/v1/object/public/products/27024883_MzAwLTMzNi0yMDRjZjkzNWFk.webp" },
  { id: 105, name: "Crunchy Bagia", price: 1300, image_url: "https://oztcaeveyhffpbgvzurx.supabase.co/storage/v1/object/public/products/Baggia-100g-scaled-300x450.jpg" },
  { id: 106, name: "Coated Peanuts", price: 1300, image_url: "https://oztcaeveyhffpbgvzurx.supabase.co/storage/v1/object/public/products/Coated-Peanuts-150g-scaled-300x450.jpg" },
  { id: 107, name: "GORILLO-PIZZA-FLAVOUR", price: 2500, image_url: "https://oztcaeveyhffpbgvzurx.supabase.co/storage/v1/object/public/products/GORILLO-PIZZA-FLAVOUR.png" },
  { id: 108, name: "Daddies", price: 2500, image_url: "https://oztcaeveyhffpbgvzurx.supabase.co/storage/v1/object/public/products/Screenshot_20240810_115558_Gallery.jpg" },
];

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
      <Header />

      {/* Hero Section */}
      <section
        className="relative border-b bg-gradient-to-b from-primary/5 to-background bg-[url('/banner.jpg')] bg-cover bg-center bg-no-repeat"
      >
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="relative container flex flex-col items-center gap-8 py-16 text-center md:py-24 text-white">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            
          </h1>
          <p className="mx-auto max-w-2xl text-black text-gray-200">
           
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            
          </div>
        </div>
      </section>

      {/* Categories Section */}
      {categories && categories.length > 0 && (
        <section className="border-b py-12">
          <div className="container">
            <h2 className="mb-8 text-2xl font-bold">Shop by Category</h2>
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
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Featured Products</h2>
            <Button asChild variant="ghost">
              <Link href="/auth/sign-up">View All</Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {combinedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={{
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  image_url: product.image_url || "",
                }}
              />
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
