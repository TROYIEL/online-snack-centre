"use client"

import Link from "next/link"
import { ShoppingCart, Search, User, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCart } from "@/lib/contexts/cart-context"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Shield } from "lucide-react"

export function Head() {
  const { totalItems } = useCart()
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-lg font-bold text-primary-foreground">B</span>
            </div>
            <span className="hidden font-bold sm:inline-block"> ONLINE SNACK CENTER </span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/products" className="text-sm font-medium transition-colors hover:text-primary">
             
            </Link>
            <Link href="/orders" className="text-sm font-medium transition-colors hover:text-primary">
          
            </Link>
          </nav>
        </div>

        <div className="flex flex-1 items-center justify-end gap-4">
          <form className="hidden w-full max-w-sm lg:flex">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search products..."
                className="w-full pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>

          <Link href="/auth/sign-up">
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
          </Link>

     <nav className="flex flex-col gap-4">
                <Link href="/admin/sup" className="text-sm font-medium">
                  DASHBOARD
                </Link>
              </nav>
          
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="flex flex-col gap-4">
                <Link href="/products" className="text-sm font-medium">
                  Products
                </Link>
                <Link href="/orders" className="text-sm font-medium">
                  Orders
                </Link>
                <Link href="/account" className="text-sm font-medium">
                  Account
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
