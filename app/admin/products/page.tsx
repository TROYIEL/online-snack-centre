"use client"

import type React from "react"
import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Plus, Trash2 } from "lucide-react"
import Image from "next/image"
import type { Product } from "@/lib/types/database"

export default function AdminProductsPage() {
  const router = useRouter()
  const { toast } = useToast()

  // State for UI and Data
  const [isLoading, setIsLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState<Record<number, boolean>>({})
  const [currentUser, setCurrentUser] = useState<any>(null)

  // Form fields state
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [stockQuantity, setStockQuantity] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [category, setCategory] = useState("") // NEW: Add category field

  const supabase = createClient()

  // Function to fetch products from the database
  const fetchProducts = useCallback(async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching products:", error)
      toast({
        title: "Error fetching products",
        description: error.message,
        variant: "destructive",
      })
      setProducts([])
    } else if (data) {
      setProducts(data)
    }
  }, [supabase, toast])

  // Handler for deleting a product
  const handleDeleteProduct = async (productId: number, productName: string) => {
    if (!window.confirm(`Are you sure you want to delete the product: ${productName}?`)) {
      return // Cancel deletion if user says no
    }

    setIsDeleting((prev) => ({ ...prev, [productId]: true }))

    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId)

      if (error) throw error

      toast({
        title: "Product deleted successfully!",
        description: `${productName} has been removed from the catalog.`,
      })

      // Refresh product list by removing the deleted item from state
      setProducts((prev) => prev.filter((p) => p.id !== productId))
    } catch (error: any) {
      console.error("Error deleting product:", error)
      toast({
        title: "Error deleting product",
        description: error.message || "Failed to delete product. Check RLS policy.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting((prev) => ({ ...prev, [productId]: false }))
    }
  }

  // Effect hook for initial load and authentication check
  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError) {
        console.error("Auth error:", authError)
      }

      if (!user) {
        console.log("No user found, redirecting to login")
        router.push("/auth/login")
        return
      }

      console.log("User authenticated:", user.id)
      setCurrentUser(user)
      await fetchProducts()
      setIsLoading(false)
    }

    checkAuthAndFetch()
  }, [router, fetchProducts, supabase])

  // Handler for adding a new product - FIXED VERSION
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Basic required field validation - UPDATED to include category
    if (!name || !price || !stockQuantity || !category) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Name, Price, Stock, Category).",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    // Check if we have the current user
    if (!currentUser) {
      toast({
        title: "Authentication Error",
        description: "Please log in again.",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    try {
      const productData = {
        name,
        description: description || "",
        price: Number.parseFloat(price),
        stock_quantity: Number.parseInt(stockQuantity),
        image_url: imageUrl || null,
        is_available: true,
        trader_id: currentUser.id, // Required field
        category: category, // NEW: Required field
      }

      console.log("Attempting to insert product:", productData)

      const { data, error } = await supabase
        .from("products")
        .insert(productData)
        .select()

      if (error) {
        console.error("Supabase error details:", error)
        throw error
      }

      console.log("Insert successful, returned data:", data)

      toast({
        title: "Product added successfully!",
        description: `${name} has been added to the catalog.`,
      })

      // Refresh product list and reset form
      await fetchProducts()
      setName("")
      setDescription("")
      setPrice("")
      setStockQuantity("")
      setImageUrl("")
      setCategory("") // NEW: Reset category
      setShowAddForm(false)
    } catch (error: any) {
      console.error("Full error object:", error)
      
      let errorDescription = error.message || "Failed to add product."
      
      if (error.code === '42501') {
        errorDescription = "Permission denied. Check RLS policies."
      } else if (error.code === '23505') {
        errorDescription = "A product with this name already exists."
      } else if (error.code === '23502') {
        errorDescription = "Missing required fields. Please check all fields are filled."
      } else if (error.details) {
        errorDescription = error.details
      }

      toast({
        title: "Error adding product",
        description: errorDescription,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show loading spinner while data is fetched
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
        {/* Title and Buttons */}
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

        {/* Add Product Form */}
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
                    <Input 
                      id="name" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (UGX) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Input
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="e.g., Electronics, Clothing, Food"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stock">Stock Quantity *</Label>
                    <Input
                      id="stock"
                      type="number"
                      min="0"
                      value={stockQuantity}
                      onChange={(e) => setStockQuantity(e.target.value)}
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

        {/* Product List */}
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
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground">Category: {product.category}</p>
                  </div>
                  {/* Delete Button */}
                  <Button
                    variant="destructive"
                    size="sm"
                    className="mt-3 w-full"
                    onClick={() => handleDeleteProduct(product.id, product.name)}
                    disabled={isDeleting[product.id]}
                  >
                    {isDeleting[product.id] ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </>
                    )}
                  </Button>
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