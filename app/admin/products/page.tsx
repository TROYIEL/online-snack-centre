"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import type { Product } from "@/lib/types/database";

export default function AdminProductsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({});
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [category, setCategory] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null); // For file upload
  const [imageUploading, setImageUploading] = useState(false);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching products:", error);
      toast({
        title: "Error fetching products",
        description: error.message,
        variant: "destructive",
      });
      setProducts([]);
    } else {
      setProducts(data || []);
    }
  }, [supabase, toast]);

  // Delete product
  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!window.confirm(`Are you sure you want to delete ${productName}?`)) return;

    setIsDeleting((prev) => ({ ...prev, [productId]: true }));

    const { error } = await supabase.from("products").delete().eq("id", productId);

    if (error) {
      console.error("Error deleting product:", error);
      toast({
        title: "Error deleting product",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Product deleted", description: `${productName} was removed.` });
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    }

    setIsDeleting((prev) => ({ ...prev, [productId]: false }));
  };

  // Upload image to Supabase Storage
  const uploadImage = async (file: File) => {
    if (!file) return null;

    try {
      setImageUploading(true);
      const fileName = `${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
        .from("products")
        .upload(fileName, file, { cacheControl: "3600", upsert: false });

      if (error) throw error;

      const { publicUrl, error: urlError } = supabase.storage
        .from("products")
        .getPublicUrl(fileName);

      if (urlError) throw urlError;

      return publicUrl;
    } finally {
      setImageUploading(false);
    }
  };

  // Check auth on load
  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) console.error("Auth error:", error);
      if (!user) {
        router.push("/auth/login");
        return;
      }
      setCurrentUser(user);
      await fetchProducts();
      setIsLoading(false);
    };
    checkAuthAndFetch();
  }, [router, fetchProducts, supabase]);

  // Add product
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!name || !price || !stockQuantity || !category) {
      toast({
        title: "Missing Fields",
        description: "Name, Price, Stock, and Category are required.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      let imageUrl: string | null = null;
      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile);
        if (uploadedUrl) imageUrl = uploadedUrl;
      }

      const productData = {
        name,
        description: description || "",
        price: parseFloat(price),
        stock_quantity: parseInt(stockQuantity),
        image_url: imageUrl,
        is_available: true,
        category,
        trader_id: currentUser.id,
      };

      const { data, error } = await supabase
        .from("products")
        .insert([productData])
        .select();

      if (error) {
        console.error("Supabase error:", error);
        toast({
          title: "Error adding product",
          description: error.message || "An unexpected error occurred.",
          variant: "destructive",
        });
      } else {
        toast({ title: "Product saved!", description: `${name} added successfully.` });
        await fetchProducts();
        setName("");
        setDescription("");
        setPrice("");
        setStockQuantity("");
        setCategory("");
        setImageFile(null);
        setShowAddForm(false);
      }
    } catch (err: any) {
      console.error("Error inserting product:", err);
      toast({
        title: "Error adding product",
        description: err.message || "Failed to add product.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex justify-center items-center h-[60vh]">
          <Loader2 className="animate-spin h-8 w-8 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />

      <div className="container py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Manage Products</h1>
          <div className="flex gap-2">
            <Button onClick={() => setShowAddForm(!showAddForm)}>
              <Plus className="mr-2 h-4 w-4" /> Add Product
            </Button>
            <Button variant="ghost" onClick={() => router.push("/admin")}>
              ← Back
            </Button>
          </div>
        </div>

        {showAddForm && (
          <Card className="mb-6">
            <CardHeader><CardTitle>Add New Product</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleAddProduct} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name *</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (UGX) *</Label>
                    <Input id="price" type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} required />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stock">Stock Quantity *</Label>
                    <Input id="stock" type="number" min="0" value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image">Product Image</Label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  {imageUploading && <p className="text-sm text-muted-foreground">Uploading...</p>}
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={isSubmitting || imageUploading}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Add Product"}
                  </Button>
                  <Button variant="ghost" onClick={() => setShowAddForm(false)}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle>All Products ({products.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <div key={product.id} className="border rounded-lg p-4">
                  <div className="relative mb-3 h-40 w-full overflow-hidden rounded-lg bg-muted">
                    <Image src={product.image_url || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
                  </div>
                  <h3 className="font-semibold">{product.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{product.description}</p>
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-primary">UGX {product.price.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Stock: {product.stock_quantity}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Category: {product.category}</p>
                  <Button variant="destructive" size="sm" className="mt-3 w-full" onClick={() => handleDeleteProduct(product.id, product.name)} disabled={isDeleting[product.id]}>
                    {isDeleting[product.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Trash2 className="mr-2 h-4 w-4" /> Delete</>}
                  </Button>
                </div>
              ))}
              {products.length === 0 && <div className="col-span-full text-center text-muted-foreground py-12">No products found</div>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
