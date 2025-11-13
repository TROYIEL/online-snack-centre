"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import {
  Menu,
  Package,
  Truck,
  Users,
  DollarSign,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import Link from "next/link"

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    activeDeliveries: 0,
  })

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push("/auth/sign-in")

      setUser(user)

      // Check admin role

      // Fetch sample stats
      const [{ count: totalOrders }, { data: customers }, { data: orders }, { count: activeDeliveries }] =
        await Promise.all([
          supabase.from("orders").select("*", { count: "exact", head: true }),
          supabase.from("profiles").select("id, role").eq("role", "customer"),
          supabase.from("orders").select("total"),
          supabase.from("deliveries").select("*", { count: "exact", head: true }).neq("status", "delivered"),
        ])

      const totalRevenue = orders?.reduce((sum, o) => sum + (o.total || 0), 0)

      setStats({
        totalOrders: totalOrders || 0,
        totalCustomers: customers?.length || 0,
        totalRevenue: totalRevenue || 0,
        activeDeliveries: activeDeliveries || 0,
      })

      setLoading(false)
    }

    loadData()
  }, [router, supabase])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        Loading admin dashboard...
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 text-slate-800">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } transition-all duration-300 bg-white/80 backdrop-blur-lg border-r border-gray-200 flex flex-col justify-between`}
      >
        <div>
          <div className="flex items-center justify-between p-4 border-b">
            <h1 className={`font-bold text-xl ${!sidebarOpen && "hidden"}`}>Admin Panel</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-500"
            >
              {sidebarOpen ? <ChevronLeft /> : <ChevronRight />}
            </Button>
          </div>

          <nav className="mt-6 flex flex-col gap-1 px-2">
            {[
              { label: "Dashboard", href: "/admin", icon: Settings },
              { label: "Orders", href: "/admin/orders", icon: Package },
              { label: "Products", href: "/admin/products", icon: DollarSign },
              { label: "Deliveries", href: "/admin/deliveries", icon: Truck },
            
            ].map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-lg p-3 text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition"
              >
                <Icon className="h-5 w-5" />
                {sidebarOpen && <span>{label}</span>}
              </Link>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t">
          <Button asChild className="w-full">
            <Link href="/">
           Logout
  </Link>
</Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        {/* Topbar */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Dashboard</h2>
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-600">{user?.email}</p>
            <img
              src={`https://ui-avatars.com/api/?name=${user?.email}&background=6366f1&color=fff`}
              alt="profile"
              className="h-9 w-9 rounded-full border"
            />
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Orders" value={stats.totalOrders} icon={<Package className="text-indigo-600" />} />
          <StatCard
            title="Active Deliveries"
            value={stats.activeDeliveries}
            icon={<Truck className="text-orange-600" />}
          />
        </div>

        {/* Quick Actions */}
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Manage Orders", href: "/admin/orders", icon: Package },
            { label: "Manage Products", href: "/admin/products", icon: Settings },
            { label: "Deliveries", href: "/admin/deliveries", icon: Truck },
            
          ].map(({ label, href, icon: Icon }) => (
            <Link key={href} href={href}>
              <Card className="hover:shadow-lg hover:-translate-y-1 transition-all bg-white/70 backdrop-blur">
                <CardHeader className="flex items-center gap-3">
                  <div className="rounded-full bg-indigo-100 p-2">
                    <Icon className="text-indigo-600" />
                  </div>
                  <CardTitle className="text-lg font-semibold">{label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">Open</Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}

function StatCard({ title, value, icon }: { title: string; value: any; icon: React.ReactNode }) {
  return (
    <Card className="bg-white/70 backdrop-blur-lg hover:shadow-md transition">
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="text-gray-700">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{value}</p>
      </CardContent>
    </Card>
  )
}
