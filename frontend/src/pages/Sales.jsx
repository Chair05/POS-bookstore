import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export default function SalesPage() {
  const [sales, setSales] = useState([]);
  const [filter, setFilter] = useState("all");
  const [customDate, setCustomDate] = useState("");
  const [printDate, setPrintDate] = useState("");

  // ---------------------
  // Load sales from backend
  // ---------------------
  const loadSales = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/products/sales");
      const data = await res.json();
      if (data.success) setSales(data.sales);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadSales();
  }, []);

  // ---------------------
  // Helper functions
  // ---------------------
  const toDateStr = (d) => d.toISOString().slice(0, 10);
  const formatDate = (dateString) =>
    new Date(dateString).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  // ---------------------
  // Filtered sales (derived from sales + filter)
  // ---------------------
  const filtered = useMemo(() => {
    const now = new Date();
    const todayStr = toDateStr(now);
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    return sales.filter((s) => {
      const d = new Date(s.created_at);
      if (isNaN(d)) return false;
      if (filter === "today") return toDateStr(d) === todayStr;
      if (filter === "month")
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
      if (filter === "custom" && customDate) return toDateStr(d) === customDate;
      return true;
    });
  }, [sales, filter, customDate]);

  // ---------------------
  // Total earnings
  // ---------------------
  const totalEarnings = useMemo(
    () =>
      filtered
        .filter((s) => !s.refunded)
        .reduce((sum, sale) => sum + Number(sale.total || 0), 0),
    [filtered]
  );

  // ---------------------
  // Product summary
  // ---------------------
  const productSummary = useMemo(() => {
    return filtered
      .filter((s) => !s.refunded)
      .reduce((acc, sale) => {
        const name = sale.product_name;
        const qty = Number(sale.quantity) || 0;
        acc[name] = (acc[name] || 0) + qty;
        return acc;
      }, {});
  }, [filtered]);

  const summaryString =
    Object.keys(productSummary).length === 0
      ? "No items sold."
      : Object.entries(productSummary)
          .map(([name, qty]) => `${qty} ${name}`)
          .join(" + ");

  const mostBoughtItems = useMemo(
    () =>
      Object.entries(productSummary)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5),
    [productSummary]
  );

  // ---------------------
  // Group sales by receipt
  // ---------------------
  const groupedByReceipt = useMemo(() => {
    return Object.values(
      filtered.reduce((acc, row) => {
        const key = row.receipt_id || row.order_id || row.id;
        if (!acc[key])
          acc[key] = {
            receiptId: key,
            created_at: row.created_at,
            items: [],
            total: 0,
            refunded: row.refunded,
            refund_type: row.refund_type || null,
          };
        acc[key].items.push(row);
        acc[key].total += Number(row.total || 0);
        if (row.refunded) {
          acc[key].refunded = 1;
          acc[key].refund_type = row.refund_type;
        }
        return acc;
      }, {})
    ).sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  }, [filtered]);

  // ---------------------
  // Chart data
  // ---------------------
  const chartData = useMemo(() => {
    const earningsByDate = filtered
      .filter((s) => !s.refunded)
      .reduce((acc, sale) => {
        const day = toDateStr(new Date(sale.created_at));
        acc[day] = (acc[day] || 0) + Number(sale.total || 0);
        return acc;
      }, {});

    return Object.entries(earningsByDate)
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [filtered]);

  // ---------------------
  // Refund sale
  // ---------------------
  const handleRefund = async (receiptId) => {
    const choice = window.prompt(
      "Type:\n1 = Resellable (return stock)\n2 = Defective (no stock return)"
    );

    if (!choice) return;

    const resellable = choice === "1";

    try {
      const res = await fetch(
        `http://localhost:5000/api/products/refund/${receiptId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resellable }),
        }
      );

      const data = await res.json();

      if (data.success) {
        // Update local state
        setSales((prev) =>
          prev.map((sale) =>
            sale.receipt_id === receiptId
              ? { ...sale, refunded: 1, refund_type: resellable ? "resellable" : "defective" }
              : sale
          )
        );
        alert(data.message);
        await loadSales(); // refresh sales to get updated stock
      } else {
        alert("Refund failed: " + data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  // ---------------------
  // Print daily sales
  // ---------------------
  const handlePrint = () => {
    if (!printDate) return alert("Select a date to print.");
    const dailySalesRaw = sales.filter(
      (s) => toDateStr(new Date(s.created_at)) === printDate
    );
    const dailySales = Object.values(
      dailySalesRaw.reduce((acc, row) => {
        const key = row.receipt_id || row.order_id || row.id;
        if (!acc[key])
          acc[key] = { receiptId: key, created_at: row.created_at, items: [], total: 0 };
        acc[key].items.push(row);
        acc[key].total += Number(row.total || 0);
        return acc;
      }, {})
    );

    const dailyTotal = dailySales.reduce((sum, s) => sum + Number(s.total || 0), 0);

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Daily Sales - ${printDate}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #2563eb; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background-color: #f3f4f6; }
            tfoot td { font-weight: bold; }
            .refunded { text-decoration: line-through; color: red; }
          </style>
        </head>
        <body>
          <h1>Daily Sales - ${printDate}</h1>
          <table>
            <thead>
              <tr>
                <th>Receipt ID</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${dailySales
                .map(
                  (sale) =>
                    sale.items
                      .map(
                        (item, idx) => `
                        <tr class="${item.refunded ? "refunded" : ""}">
                          <td>${idx === 0 ? sale.receiptId : ""}</td>
                          <td>${item.product_name}</td>
                          <td>${item.quantity}</td>
                          <td>₱${item.price}</td>
                          <td>₱${Number(item.quantity) * Number(item.price)}</td>
                        </tr>
                      `
                      )
                      .join("")
                )
                .join("")}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="4">Total Earnings</td>
                <td>₱${dailyTotal}</td>
              </tr>
            </tfoot>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  // ---------------------
  // Render
  // ---------------------
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

      {/* Main layout */}
      <div className="flex flex-1 gap-6 overflow-hidden flex-col lg:flex-row">
        {/* Left Panel */}
        <div className="flex flex-col w-full lg:w-96 gap-6 flex-shrink-0 overflow-y-auto">
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
              <strong>Total Earnings:</strong> <span className="text-green-600 font-bold text-lg">₱{totalEarnings}</span>
            </p>
            <p className="text-base text-gray-700 mt-4"><strong>Items sold:</strong> {summaryString}</p>
          </div>

          {/* Most Bought Items */}
          <div className="bg-white rounded-3xl p-6 shadow-md border border-gray-200">
            <h2 className="text-2xl font-semibold mb-3 text-gray-800">🔥 Most Bought Items</h2>
            {mostBoughtItems.length === 0 ? (
              <p className="text-gray-500 text-base">No items sold yet.</p>
            ) : (
              <ul className="space-y-2">
                {mostBoughtItems.map(([name, qty], index) => (
                  <li key={index} className="flex justify-between text-base text-gray-700">
                    <span>{name}</span>
                    <span className="font-semibold text-green-600">{qty}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Print Daily Sales */}
          <div className="bg-white rounded-3xl p-6 shadow-md border border-gray-200 mt-4">
            <h2 className="text-2xl font-semibold mb-3 text-gray-800">🖨 Print Daily Sales</h2>
            <input
              type="date"
              value={printDate}
              onChange={(e) => setPrintDate(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 mb-3"
            />
            <button
              onClick={handlePrint}
              className="w-full py-3 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
            >
              Print Daily Sales
            </button>
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Sales Chart */}
          <div className="bg-white rounded-3xl p-6 shadow-md border border-gray-200 mb-6 h-80">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">📈 Sales Chart</h2>
            {chartData.length === 0 ? (
              <p className="text-gray-500 text-center text-lg mt-20">No sales to display.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => `₱${value}`} />
                  <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Sales Records */}
          <div className="bg-white rounded-3xl p-6 shadow-md border border-gray-200 flex-1 flex flex-col overflow-y-auto">
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
                      <div className="flex items-center gap-4">
                        <p className="text-green-600 font-bold text-xl">₱{sale.total}</p>
                        {!sale.refunded && (
                          <button
                            onClick={() => handleRefund(sale.receiptId)}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded-full hover:bg-red-700 transition"
                          >
                            Refund
                          </button>
                        )}
                        {sale.refunded && (
                          <span
                            className={`px-3 py-1 text-sm rounded-full ${
                              sale.refund_type === "resellable"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-300 text-red-700"
                            }`}
                          >
                            {sale.refund_type === "resellable" ? "Resellable Refund" : "Defective Refund"}
                          </span>
                        )}
                      </div>
                    </div>
                    <ul className="mt-2 space-y-2">
                      {sale.items.map((item) => (
                        <li
                          key={item.id}
                          className={`flex justify-between text-base ${sale.refunded ? "text-red-400 line-through" : "text-gray-700"}`}
                        >
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
    </div>
  );
}
