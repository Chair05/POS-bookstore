import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

// Helper: normalize to "YYYY-MM-DD"
const dateOnlyKey = (dateString) => {
  const d = new Date(dateString);
  if (isNaN(d)) return null;
  return d.toISOString().slice(0, 10);
};

export default function SalesPage() {
  const [sales, setSales] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [filter, setFilter] = useState("all"); // all | today | month | custom
  const [customDate, setCustomDate] = useState(""); // single custom date

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

  // Format date for display
  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // Helper: normalize Date -> "YYYY-MM-DD"
  const toDateStr = (d) => d.toISOString().slice(0, 10);

  // Filtering logic (with single custom date)
  useEffect(() => {
    const now = new Date();
    const todayStr = toDateStr(now);
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    const filteredData = sales.filter((s) => {
      const d = new Date(s.created_at);
      if (isNaN(d)) return false;

      if (filter === "today") {
        return toDateStr(d) === todayStr;
      }

      if (filter === "month") {
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
      }

      if (filter === "custom" && customDate) {
        return toDateStr(d) === customDate;
      }

      // "all"
      return true;
    });

    setFiltered(filteredData);
  }, [filter, sales, customDate]);

  // Total earnings (for current filter)
  const totalEarnings = filtered.reduce(
    (sum, sale) => sum + Number(sale.total || 0),
    0
  );

  // Per-product summary for summary panel
  const productSummary = filtered.reduce((acc, sale) => {
    const name = sale.product_name;
    const qty = Number(sale.quantity) || 0;
    acc[name] = (acc[name] || 0) + qty;
    return acc;
  }, {});

  const summaryString =
    Object.keys(productSummary).length === 0
      ? "No items sold."
      : Object.entries(productSummary)
          .map(([name, qty]) => `${qty} ${name}`)
          .join(" + ");

  // GROUP BY PURCHASE (receipt_id or similar)
  const groupedByReceipt = Object.values(
    filtered.reduce((acc, row) => {
      const key = row.receipt_id || row.order_id || row.id; // adjust to your field
      if (!acc[key]) {
        acc[key] = {
          receiptId: key,
          created_at: row.created_at,
          items: [],
          total: 0,
        };
      }
      acc[key].items.push(row);
      acc[key].total += Number(row.total || 0);
      // keep earliest or latest created_at if you like; here keep first
      return acc;
    }, {})
  ).sort((a, b) => (a.created_at < b.created_at ? 1 : -1)); // newest first

  return (
    <div className="min-h-screen bg-[#f3f4f6] p-6">
      {/* HEADER */}
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800">📊 Sales Report</h1>

        <Link to="/dashboard">
          <button className="px-4 py-2 bg-[#2563eb] text-white rounded-full text-sm font-semibold hover:bg-[#1d4ed8] transition">
            ⬅ Back to Dashboard
          </button>
        </Link>
      </header>

      {/* LANDSCAPE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT PANEL — Filters + Summary */}
        <div className="col-span-1 space-y-6">
          {/* FILTERS */}
          <div className="bg-white/90 backdrop-blur-sm p-6 rounded-3xl shadow-[0_18px_45px_rgba(15,23,42,0.12)] border border-gray-100">
            <h2 className="text-xl font-semibold mb-3 text-slate-700">
              Filter Sales
            </h2>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setFilter("today");
                  setCustomDate("");
                }}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                  filter === "today"
                    ? "bg-[#2563eb] text-white shadow"
                    : "bg-gray-200 text-slate-700 hover:bg-gray-300"
                }`}
              >
                Today
              </button>

              <button
                onClick={() => {
                  setFilter("month");
                  setCustomDate("");
                }}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                  filter === "month"
                    ? "bg-[#2563eb] text-white shadow"
                    : "bg-gray-200 text-slate-700 hover:bg-gray-300"
                }`}
              >
                This Month
              </button>

              <button
                onClick={() => {
                  setFilter("all");
                  setCustomDate("");
                }}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                  filter === "all"
                    ? "bg-[#2563eb] text-white shadow"
                    : "bg-gray-200 text-slate-700 hover:bg-gray-300"
                }`}
              >
                All
              </button>

              {/* Custom single date */}
              <div className="mt-4 border-t pt-4">
                <p className="text-sm font-semibold text-slate-700 mb-2">
                  Custom Date
                </p>
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => {
                    setCustomDate(e.target.value);
                    setFilter("custom");
                  }}
                  className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-[#2563eb]"
                />
              </div>
            </div>
          </div>

          {/* SUMMARY */}
          <div className="bg-white/90 backdrop-blur-sm p-6 rounded-3xl shadow-[0_18px_45px_rgba(15,23,42,0.12)] border border-gray-100">
            <h2 className="text-xl font-semibold mb-3 text-slate-700">
              📦 Summary
            </h2>

            <p className="text-lg text-slate-800">
              <strong>Total Sales:</strong> {filtered.length}
            </p>

            <p className="text-lg text-slate-800 mt-2">
              <strong>Total Earnings:</strong>{" "}
              <span className="text-green-600 font-bold">
                ₱{totalEarnings}
              </span>
            </p>

            <p className="text-sm text-slate-700 mt-4">
              <strong>Items sold:</strong> {summaryString}
            </p>
          </div>
        </div>

        {/* RIGHT PANEL — purchases with all their items */}
        <div className="col-span-2 bg-white/90 backdrop-blur-sm rounded-3xl shadow-[0_18px_45px_rgba(15,23,42,0.12)] border border-gray-100 p-6">
          <h2 className="text-xl font-semibold mb-4 text-slate-700">
            🧾 Sales Records
          </h2>

          {groupedByReceipt.length === 0 ? (
            <p className="text-gray-500 text-center">No sales found.</p>
          ) : (
            <ul className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {groupedByReceipt.map((sale) => (
                <li
                  key={sale.receiptId}
                  className="border border-gray-200 rounded-2xl p-3"
                >
                  {/* Sale header */}
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <p className="font-semibold text-slate-900">
                        Receipt {sale.receiptId}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDate(sale.created_at)}
                      </p>
                    </div>
                    <p className="text-green-600 font-bold text-lg">
                      ₱{sale.total}
                    </p>
                  </div>

                  {/* Items in this purchase */}
                  <ul className="mt-2 space-y-1">
                    {sale.items.map((item) => (
                      <li
                        key={item.id}
                        className="flex justify-between text-sm text-gray-700"
                      >
                        <span>
                          {item.product_name} — Qty: {item.quantity} × ₱
                          {item.price}
                        </span>
                        <span className="font-semibold text-green-600">
                          ₱{Number(item.quantity) * Number(item.price)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
