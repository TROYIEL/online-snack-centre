// app/admin/products/actions.ts

"use server"

import { revalidatePath } from "next/cache"

export async function revalidateProductsPage() {
  // This will purge the cache for the /products route segment,
  // forcing Next.js to re-fetch the data on the next request.
  revalidatePath("/products")
}