"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Plus } from "lucide-react"
import Image from "next/image"
import type { Product } from "@/lib/types/database"
// 1. Import the new server action
import { revalidateProductsPage } from "./actions" // Adjust path as needed

export default function AdminProductsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form fields
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [stockQuantity, setStockQuantity] = useState("")
  const [imageUrl, setImageUrl] = useState("")

  // ... (useEffect for auth and initial fetch remains the same)

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const supabase = createClient()

      const { error } = await supabase.from("products").insert({
        name,
        description,
        price: Number.parseFloat(price),
        stock_quantity: Number.parseInt(stockQuantity),
        image_url: imageUrl || null,
        is_available: true,
      })

      if (error) throw error

      toast({
        title: "Product added successfully!",
        description: `${name} has been added to the catalog.`,
      })

      // *****************************************
      // 2. Call the server action to revalidate the main products page cache
      await revalidateProductsPage()
      // *****************************************

      // Refresh products for the *Admin* page view (Client-side)
      const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false })

      if (data) {
        setProducts(data)
      }

      // Reset form
      setName("")
      setDescription("")
      setPrice("")
      setStockQuantity("")
      setImageUrl("")
      setShowAddForm(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add product",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // ... (rest of the component remains the same)


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

  return (
    <div className="min-h-screen">
      <Header />

      <div className="container py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Manage Products</h1>
          <div className="flex gap-2">
            <Button onClick={() => setShowAddForm(!showAddForm)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
            <Button variant="ghost" onClick={() => router.push("/admin")}>
              ← Back
            </Button>
          </div>
        </div>

        {showAddForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Add New Product</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddProduct} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name *</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (UGX) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="stock">Stock Quantity *</Label>
                    <Input
                      id="stock"
                      type="number"
                      value={stockQuantity}
                      onChange={(e) => setStockQuantity(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="image">Image URL</Label>
                    <Input
                      id="image"
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add Product"
                    )}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>All Products ({products.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <div key={product.id} className="rounded-lg border p-4">
                  <div className="relative mb-3 h-40 w-full overflow-hidden rounded-lg bg-muted">
                    <Image
                      src={product.image_url || `/placeholder.svg?height=160&width=240`}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <h3 className="font-semibold">{product.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{product.description}</p>
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-primary">UGX {product.price.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Stock: {product.stock_quantity}</p>
                  </div>
                </div>
              ))}

              {products.length === 0 && (
                <div className="col-span-full py-12 text-center text-muted-foreground">No products found</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
