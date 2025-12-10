import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function SalesPage() {
  const [sales, setSales] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [filter, setFilter] = useState("all");

  // Fetch sales from backend
  const loadSales = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/products/sales");
      const data = await res.json();

      if (data.success) {
        setSales(data.sales);
        setFiltered(data.sales);
      }
    } catch (err) {
      console.error("Failed to fetch sales:", err);
    }
  };

  useEffect(() => {
    loadSales();
  }, []);

  // Format date
  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // Filtering logic
  useEffect(() => {
    const now = new Date();

    if (filter === "today") {
      setFiltered(
        sales.filter((s) => {
          const d = new Date(s.created_at);
          return (
            d.getDate() === now.getDate() &&
            d.getMonth() === now.getMonth() &&
            d.getFullYear() === now.getFullYear()
          );
        })
      );
    } else if (filter === "month") {
      setFiltered(
        sales.filter((s) => {
          const d = new Date(s.created_at);
          return (
            d.getMonth() === now.getMonth() &&
            d.getFullYear() === now.getFullYear()
          );
        })
      );
    } else {
      setFiltered(sales);
    }
  }, [filter, sales]);

  const totalEarnings = filtered.reduce(
    (sum, sale) => sum + Number(sale.total || 0),
    0
  );

  return (
    <div className="min-h-screen bg-sky-200 p-6">
      {/* HEADER */}
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800">📊 Sales Report</h1>

        <Link to="/dashboard">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            ⬅ Back to Dashboard
          </button>
        </Link>
      </header>

      {/* LANDSCAPE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT PANEL — Filters + Summary */}
        <div className="col-span-1 space-y-6">

          {/* FILTERS */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold mb-3 text-slate-700">
              Filter Sales
            </h2>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => setFilter("today")}
                className={`px-4 py-2 rounded-lg font-semibold ${
                  filter === "today"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 hover:bg-gray-300"
                }`}
              >
                Today
              </button>

              <button
                onClick={() => setFilter("month")}
                className={`px-4 py-2 rounded-lg font-semibold ${
                  filter === "month"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 hover:bg-gray-300"
                }`}
              >
                This Month
              </button>

              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded-lg font-semibold ${
                  filter === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 hover:bg-gray-300"
                }`}
              >
                All
              </button>
            </div>
          </div>

          {/* SUMMARY */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold mb-3 text-slate-700">
              📦 Summary
            </h2>

            <p className="text-lg text-slate-800">
              <strong>Total Sales:</strong> {filtered.length}
            </p>

            <p className="text-lg text-slate-800 mt-2">
              <strong>Total Earnings:</strong>{" "}
              <span className="text-green-600 font-bold">₱{totalEarnings}</span>
            </p>
          </div>
        </div>

        {/* RIGHT PANEL — Sales Records */}
        <div className="col-span-2 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-slate-700">
            🧾 Sales Records
          </h2>

          {filtered.length === 0 ? (
            <p className="text-gray-500 text-center">No sales found.</p>
          ) : (
            <ul className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {filtered.map((sale) => (
                <li
                  key={sale.id}
                  className="border-b pb-3 flex justify-between"
                >
                  <div>
                    <p className="font-semibold text-slate-900">
                      {sale.product_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      Qty: {sale.quantity} × ₱{sale.price}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDate(sale.created_at)}
                    </p>
                  </div>

                  <p className="text-green-600 font-bold text-lg">
                    ₱{sale.total}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
