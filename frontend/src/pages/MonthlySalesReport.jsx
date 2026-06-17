import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";

export default function MonthlySalesReport() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/sales/monthly-report");
      const text = await res.text();
      if (!res.ok) throw new Error(`Error ${res.status}: ${text}`);

      let data;
      try { data = JSON.parse(text); } catch {
        throw new Error(`Response was not JSON: ${text.substring(0, 200)}`);
      }

      if (!data.success) throw new Error("Failed to load report");
      setReports(data.reports);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReports(); }, []);

  const totalRevenue = reports.reduce((s, r) => s + Number(r.total_revenue), 0);
  const totalItems = reports.reduce((s, r) => s + Number(r.total_items), 0);
  const totalTransactions = reports.reduce((s, r) => s + Number(r.item_count), 0);

  if (loading)
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-100">
        Loading...
      </div>
    );

  if (error)
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-100 text-red-500">
        {error}
      </div>
    );

  return (
    <div className="h-screen w-screen bg-gray-100 flex flex-col">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <header className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-800 text-white px-4 py-2 shadow">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="text-2xl transition relative -top-[7px]">☰</button>
          <h1 className="text-xl font-bold">Monthly Sales Report</h1>
        </div>
        <button onClick={loadReports} className="bg-white/20 hover:bg-white/30 text-white px-4 py-1.5 rounded-lg text-sm transition">Refresh</button>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {reports.length === 0 ? (
          <div className="text-center text-gray-500 py-20">No sales data available.</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">₱{totalRevenue.toFixed(2)}</p>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <p className="text-sm text-gray-500">Total Items Sold</p>
                <p className="text-2xl font-bold">{totalItems}</p>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <p className="text-sm text-gray-500">Total Transactions</p>
                <p className="text-2xl font-bold">{totalTransactions}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Transactions</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Items Sold</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Top Product</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reports.map((r) => {
                    const [year, month] = r.month.split("-");
                    const monthName = new Date(year, month - 1).toLocaleString("en-US", { month: "long", year: "numeric" });
                    return (
                      <tr key={r.month} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{monthName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-gray-700">{r.item_count}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-gray-700">{r.total_items}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-green-600 font-medium">₱{Number(r.total_revenue).toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-700">{r.top_product || "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
