import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";

export default function SalesPage() {
  const [sales, setSales] = useState([]);
  const [filter, setFilter] = useState("all");
  const [customDate, setCustomDate] = useState("");
  const [printDate, setPrintDate] = useState("");
  const [openPanel, setOpenPanel] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

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
            refunded: row.refunded,
            refund_type: row.refund_type,
          };
        }

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

  /* ================= REFUND ================= */
  const handleRefund = async (receiptId) => {
    const choice = window.prompt(
      "1 = Resellable (return to stock)\n2 = Defective"
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
        loadSales();
      }
    } catch (err) {
      console.error(err);
    }
  };

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

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-100">

      {/* HEADER */}
      <header className="bg-blue-600 px-6 py-4 flex justify-between items-center shadow-md">
        <h1 className="text-2xl text-white font-semibold">Sales</h1>

        <div className="flex items-center gap-3 relative">

          {/* OPTIONS */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition"
            >
              Options
            </button>

            <div
              className={`absolute right-0 mt-2 w-48 backdrop-blur-md bg-white/90 shadow-xl
              transition-all duration-300 ease-out
              ${
                showDropdown
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 -translate-y-2 pointer-events-none"
              }`}
            >
              {["filter", "summary", "most", "print"].map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    setOpenPanel(item);
                    setShowDropdown(false);
                  }}
                  className="block w-full px-4 py-2 text-left hover:bg-gray-100 capitalize"
                >
                  {item}
                </button>
              ))}

              <Link to="/sales-chart">
                <div
                  onClick={() => setShowDropdown(false)}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  Sales Chart
                </div>
              </Link>
            </div>
          </div>

          {/* BACK */}
          <Link to="/dashboard">
            <button className="bg-white text-blue-600 px-4 py-2 rounded-full font-semibold hover:bg-gray-100">
              ⬅ Back
            </button>
          </Link>

        </div>
      </header>

      {/* BODY */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4">

        {groupedByReceipt.map((sale) => (
          <div
            key={sale.receiptId}
            className="bg-white rounded-2xl p-4 shadow hover:shadow-lg transition"
          >
            <div className="flex justify-between">

              <div>
                <p className="font-semibold text-lg">
                  Receipt {sale.receiptId}
                </p>
                <p className="text-sm text-gray-500">
                  {formatDate(sale.created_at)}
                </p>

                <div className="mt-2 space-y-1">
                  {sale.items.map((item) => (
                    <p key={item.id} className="text-sm">
                      {item.product_name} × {item.quantity}
                    </p>
                  ))}
                </div>
              </div>

              <div className="text-right flex flex-col justify-between">
                <p className="text-green-600 font-bold text-lg">
                  ₱{sale.total}
                </p>

                {!sale.refunded ? (
                  <button
                    onClick={() => handleRefund(sale.receiptId)}
                    className="bg-red-500 text-white px-3 py-1 rounded-full text-sm hover:bg-red-600"
                  >
                    Refund
                  </button>
                ) : (
                  <span className="text-xs text-red-500">
                    {sale.refund_type === "resellable"
                      ? "Resellable"
                      : "Defective"}
                  </span>
                )}
              </div>

            </div>
          </div>
        ))}

      </div>

      {/* MODAL */}
      {openPanel && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center backdrop-blur-sm">

          <div className="bg-white rounded-2xl p-6 w-80 shadow-lg">

            <button
              onClick={() => setOpenPanel(null)}
              className="mb-3 text-sm text-gray-500"
            >
              Close
            </button>

            {/* FILTER */}
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

            {/* SUMMARY (UPDATED) */}
            {openPanel === "summary" && (
              <>
                <h2 className="text-lg font-semibold mb-3">Summary</h2>

                <div className="mb-3">
                  <p className="text-sm text-gray-500">Total Sales</p>
                  <p className="text-xl font-bold">{filtered.length}</p>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-500">Total Earnings</p>
                  <p className="text-xl font-bold text-green-600">
                    ₱{totalEarnings}
                  </p>
                </div>

                <div className="border-t pt-3">
                  <p className="text-sm font-semibold mb-2">
                    Items Sold
                  </p>

                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {Object.entries(productSummary).map(([name, qty]) => (
                      <div
                        key={name}
                        className="flex justify-between bg-gray-50 px-3 py-2 rounded-lg"
                      >
                        <span>{name}</span>
                        <span className="font-semibold text-blue-600">
                          x{qty}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* MOST */}
            {openPanel === "most" && (
              <>
                {mostBoughtItems.map(([n, q]) => (
                  <p key={n}>{n} - {q}</p>
                ))}
              </>
            )}

            {/* PRINT */}
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