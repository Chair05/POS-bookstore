import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import Layout from "./Layout";
import {
  ShoppingBagIcon, WalletIcon, PackageIcon, TagsIcon,
  AlertTriangleIcon, UsersIcon, ReceiptIcon, ClockIcon,
  BanIcon, TrendingUpIcon, DollarIcon, PackageSearchIcon,
} from "../components/Icons";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const PIE_COLORS = ["#6366f1", "#ec4899", "#eab308", "#14b8a6", "#8b5cf6", "#f59e0b", "#10b981", "#64748b"];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [dailySales, setDailySales] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [orderSummary, setOrderSummary] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [stockTrends, setStockTrends] = useState(null);
  const navigate = useNavigate();

  const user = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
  })();

  useEffect(() => {
    if (!localStorage.getItem("user")) navigate("/");
  }, [navigate]);

  useEffect(() => {
    fetchStats();
    fetchNotifications();
    fetchDailySales();
    fetchBestSellers();
    fetchOrderSummary();
    fetchRecentOrders();
    fetchStockTrends();
  }, []);

  const fetchStockTrends = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/orders/reports/stock-trends?days=30");
      const data = await res.json();
      if (data.success) setStockTrends(data);
    } catch (err) { console.error(err); }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/orders/dashboard-stats");
      const data = await res.json();
      if (data.success) setStats(data.stats);
    } catch (err) { console.error(err); }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/orders/notifications");
      const data = await res.json();
      if (data.success) setNotifications(data.notifications);
    } catch (err) { console.error(err); }
  };

  const fetchDailySales = async () => {
    try {
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);
      const start = thirtyDaysAgo.toISOString().slice(0, 10);
      const end = today.toISOString().slice(0, 10);
      const res = await fetch(`http://localhost:5000/api/orders/reports/daily-sales?start_date=${start}&end_date=${end}`);
      const data = await res.json();
      if (data.success) setDailySales(data.data || []);
    } catch (err) { console.error(err); }
  };

  const fetchBestSellers = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/orders/reports/best-sellers");
      const data = await res.json();
      if (data.success) setBestSellers(data.data || []);
    } catch (err) { console.error(err); }
  };

  const fetchOrderSummary = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/orders/reports/summary");
      const data = await res.json();
      if (data.success) setOrderSummary(data.summary);
    } catch (err) { console.error(err); }
  };

  const fetchRecentOrders = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/orders/orders");
      const data = await res.json();
      if (data.success) setRecentOrders((data.orders || []).slice(0, 5));
    } catch (err) { console.error(err); }
  };

  const totalNotifications = useMemo(() => {
    return notifications.reduce((sum, n) => sum + (n.count || 0), 0);
  }, [notifications]);

  const getStatusConfig = (status) => {
    const map = {
      pending_payment: { label: "Pending Payment", color: "bg-yellow-100 text-yellow-800" },
      verified: { label: "Verified", color: "bg-blue-100 text-blue-800" },
      preparing: { label: "Preparing", color: "bg-orange-100 text-orange-800" },
      ready_for_pickup: { label: "Ready for Pickup", color: "bg-green-100 text-green-800" },
      completed: { label: "Completed", color: "bg-gray-100 text-gray-700" },
      rejected: { label: "Rejected", color: "bg-red-100 text-red-800" },
      cancelled: { label: "Cancelled", color: "bg-gray-100 text-gray-400" },
    };
    return map[status] || { label: status, color: "bg-gray-100 text-gray-600" };
  };

  const getStockStatusConfig = (status) => {
    const map = {
      out_of_stock: { label: "Out of Stock", color: "bg-red-100 text-red-700" },
      low: { label: "Low Stock", color: "bg-amber-100 text-amber-700" },
      watch: { label: "Watch", color: "bg-orange-100 text-orange-700" },
      healthy: { label: "Healthy", color: "bg-green-100 text-green-700" },
    };
    return map[status] || { label: status, color: "bg-gray-100 text-gray-600" };
  };

  return (
    <Layout title="Dashboard">

      <div className="p-6 space-y-6">

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { label: "Total Products", value: stats?.total_products ?? "—", icon: PackageIcon, color: "text-blue-600" },
            { label: "Categories", value: stats?.total_categories ?? "—", icon: TagsIcon, color: "text-indigo-600" },
            { label: "Low Stock", value: stats?.low_stock ?? "—", icon: AlertTriangleIcon, color: "text-amber-600" },
            { label: "Pending Orders", value: stats?.pending_orders ?? "—", icon: ShoppingBagIcon, color: "text-orange-600" },
            { label: "Customers", value: stats?.total_customers ?? "—", icon: UsersIcon, color: "text-emerald-600" },
          ].map((card, i) => {
            const IconCmp = card.icon;
            return (
              <div key={i} className="bg-white p-4 rounded-2xl shadow-sm hover:shadow-md transition">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <IconCmp className="w-5 h-5" />
                  </div>
                </div>
                <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                <p className="text-sm text-gray-500 mt-1">{card.label}</p>
              </div>
            );
          })}
        </div>

        {/* ORDER SUMMARY CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Online Orders", value: orderSummary?.total_orders ?? 0, color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
            { label: "Completed Orders", value: orderSummary?.completed_orders ?? 0, color: "text-green-700", bg: "bg-green-50 border-green-200" },
            { label: "Ready for Pickup", value: orderSummary?.ready_for_pickup_orders ?? 0, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
            { label: "Online Revenue", value: `₱${Number(orderSummary?.completed_revenue ?? 0).toFixed(2)}`, color: "text-green-700", bg: "bg-green-50 border-green-200" },
          ].map((card, i) => (
            <div key={i} className={`p-4 rounded-2xl shadow-sm border ${card.bg}`}>
              <p className="text-sm text-gray-500">{card.label}</p>
              <p className={`text-xl font-bold mt-1 ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* CHARTS ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* DAILY SALES CHART */}
          <div className="bg-white p-4 rounded-2xl shadow-sm">
            <h3 className="text-sm font-semibold text-gray-600 mb-3">Daily Sales (Last 30 Days)</h3>
            {dailySales.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={[...dailySales].reverse().map((d) => ({ ...d, revenue: Number(d.revenue) || 0 }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(val) => `₱${Number(val).toFixed(2)}`} labelFormatter={(l) => new Date(l).toLocaleDateString()} />
                  <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-gray-400 text-sm">No sales data</div>
            )}
          </div>

          {/* BEST SELLING PRODUCTS */}
          <div className="bg-white p-4 rounded-2xl shadow-sm">
            <h3 className="text-sm font-semibold text-gray-600 mb-3">Best Selling Products</h3>
            {bestSellers.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={bestSellers.map((b) => ({ name: b.product_name, value: Number(b.total_sold) || 0 }))}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {bestSellers.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-gray-400 text-sm">No product data</div>
            )}
          </div>
        </div>

        {/* BOTTOM ROW: ALERTS + RECENT ORDERS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* NOTIFICATION ALERTS */}
          <div className="bg-white p-4 rounded-2xl shadow-sm">
            <h3 className="text-sm font-semibold text-gray-600 mb-3">Alerts</h3>
            <div className="space-y-2">
              {notifications.filter((n) => n.count > 0).length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">No alerts</p>
              ) : (
                notifications.filter((n) => n.count > 0).map((n, i) => {
                  const AlertIcon =
                    n.type === "low_stock" ? AlertTriangleIcon
                    : n.type === "pending_payment" ? WalletIcon
                    : n.type === "pending_preparation" ? ReceiptIcon
                    : n.type === "ready_for_pickup" ? PackageIcon
                    : n.type === "new_orders" ? ShoppingBagIcon
                    : ClockIcon;
                  return (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <AlertIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {n.type === "low_stock" && "Low Stock Products"}
                            {n.type === "pending_payment" && "Pending Payment Verification"}
                            {n.type === "pending_preparation" && "Orders Ready to Prepare"}
                            {n.type === "new_orders" && "New Online Orders"}
                            {n.type === "ready_for_pickup" && "Ready for Pickup"}
                          </p>
                        </div>
                      </div>
                      <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">{n.count}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RECENT ORDERS */}
          <div className="bg-white p-4 rounded-2xl shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-gray-600">Recent Online Orders</h3>
              <Link to="/orders" className="text-xs text-blue-600 hover:text-blue-800 font-medium">View All →</Link>
            </div>
            {recentOrders.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">No orders yet</p>
            ) : (
              <div className="space-y-2">
                {recentOrders.map((order) => {
                  const sc = getStatusConfig(order.order_status);
                  return (
                    <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition cursor-pointer" onClick={() => navigate("/orders")}>
                      <div>
                        <p className="font-mono text-sm font-semibold text-blue-700">{order.order_number}</p>
                        <p className="text-xs text-gray-500">{order.customer_name} • {new Date(order.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-800">₱{Number(order.total_amount).toFixed(2)}</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${sc.color}`}>
                          {sc.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className="bg-white p-4 rounded-2xl shadow-sm">
          <h3 className="text-sm font-semibold text-gray-600 mb-3">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <Link to="/orders" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition">
              Manage Orders
            </Link>
            <Link to="/customers" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition">
              View Customers
            </Link>
            <Link to="/online-reports" className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition">
              Reports
            </Link>
            <Link to="/dashboard" className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-semibold hover:bg-gray-700 transition">
              Open POS
            </Link>
          </div>
        </div>

        {/* STOCK TRENDS & ANALYSIS */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-5 border-b border-gray-100">
            <div>
              <h3 className="text-base font-bold text-gray-800">Stock Trends & Analysis</h3>
              <p className="text-xs text-gray-400 mt-0.5">Sales velocity, reorder recommendations & inventory value over the last 30 days</p>
            </div>
            <button
              onClick={fetchStockTrends}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>

          {!stockTrends ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                Loading stock analysis...
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Summary tiles */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {[
                  { label: "Products Tracked", value: stockTrends.summary?.total_products ?? 0, icon: PackageIcon, tile: "from-blue-500 to-indigo-600" },
                  { label: "Out of Stock", value: stockTrends.summary?.out_of_stock ?? 0, icon: BanIcon, tile: "from-red-500 to-rose-600" },
                  { label: "Low Stock", value: stockTrends.summary?.low_stock ?? 0, icon: AlertTriangleIcon, tile: "from-amber-500 to-orange-600" },
                  { label: "Needs Reorder", value: stockTrends.summary?.needs_reorder ?? 0, icon: PackageSearchIcon, tile: "from-fuchsia-500 to-purple-600" },
                  { label: "Inventory Value", value: `₱${Number(stockTrends.summary?.total_stock_value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: DollarIcon, tile: "from-emerald-500 to-teal-600" },
                ].map((s, i) => {
                  const IconCmp = s.icon;
                  return (
                    <div key={i} className={`rounded-xl bg-gradient-to-br ${s.tile} text-white p-4 shadow-sm`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
                          <IconCmp className="w-5 h-5" />
                        </div>
                        <span className="text-[9px] font-medium uppercase tracking-wider text-white/70">Inventory</span>
                      </div>
                      <p className="text-xl font-bold leading-tight">{s.value}</p>
                      <p className="text-xs text-white/80 mt-1">{s.label}</p>
                    </div>
                  );
                })}
              </div>

              {/* Fast movers */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-700">Fast Movers</h4>
                  <span className="text-xs text-gray-400">Top selling items by velocity</span>
                </div>
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-400 bg-gray-50 border-b border-gray-100 uppercase tracking-wider">
                        <th className="px-4 py-3 font-medium">Product</th>
                        <th className="px-4 py-3 font-medium text-right">Units Sold</th>
                        <th className="px-4 py-3 font-medium text-right">Daily Velocity</th>
                        <th className="px-4 py-3 font-medium text-right">Stock Left</th>
                        <th className="px-4 py-3 font-medium text-right">Runway</th>
                        <th className="px-4 py-3 font-medium text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockTrends.trends?.filter((t) => t.units_sold > 0).slice(0, 5).map((t, idx) => {
                        const sc = getStockStatusConfig(t.status);
                        return (
                          <tr key={t.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <span className="w-6 h-6 flex items-center justify-center rounded-md bg-blue-50 text-blue-600 text-xs font-bold">
                                  {idx + 1}
                                </span>
                                <span className="font-medium text-gray-800">{t.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-gray-700">{t.units_sold}</td>
                            <td className="px-4 py-3 text-right">
                              <span className="inline-flex items-center justify-end gap-1 text-gray-600">
                                <span className="text-emerald-500 text-xs">▲</span>
                                {t.daily_velocity}/day
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <span className="font-semibold text-gray-700">{t.stock}</span>
                                <div className="w-16 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${t.status === "low" || t.status === "out_of_stock" ? "bg-red-500" : t.status === "watch" ? "bg-amber-500" : "bg-emerald-500"}`}
                                    style={{ width: `${Math.min(100, (t.stock / (t.reorder_point || 1)) * 100)}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right text-gray-500">
                              {t.days_until_empty === null ? "—" : `${t.days_until_empty}d`}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${sc.color}`}>
                                {sc.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Reorder list */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-700">Reorder Recommendations</h4>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${stockTrends.reorderList?.length > 0 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}>
                    {stockTrends.reorderList?.length || 0} items need restocking
                  </span>
                </div>
                {stockTrends.reorderList?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                    {stockTrends.reorderList.map((t) => {
                      const sc = getStockStatusConfig(t.status);
                      const urgency = t.status === "out_of_stock" ? 100 : t.daily_velocity > 0 ? Math.min(100, Math.round((t.stock / (t.reorder_point || 1)) * 100)) : 100;
                      return (
                        <div key={t.id} className="rounded-xl border border-gray-100 p-4 hover:shadow-sm transition">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate">{t.name}</p>
                              <p className="text-xs text-gray-400 mt-0.5">Reorder point: {t.reorder_point} units</p>
                            </div>
                            <span className={`shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${sc.color}`}>
                              {sc.label}
                            </span>
                          </div>
                          <div className="mt-3 flex items-center justify-between text-xs">
                            <div>
                              <span className="text-gray-400">Stock left: </span>
                              <span className={`font-bold ${t.stock <= 0 ? "text-red-600" : "text-gray-800"}`}>{t.stock}</span>
                            </div>
                            <div className="text-gray-500">
                              {t.daily_velocity > 0 ? `Sells ${t.daily_velocity}/day` : "No recent sales"}
                            </div>
                          </div>
                          <div className="mt-2 w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${t.stock <= 0 ? "bg-red-500" : t.status === "low" ? "bg-amber-500" : "bg-orange-400"}`}
                              style={{ width: `${Math.max(4, Math.min(100, 100 - urgency))}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-6 text-center text-sm text-emerald-600 font-medium">
                    ✓ All products are above their reorder points. No restock needed right now.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
