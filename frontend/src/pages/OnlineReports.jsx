import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "./Layout";

export default function OnlineReports() {
  const [activeTab, setActiveTab] = useState("overview");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [summary, setSummary] = useState(null);
  const [dailySales, setDailySales] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [customerSummary, setCustomerSummary] = useState([]);
  const [recentCompleted, setRecentCompleted] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem("user")) navigate("/");
  }, [navigate]);

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const dateParams = () => {
    const params = new URLSearchParams();
    if (startDate) params.set("start_date", startDate);
    if (endDate) params.set("end_date", endDate);
    return params.toString();
  };

  const fetchData = async () => {
    const dp = dateParams();
    try {
      const [summaryRes, dailyRes, bestRes, customerRes, ordersRes] = await Promise.all([
        fetch(`http://localhost:5000/api/orders/reports/summary?${dp}`),
        fetch(`http://localhost:5000/api/orders/reports/daily-sales?${dp}`),
        fetch(`http://localhost:5000/api/orders/reports/best-sellers?${dp}`),
        fetch(`http://localhost:5000/api/orders/reports/customer-summary`),
        fetch(`http://localhost:5000/api/orders/orders`),
      ]);

      const [summaryData, dailyData, bestData, customerData, ordersData] = await Promise.all([
        summaryRes.json(), dailyRes.json(), bestRes.json(), customerRes.json(), ordersRes.json(),
      ]);

      if (summaryData.success) setSummary(summaryData.summary);
      if (dailyData.success) setDailySales(dailyData.data || []);
      if (bestData.success) setBestSellers(bestData.data || []);
      if (customerData.success) setCustomerSummary(customerData.data || []);
      if (ordersData.success) setRecentCompleted((ordersData.orders || []).filter((o) => o.order_status === "completed").slice(0, 20));
    } catch (err) { console.error(err); }
  };

  const formatDate = (d) => new Date(d).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "daily", label: "Daily Sales" },
    { key: "best", label: "Best Sellers" },
    { key: "customers", label: "Customer Summary" },
    { key: "completed", label: "Completed Orders" },
  ];

  return (
    <Layout title="Online Reports">
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {/* DATE FILTER */}
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm text-gray-600 font-medium">From:</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <label className="text-sm text-gray-600 font-medium">To:</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button onClick={() => { setStartDate(""); setEndDate(""); }} className="px-3 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg transition">Clear</button>
        </div>

        {/* TABS */}
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${activeTab === t.key ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && summary && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-blue-100">
                <p className="text-sm text-gray-500">Total Orders</p>
                <p className="text-2xl font-bold text-blue-700">{summary.total_orders}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-green-100">
                <p className="text-sm text-gray-500">Completed Orders</p>
                <p className="text-2xl font-bold text-green-700">{summary.completed_orders}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-yellow-100">
                <p className="text-sm text-gray-500">Preparing</p>
                <p className="text-2xl font-bold text-orange-600">{summary.preparing_orders}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-100">
                <p className="text-sm text-gray-500">Ready for Pickup</p>
                <p className="text-2xl font-bold text-emerald-600">{summary.ready_for_pickup_orders}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-2xl shadow-sm">
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-800">₱{Number(summary.total_revenue).toFixed(2)}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm">
                <p className="text-sm text-gray-500">Completed Revenue</p>
                <p className="text-2xl font-bold text-green-600">₱{Number(summary.completed_revenue).toFixed(2)}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm">
                <p className="text-sm text-gray-500">Rejected Orders</p>
                <p className="text-2xl font-bold text-red-600">{summary.rejected_orders}</p>
              </div>
            </div>
          </div>
        )}

        {/* DAILY SALES TAB */}
        {activeTab === "daily" && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600">Orders</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {dailySales.length === 0 ? (
                    <tr><td colSpan={3} className="text-center py-8 text-gray-400">No data available</td></tr>
                  ) : (
                    dailySales.map((row, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-800">{new Date(row.date).toLocaleDateString("en-US", { dateStyle: "medium" })}</td>
                        <td className="px-4 py-3 text-center">{row.orders}</td>
                        <td className="px-4 py-3 text-right font-bold text-green-600">₱{Number(row.revenue).toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* BEST SELLERS TAB */}
        {activeTab === "best" && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">#</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Product</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600">Units Sold</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {bestSellers.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-8 text-gray-400">No data available</td></tr>
                  ) : (
                    bestSellers.map((row, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">{row.product_name}</td>
                        <td className="px-4 py-3 text-center font-semibold">{row.total_sold}</td>
                        <td className="px-4 py-3 text-right font-bold text-green-600">₱{Number(row.total_revenue).toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CUSTOMER SUMMARY TAB */}
        {activeTab === "customers" && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Customer</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Email</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600">Orders</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">Total Spent</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Last Order</th>
                  </tr>
                </thead>
                <tbody>
                  {customerSummary.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-8 text-gray-400">No data available</td></tr>
                  ) : (
                    customerSummary.map((row, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-800">{row.name}</td>
                        <td className="px-4 py-3 text-gray-500">{row.email || "—"}</td>
                        <td className="px-4 py-3 text-center">{row.total_orders}</td>
                        <td className="px-4 py-3 text-right font-bold text-green-600">₱{Number(row.total_spent).toFixed(2)}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{row.last_order ? formatDate(row.last_order) : "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* COMPLETED ORDERS TAB */}
        {activeTab === "completed" && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Order #</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Customer</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">Amount</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Payment</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCompleted.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-8 text-gray-400">No completed orders</td></tr>
                  ) : (
                    recentCompleted.map((order) => (
                      <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono font-semibold text-blue-700">{order.order_number}</td>
                        <td className="px-4 py-3">{order.customer_name}</td>
                        <td className="px-4 py-3 text-right font-bold text-green-600">₱{Number(order.total_amount).toFixed(2)}</td>
                        <td className="px-4 py-3 uppercase text-xs font-medium">{order.payment_method}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(order.updated_at || order.created_at)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
