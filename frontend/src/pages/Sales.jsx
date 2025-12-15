import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function SalesPage() {
  const [sales, setSales] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [filter, setFilter] = useState("all");
  const [customDate, setCustomDate] = useState("");

  const loadSales = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/products/sales");
      const data = await res.json();
      if (data.success) {
        setSales(data.sales);
        setFiltered(data.sales);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadSales();
  }, []);

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const toDateStr = (d) => d.toISOString().slice(0, 10);

  useEffect(() => {
    const now = new Date();
    const todayStr = toDateStr(now);
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    const filteredData = sales.filter((s) => {
      const d = new Date(s.created_at);
      if (isNaN(d)) return false;
      if (filter === "today") return toDateStr(d) === todayStr;
      if (filter === "month") return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
      if (filter === "custom" && customDate) return toDateStr(d) === customDate;
      return true;
    });

    setFiltered(filteredData);
  }, [filter, sales, customDate]);

  const totalEarnings = filtered.reduce((sum, sale) => sum + Number(sale.total || 0), 0);

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

  const groupedByReceipt = Object.values(
    filtered.reduce((acc, row) => {
      const key = row.receipt_id || row.order_id || row.id;
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
      return acc;
    }, {})
  ).sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

  return (
    <div className="h-screen w-screen bg-blue-500 p-4 flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center mb-4 flex-shrink-0">
        <h1 className="text-4xl font-bold text-white">📊 Sales Report</h1>
        <Link to="/dashboard">
          <button className="px-5 py-3 bg-white text-blue-600 rounded-full text-lg font-semibold hover:bg-gray-100 transition">
            ⬅ Back to Dashboard
          </button>
        </Link>
      </header>

      {/* Main landscape layout */}
      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Left Panel */}
        <div className="flex flex-col w-96 gap-6 flex-shrink-0 overflow-y-auto">
          {/* Filters */}
          <div className="bg-white rounded-3xl p-6 shadow-md border border-gray-200">
            <h2 className="text-2xl font-semibold mb-3 text-gray-800">Filter Sales</h2>
            <div className="flex flex-col gap-4">
              <button
                onClick={() => { setFilter("today"); setCustomDate(""); }}
                className={`px-5 py-3 rounded-full text-base font-semibold transition ${
                  filter === "today" ? "bg-blue-600 text-white shadow-md" : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                }`}
              >
                Today
              </button>
              <button
                onClick={() => { setFilter("month"); setCustomDate(""); }}
                className={`px-5 py-3 rounded-full text-base font-semibold transition ${
                  filter === "month" ? "bg-blue-600 text-white shadow-md" : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                }`}
              >
                This Month
              </button>
              <button
                onClick={() => { setFilter("all"); setCustomDate(""); }}
                className={`px-5 py-3 rounded-full text-base font-semibold transition ${
                  filter === "all" ? "bg-blue-600 text-white shadow-md" : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                }`}
              >
                All
              </button>
              <div className="mt-4 border-t pt-4">
                <p className="text-sm font-semibold text-gray-800 mb-2">Custom Date</p>
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => { setCustomDate(e.target.value); setFilter("custom"); }}
                  className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-3xl p-6 shadow-md border border-gray-200">
            <h2 className="text-2xl font-semibold mb-3 text-gray-800">📦 Summary</h2>
            <p className="text-lg text-gray-800"><strong>Total Sales:</strong> {filtered.length}</p>
            <p className="text-lg text-gray-800 mt-2">
              <strong>Total Earnings:</strong>{" "}
              <span className="text-green-600 font-bold text-lg">₱{totalEarnings}</span>
            </p>
            <p className="text-base text-gray-700 mt-4"><strong>Items sold:</strong> {summaryString}</p>
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex-1 bg-white rounded-3xl p-6 shadow-md border border-gray-200 flex flex-col overflow-y-auto">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">🧾 Sales Records</h2>

          {groupedByReceipt.length === 0 ? (
            <p className="text-gray-500 text-center text-lg">No sales found.</p>
          ) : (
            <ul className="space-y-4 overflow-y-auto">
              {groupedByReceipt.map((sale) => (
                <li key={sale.receiptId} className="border border-gray-200 rounded-2xl p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <p className="font-semibold text-gray-900 text-lg">Receipt {sale.receiptId}</p>
                      <p className="text-xs text-gray-400">{formatDate(sale.created_at)}</p>
                    </div>
                    <p className="text-green-600 font-bold text-xl">₱{sale.total}</p>
                  </div>

                  <ul className="mt-2 space-y-2">
                    {sale.items.map((item) => (
                      <li key={item.id} className="flex justify-between text-base text-gray-700">
                        <span>{item.product_name} — Qty: {item.quantity} × ₱{item.price}</span>
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
