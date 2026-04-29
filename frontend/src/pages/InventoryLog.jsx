import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function InventoryLog() {
  const navigate = useNavigate();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [typeFilter, setTypeFilter] = useState("all"); // all | IN | OUT
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      // Fetch sales (OUT) and restocks (IN)
      const [salesRes, restocksRes] = await Promise.all([
        fetch("http://localhost:5000/api/products/sales"),
        fetch("http://localhost:5000/api/products/restocks")
      ]);

      const salesText = await salesRes.text();
      const restocksText = await restocksRes.text();

      if (!salesRes.ok || !restocksRes.ok) {
        const salesError = salesRes.ok ? null : `Sales error ${salesRes.status}: ${salesText}`;
        const restocksError = restocksRes.ok ? null : `Restocks error ${restocksRes.status}: ${restocksText}`;
        throw new Error(salesError || restocksError || "Failed to load logs");
      }

      let salesData;
      let restocksData;

      try {
        salesData = JSON.parse(salesText);
      } catch (parseErr) {
        throw new Error(`Sales response was not JSON: ${salesText.substring(0, 200)}`);
      }

      try {
        restocksData = JSON.parse(restocksText);
      } catch (parseErr) {
        throw new Error(`Restocks response was not JSON: ${restocksText.substring(0, 200)}`);
      }

      if (!salesData.success || !restocksData.success)
        throw new Error("Failed to load logs");

      // Transform sales data to OUT logs
      const outLogs = salesData.sales.map(sale => ({
        id: `out-${sale.id}`,
        productName: sale.product_name,
        type: 'OUT',
        quantity: sale.quantity,
        staff: 'System',
        timestamp: sale.created_at,
        reason: 'Sale'
      }));

      // Transform restocks data to IN logs
      const inLogs = restocksData.restocks.map(restock => ({
        id: `in-${restock.id}`,
        productName: restock.product_name || 'Unknown', // Assuming product_name is in restocks table
        type: 'IN',
        quantity: restock.quantity_added,
        staff: 'Admin',
        timestamp: restock.created_at,
        reason: restock.reason || 'Restock'
      }));

      // Combine and sort by timestamp descending
      const allLogs = [...outLogs, ...inLogs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      setLogs(allLogs);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const linkClass = (path) =>
    `block px-3 py-2 rounded ${
      window.location.pathname === path
        ? "bg-blue-500 text-white"
        : "text-white hover:bg-blue-600"
    }`;

  const filteredLogs = logs.filter((log) => {
    const matchType =
      typeFilter === "all" ? true : log.type === typeFilter;

    const matchSearch =
      log.productName?.toLowerCase().includes(search.toLowerCase()) ||
      log.staff?.toLowerCase().includes(search.toLowerCase());

    return matchType && matchSearch;
  });

  if (loading)
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        Loading logs...
      </div>
    );

  if (error)
    return (
      <div className="h-screen w-screen flex items-center justify-center text-red-500">
        {error}
      </div>
    );

  return (
    <div className="h-screen w-screen bg-gray-100 flex flex-col">
      {/* SIDEBAR */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-blue-700 p-5 z-50 transform transition ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <h2 className="text-xl font-bold text-white mb-6">Menu</h2>

        <Link to="/dashboard" className={linkClass("/dashboard")} onClick={() => setSidebarOpen(false)}>
          Home
        </Link>

        <Link to="/stock" className={linkClass("/stock")} onClick={() => setSidebarOpen(false)}>
          Inventory
        </Link>

        <Link to="/restock" className={linkClass("/restock")} onClick={() => setSidebarOpen(false)}>
          Restock
        </Link>

        <Link to="/inventory-log" className={linkClass("/inventory-log")} onClick={() => setSidebarOpen(false)}>
          Inventory Log
        </Link>

        <Link to="/sales" className={linkClass("/sales")} onClick={() => setSidebarOpen(false)}>
          Sales
        </Link>

        <button
          onClick={() => {
            localStorage.removeItem("user");
            navigate("/");
          }}
          className="mt-6 w-full bg-white text-blue-600 py-2 rounded font-semibold"
        >
          Logout
        </button>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* HEADER */}
      <header className="flex items-center bg-gradient-to-r from-blue-600 to-blue-800 text-white px-4 py-3 shadow">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-2xl relative -top-[7px]"
          >
            ☰
          </button>

          <h1 className="text-xl font-bold">Inventory Log</h1>
        </div>
      </header>

      {/* FILTERS */}
      <div className="p-4 bg-white shadow-md border-b">
        <div className="flex gap-3 flex-wrap items-center">
          <input
            placeholder="Search product or staff..."
            className="border px-4 py-2 rounded-lg flex-1 min-w-64 focus:ring-2 focus:ring-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="border px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="IN">Stock IN</option>
            <option value="OUT">Stock OUT</option>
          </select>

          <button
            onClick={loadLogs}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition relative -top-[7px]"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Staff
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {log.type === "IN" ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        IN
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        OUT
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                    {log.productName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {log.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {log.reason || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {log.staff}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}

              {filteredLogs.length === 0 && (
                <tr>
                  <td className="px-6 py-4 text-center text-gray-500" colSpan="6">
                    No logs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
