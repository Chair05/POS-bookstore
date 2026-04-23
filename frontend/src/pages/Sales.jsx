import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, } from "recharts";


export default function SalesPage() {
  const [sales, setSales] = useState([]);
  const [filter, setFilter] = useState("all");
  const [customDate, setCustomDate] = useState("");
  const [printDate, setPrintDate] = useState("");
  const [openPanel, setOpenPanel] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chartFilter, setChartFilter] = useState("month");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  /* ================= LOAD ================= */
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

  const toDateStr = (d) => d.toISOString().slice(0, 10);

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  /* ================= FILTER ================= */
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
      if (filter === "custom" && customDate)
        return toDateStr(d) === customDate;

      return true;
    });
  }, [sales, filter, customDate]);

  /* ================= SUMMARY ================= */
  const totalEarnings = useMemo(
    () =>
      filtered
        .filter((s) => !s.refunded)
        .reduce((sum, sale) => sum + Number(sale.total || 0), 0),
    [filtered]
  );

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

  const mostBoughtItems = useMemo(
    () =>
      Object.entries(productSummary)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5),
    [productSummary]
  );

  /* ================= GROUP ================= */
  const groupedByReceipt = useMemo(() => {
    return Object.values(
      filtered.reduce((acc, row) => {
        const key = row.receipt_id || row.id;

        if (!acc[key]) {
          acc[key] = {
            receiptId: key,
            created_at: row.created_at,
            items: [],
            total: 0,
          };
        }

        acc[key].items.push({
          ...row,
          refunded: Number(row.refunded) === 1,
          refund_type: row.refund_type,
        });

        acc[key].total += Number(row.total || 0);

        return acc;
      }, {})
    ).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [filtered]);

  const paginatedSales = useMemo(() => {
  const start = (currentPage - 1) * itemsPerPage;
  return groupedByReceipt.slice(start, start + itemsPerPage);
}, [groupedByReceipt, currentPage]);

  /* ================= PRINT ================= */
  const handlePrint = () => {
    if (!printDate) return alert("Select date");

    const daily = sales.filter(
      (s) => toDateStr(new Date(s.created_at)) === printDate
    );

    const total = daily.reduce((sum, s) => sum + Number(s.total || 0), 0);

    const w = window.open("", "_blank");

    w.document.write(`
      <h2>Daily Sales ${printDate}</h2>
      ${daily
        .map(
          (s) =>
            `<p>${s.product_name} x${s.quantity} - ₱${s.total}</p>`
        )
        .join("")}
      <h3>Total ₱${total}</h3>
    `);

    w.print();
  };

  const handleRefund = async (receiptId, saleId) => {
    const resellable = window.confirm("Is the item resellable? (OK for yes, Cancel for defective)");
    try {
      const response = await fetch(`http://localhost:5000/api/products/refund/${receiptId}/${saleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resellable })
      });
      const data = await response.json();
      if (data.success) {
        loadSales(); // reload sales
      } else {
        alert(data.message || "Refund failed");
      }
    } catch (err) {
      console.error(err);
      alert("Error processing refund");
    }
  };

  const chartData = useMemo(() => {
  const map = {};

  sales.forEach((s) => {
    if (s.refunded) return;

    const date = new Date(s.created_at);

    let key = "";

    if (chartFilter === "day") {
      key = date.toISOString().slice(0, 10);
    }

    if (chartFilter === "week") {
      const firstDay = new Date(date);
      firstDay.setDate(date.getDate() - date.getDay());
      key = firstDay.toISOString().slice(0, 10);
    }

    if (chartFilter === "month") {
      key = `${date.getFullYear()}-${date.getMonth() + 1}`;
    }

    if (chartFilter === "year") {
      key = `${date.getFullYear()}`;
    }

    if (chartFilter === "all") {
      key = "All";
    }

    map[key] = (map[key] || 0) + Number(s.total || 0);
  });

  return Object.entries(map).map(([name, total]) => ({
    name,
    total,
  }));
}, [sales, chartFilter]);

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-100">

      {/* SIDEBAR */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-blue-700 p-5 z-50 transform transition ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <h2 className="text-xl font-bold text-white mb-6">Menu</h2>

        <Link to="/dashboard" onClick={() => setSidebarOpen(false)} className="block text-white py-2 hover:bg-blue-600 px-3 rounded">
          Home
        </Link>

        <Link to="/stock" onClick={() => setSidebarOpen(false)} className="block text-white py-2 hover:bg-blue-600 px-3 rounded">
          Inventory
        </Link>

        <Link to="/sales" onClick={() => setSidebarOpen(false)} className="block text-white py-2 bg-blue-500 px-3 rounded">
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


      {/* OVERLAY */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}
<header className="flex items-center justify-between bg-blue-600 px-6 py-4 shadow-md text-white">

  {/* LEFT */}
  <div className="flex items-center gap-3">
    <button onClick={() => setSidebarOpen(true)}   
     className="text-2xl transition relative -top-[7px]">☰</button>
    <h1 className="text-2xl font-semibold">Sales</h1>
  </div>

</header>

{/* BODY */}
<div className="flex-1 p-6 overflow-y-auto space-y-6">

  {/* ================= OVERVIEW ================= */}
  <div className="space-y-4">

    <h2 className="text-xl font-semibold">Overview</h2>

    {/* KPI CARDS */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

      <div className="bg-white p-4 rounded-2xl shadow-sm">
        <p className="text-sm text-gray-500">Total Sales</p>
        <p className="text-xl font-bold">{filtered.length}</p>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm">
        <p className="text-sm text-gray-500">Revenue</p>
        <p className="text-xl font-bold text-green-600">
          ₱{totalEarnings}
        </p>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm">
        <p className="text-sm text-gray-500">Top Item</p>
        <p className="text-sm font-semibold">
          {mostBoughtItems[0]?.[0] || "N/A"}
        </p>
      </div>

    </div>

    {/* SALES CHART */}
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex justify-between items-center mb-5">
        <h2 className="font-semibold text-lg">Sales Chart</h2>

        <select
          value={chartFilter}
          onChange={(e) => setChartFilter(e.target.value)}
          className="border px-3 py-1 rounded-md text-sm"
        >
          <option value="all">All</option>
          <option value="year">Year</option>
          <option value="month">Month</option>
          <option value="week">Week</option>
          <option value="day">Day</option>
        </select>
      </div>

      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#2563eb"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>

  </div>

  {/* ================= TRANSACTIONS ================= */}
<div className="space-y-4">

  {/* HEADER ROW */}
  <div className="flex justify-between items-center flex-wrap gap-2">

    <h2 className="text-xl font-semibold">Transactions</h2>

    <div className="flex items-center gap-2">

      {/* DATE FILTER */}
      <input
        type="date"
        value={customDate}
        onChange={(e) => {
          setFilter("custom");
          setCustomDate(e.target.value);
        }}
        className="border px-3 py-1 rounded-md text-sm"
      />

      {/* FILTER RESET */}
      <button
        onClick={() => setFilter("all")}
        className="px-3 py-1 rounded-md bg-gray-200 text-sm hover:bg-gray-300 transition relative -top-[7px]"
      >
        Reset
      </button>

      {/* PRINT BUTTON */}
      <button
        onClick={() => {
          const selected = customDate || new Date().toISOString().slice(0, 10);
          setPrintDate(selected);
          handlePrint();
        }}
        className="bg-blue-600 text-white px-4 py-1 rounded-md text-sm hover:bg-blue-700 transition relative -top-[7px]"
      >
        Print
      </button>

    </div>
  </div>

    {/* SALES LIST */}
    {paginatedSales.map((sale) => (
      <div
        key={sale.receiptId}
        className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition"
      >
        <div className="flex justify-between gap-6 flex-wrap">

          {/* LEFT */}
          <div className="flex-1 min-w-[250px]">
            <p className="font-semibold text-lg">
              Receipt {sale.receiptId}
            </p>

            <p className="text-sm text-gray-500 mt-1">
              {formatDate(sale.created_at)}
            </p>

            <div className="mt-3 space-y-1">
              {sale.items.map((item) => (
                <p key={item.id} className="text-sm text-gray-700">
                  • {item.product_name} × {item.quantity}
                </p>
              ))}
            </div>
          </div>

          {/* RIGHT */}
          <div className="min-w-[220px] text-right flex flex-col justify-between">

            <p className="text-green-600 font-bold text-xl">
              ₱{sale.total}
            </p>

            <div className="mt-3 flex flex-col items-end gap-2">
              {sale.items.map((item) => (
                item.refunded ? (
                  <span key={item.id} className="text-xs text-red-500">
                    {item.refund_type === "resellable"
                      ? "Resellable"
                      : "Defective"}
                  </span>
                ) : (
                  <button
                    key={item.id}
                    onClick={() =>
                      handleRefund(sale.receiptId, item.id)
                    }
                    className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600"
                  >
                    Refund
                  </button>
                )
              ))}
            </div>

          </div>

        </div>
      </div>
    ))}

    {/* PAGINATION */}
    <div className="flex justify-center items-center gap-2 pt-4">
      {Array.from(
        { length: Math.ceil(groupedByReceipt.length / itemsPerPage) },
        (_, i) => i + 1
      ).map((page) => (
        <button
          key={page}
          onClick={() => setCurrentPage(page)}
          className={`px-4 py-1 rounded-md border text-sm transition ${
            currentPage === page
              ? "bg-blue-600 text-white"
              : "bg-white hover:bg-gray-100"
          }`}
        >
          {page}
        </button>
      ))}
    </div>

  </div>

</div>

{/* MODAL (UNCHANGED) */}
{openPanel && (
  <div className="fixed inset-0 bg-black/40 flex justify-center items-center backdrop-blur-sm">
    <div className="bg-white rounded-2xl p-6 w-80 shadow-lg">

      <button
        onClick={() => setOpenPanel(null)}
        className="mb-3 text-sm text-gray-500"
      >
        Close
      </button>

      {openPanel === "filter" && (
        <>
          <button onClick={() => setFilter("today")} className="block mb-2">Today</button>
          <button onClick={() => setFilter("month")} className="block mb-2">Month</button>
          <button onClick={() => setFilter("all")} className="block mb-2">All</button>

          <input
            type="date"
            className="border p-2 w-full mt-2"
            onChange={(e) => {
              setFilter("custom");
              setCustomDate(e.target.value);
            }}
          />
        </>
      )}

      {openPanel === "summary" && (
        <>
          <h2 className="text-lg font-semibold mb-3">Summary</h2>
          <p>Total Sales: {filtered.length}</p>
          <p className="text-green-600 font-bold">
            ₱{totalEarnings}
          </p>
        </>
      )}

      {openPanel === "most" && (
        <>
          {mostBoughtItems.map(([n, q]) => (
            <p key={n}>{n} - {q}</p>
          ))}
        </>
      )}

      {openPanel === "print" && (
        <>
          <input
            type="date"
            className="border p-2 w-full mb-2"
            onChange={(e) => setPrintDate(e.target.value)}
          />
          <button
            onClick={handlePrint}
            className="bg-blue-600 text-white w-full py-2 rounded"
          >
            Print
          </button>
        </>
      )}

    </div>
  </div>
)}

    </div>
  );
}