import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function InventoryLog() {
  const navigate = useNavigate();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [typeFilter, setTypeFilter] = useState("all"); // all | IN | OUT
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadLogs();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [typeFilter, search]);

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

  const filteredLogs = logs.filter((log) => {
    const matchType =
      typeFilter === "all" ? true : log.type === typeFilter;

    const matchSearch =
      log.productName?.toLowerCase().includes(search.toLowerCase()) ||
      log.staff?.toLowerCase().includes(search.toLowerCase());

    return matchType && matchSearch;
  });

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getPaginationButtons = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = [];

    if (currentPage <= 3) {
      pages.push(1, 2, 3, 4, 'ellipsis', totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, 'ellipsis', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages);
    }

    return pages;
  };

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
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* HEADER */}
      <header className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-800 text-white px-4 py-2 shadow min-h-[56px]">
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
            className="border border-gray-300 bg-white px-4 py-2 rounded-lg shadow-sm hover:bg-blue-50 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 cursor-pointer"
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
                  No.
                </th>
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
              {paginatedLogs.map((log, index) => (
                <tr key={log.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </td>
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

              {paginatedLogs.length === 0 && (
                <tr>
                  <td className="px-6 py-4 text-center text-gray-500" colSpan="7">
                    No logs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="p-4 bg-gray-50 border-t flex flex-wrap justify-center items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-md border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 transition"
              >
                Previous
              </button>

              {getPaginationButtons().map((page, index) =>
                page === 'ellipsis' ? (
                  <span key={`ellipsis-${index}`} className="px-3 py-2 text-sm text-gray-500">
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`min-w-[38px] px-4 py-2 rounded-md border text-sm transition ${
                      currentPage === page
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                )
              )}

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-md border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 transition"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
