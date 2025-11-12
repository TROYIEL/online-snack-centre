// app/products/page.tsx
import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { ProductCard } from "@/components/product-card"
import type { Product } from "@/lib/types/database"

export default async function ProductsPage() {
  const supabase = await createClient()

  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .order("id", { ascending: false }) // safer for now

  if (error) console.error("❌ Supabase error:", error.message)

  const fallbackProducts: Product[] = [
    {
      id: 1,
      name: "beef Gorillos",
      price: 2500,
      description: "To be delivered around bugema university.",
      image_url: "https://oztcaeveyhffpbgvzurx.supabase.co/storage/v1/object/public/products/beef.webp",
    },
    {
      id: 1,
      name: "beef Gorillos",
      price: 2500,
      description: "To be delivered around bugema university.",
      image_url: "https://oztcaeveyhffpbgvzurx.supabase.co/storage/v1/object/public/products/beef.webp",
    },
    {
      id: 1,
      name: "beef Gorillos",
      price: 2500,
      description: "To be delivered around bugema university.",
      image_url: "https://oztcaeveyhffpbgvzurx.supabase.co/storage/v1/object/public/products/beef.webp",
    },
    {
      id: 1,
      name: "beef Gorillos",
      price: 2500,
      description: "To be delivered around bugema university.",
      image_url: "https://oztcaeveyhffpbgvzurx.supabase.co/storage/v1/object/public/products/beef.webp",
    },
    {
      id: 1,
      name: "beef Gorillos",
      price: 2500,
      description: "To be delivered around bugema university.",
      image_url: "https://oztcaeveyhffpbgvzurx.supabase.co/storage/v1/object/public/products/beef.webp",
    },
    {
      id: 1,
      name: "beef Gorillos",
      price: 2500,
      description: "To be delivered around bugema university.",
      image_url: "https://oztcaeveyhffpbgvzurx.supabase.co/storage/v1/object/public/products/beef.webp",
    },
    {
      id: 1,
      name: "beef Gorillos",
      price: 2500,
      description: "To be delivered around bugema university.",
      image_url: "https://oztcaeveyhffpbgvzurx.supabase.co/storage/v1/object/public/products/beef.webp",
    },
    {
      id: 1,
      name: "beef Gorillos",
      price: 2500,
      description: "To be delivered around bugema university.",
      image_url: "https://oztcaeveyhffpbgvzurx.supabase.co/storage/v1/object/public/products/beef.webp",
    },
    {
      id: 1,
      name: "beef Gorillos",
      price: 2500,
      description: "To be delivered around bugema university.",
      image_url: "https://oztcaeveyhffpbgvzurx.supabase.co/storage/v1/object/public/products/beef.webp",
    },
    {
      id: 1,
      name: "beef Gorillos",
      price: 2500,
      description: "To be delivered around bugema university.",
      image_url: "https://oztcaeveyhffpbgvzurx.supabase.co/storage/v1/object/public/products/beef.webp",
    },
    {
      id: 1,
      name: "beef Gorillos",
      price: 2500,
      description: "To be delivered around bugema university.",
      image_url: "https://oztcaeveyhffpbgvzurx.supabase.co/storage/v1/object/public/products/beef.webp",
    },
    {
      id: 1,
      name: "beef Gorillos",
      price: 2500,
      description: "To be delivered around bugema university.",
      image_url: "https://oztcaeveyhffpbgvzurx.supabase.co/storage/v1/object/public/products/beef.webp",
    },
    {
      id: 1,
      name: "beef Gorillos",
      price: 2500,
      description: "To be delivered around bugema university.",
      image_url: "https://oztcaeveyhffpbgvzurx.supabase.co/storage/v1/object/public/products/beef.webp",
    },
    {
      id: 1,
      name: "beef Gorillos",
      price: 2500,
      description: "To be delivered around bugema university.",
      image_url: "https://oztcaeveyhffpbgvzurx.supabase.co/storage/v1/object/public/products/beef.webp",
    },
    {
      id: 1,
      name: "beef Gorillos",
      price: 2500,
      description: "To be delivered around bugema university.",
      image_url: "https://oztcaeveyhffpbgvzurx.supabase.co/storage/v1/object/public/products/beef.webp",
    },
    {
      id: 1,
      name: "beef Gorillos",
      price: 2500,
      description: "To be delivered around bugema university.",
      image_url: "https://oztcaeveyhffpbgvzurx.supabase.co/storage/v1/object/public/products/beef.webp",
    },
    {
      id: 1,
      name: "beef Gorillos",
      price: 2500,
      description: "To be delivered around bugema university.",
      image_url: "https://oztcaeveyhffpbgvzurx.supabase.co/storage/v1/object/public/products/beef.webp",
    },
    {
      id: 1,
      name: "beef Gorillos",
      price: 2500,
      description: "To be delivered around bugema university.",
      image_url: "https://oztcaeveyhffpbgvzurx.supabase.co/storage/v1/object/public/products/beef.webp",
    },
    {
      id: 1,
      name: "beef Gorillos",
      price: 2500,
      description: "To be delivered around bugema university.",
      image_url: "https://oztcaeveyhffpbgvzurx.supabase.co/storage/v1/object/public/products/beef.webp",
    },
    {
      id: 1,
      name: "beef Gorillos",
      price: 2500,
      description: "To be delivered around bugema university.",
      image_url: "https://oztcaeveyhffpbgvzurx.supabase.co/storage/v1/object/public/products/beef.webp",
    },
    {
      id: 1,
      name: "beef Gorillos",
      price: 2500,
      description: "To be delivered around bugema university.",
      image_url: "https://oztcaeveyhffpbgvzurx.supabase.co/storage/v1/object/public/products/beef.webp",
    },
    {
      id: 1,
      name: "beef Gorillos",
      price: 2500,
      description: "To be delivered around bugema university.",
      image_url: "https://oztcaeveyhffpbgvzurx.supabase.co/storage/v1/object/public/products/beef.webp",
    },
    {
      id: 1,
      name: "beef Gorillos",
      price: 2500,
      description: "To be delivered around bugema university.",
      image_url: "https://oztcaeveyhffpbgvzurx.supabase.co/storage/v1/object/public/products/beef.webp",
    },
    {
      id: 1,
      name: "beef Gorillos",
      price: 2500,
      description: "To be delivered around bugema university.",
      image_url: "https://oztcaeveyhffpbgvzurx.supabase.co/storage/v1/object/public/products/beef.webp",
    },

  ]

  const productsToShow = products && products.length > 0 ? products : fallbackProducts

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
      
    </p>
  </div>
</section>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {productsToShow.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </main>
    </div>
  )
}
