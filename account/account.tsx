// app/account/page.tsx
import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AccountPage() {
  const supabase = createServerClient();

  // ✅ 1. Get the logged-in user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login"); // redirect if not logged in
  }

  // ✅ 2. Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, avatar_url")
    .eq("id", user.id)
    .single();

  // ✅ 3. Fetch user’s orders
  const { data: orders } = await supabase
    .from("orders")
    .select("id, product_name, quantity, location, payment_method, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold mb-6">My Account</h1>

      {/* Profile Section */}
      <div className="bg-white shadow rounded-xl p-6 mb-8 flex items-center gap-4">
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt="Profile"
            className="w-20 h-20 rounded-full object-cover"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center text-2xl font-bold text-gray-600">
            {profile?.full_name?.[0] || user.email[0].toUpperCase()}
          </div>
        )}

        <div>
          <h2 className="text-xl font-semibold">{profile?.full_name || "No name set"}</h2>
          <p className="text-gray-600">{profile?.email || user.email}</p>
        </div>
      </div>

      {/* Orders Section */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">My Orders</h2>

        {orders && orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="border rounded-lg p-4 shadow-sm hover:shadow-md transition"
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-lg">{order.product_name}</h3>
                  <span className="text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-700 mt-2">
                  <strong>Quantity:</strong> {order.quantity}
                </p>
                <p className="text-gray-700">
                  <strong>Location:</strong> {order.location}
                </p>
                <p className="text-gray-700">
                  <strong>Payment:</strong> {order.payment_method}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">You haven’t made any orders yet.</p>
        )}
      </div>
    </div>
  );
}
