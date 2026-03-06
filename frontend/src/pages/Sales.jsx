import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function SalesPage() {
  const [sales, setSales] = useState([]);
  const [filter, setFilter] = useState("all");
  const [customDate, setCustomDate] = useState("");
  const [printDate, setPrintDate] = useState("");
  const [openPanel, setOpenPanel] = useState(null);

  const navigate = useNavigate();

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

  const groupedByReceipt = useMemo(() => {
    return Object.values(
      filtered.reduce((acc, row) => {
        const key = row.receipt_id || row.order_id || row.id;

        if (!acc[key]) {
          acc[key] = {
            receiptId: key,
            created_at: row.created_at,
            items: [],
            total: 0,
            refunded: row.refunded,
          };
        }

        acc[key].items.push(row);
        acc[key].total += Number(row.total || 0);

        return acc;
      }, {})
    ).sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  }, [filtered]);

  const handleRefund = async (receiptId) => {
    const confirm = window.confirm("Refund this order?");
    if (!confirm) return;

    try {
      const res = await fetch(
        `http://localhost:5000/api/products/refund/${receiptId}`,
        { method: "PUT" }
      );

      const data = await res.json();

      if (data.success) {
        alert("Refunded");
        loadSales();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePrint = () => {
    if (!printDate) return alert("Select a date first.");

    const daily = sales.filter(
      (s) => toDateStr(new Date(s.created_at)) === printDate
    );

    const total = daily.reduce((sum, s) => sum + Number(s.total || 0), 0);

    const w = window.open("", "_blank");

    w.document.write(`
      <html>
      <body style="font-family:Arial;padding:20px;">
      <h2>Daily Sales ${printDate}</h2>
      <table border="1" cellpadding="8">
      <tr>
      <th>Product</th>
      <th>Qty</th>
      <th>Total</th>
      </tr>
      ${daily
        .map(
          (s) => `
      <tr>
      <td>${s.product_name}</td>
      <td>${s.quantity}</td>
      <td>₱${s.total}</td>
      </tr>`
        )
        .join("")}
      </table>
      <h3>Total ₱${total}</h3>
      </body>
      </html>
    `);

    w.print();
  };

  return (
    <div className="h-screen w-screen flex flex-col">

      {/* HEADER */}
      <header className="bg-blue-600 p-4 flex justify-between items-center">

        <h1 className="text-3xl font-bold text-white">
          📊 Sales Report
        </h1>

        <div className="flex gap-3">

          {/* BLUE BUTTONS */}
          <button
            onClick={() => setOpenPanel("filter")}
            className="bg-blue-600 text-white border border-white px-4 py-2 rounded-full hover:bg-blue-700"
          >
            Filter
          </button>

          <button
            onClick={() => setOpenPanel("summary")}
            className="bg-blue-600 text-white border border-white px-4 py-2 rounded-full hover:bg-blue-700"
          >
            Summary
          </button>

          <button
            onClick={() => setOpenPanel("most")}
            className="bg-blue-600 text-white border border-white px-4 py-2 rounded-full hover:bg-blue-700"
          >
            Most Bought
          </button>

          <button
            onClick={() => setOpenPanel("print")}
            className="bg-blue-600 text-white border border-white px-4 py-2 rounded-full hover:bg-blue-700"
          >
            Print
          </button>

          {/* DASHBOARD */}
          <Link to="/dashboard">
            <button className="bg-white text-blue-600 px-4 py-2 rounded-full font-semibold hover:bg-gray-100">
              Dashboard
            </button>
          </Link>

        </div>
      </header>

      {/* BODY */}
      <div className="flex-1 bg-white p-6 overflow-y-auto">

        <h2 className="text-2xl font-semibold mb-4">
          Sales Records
        </h2>

        {groupedByReceipt.map((sale) => (
          <div
            key={sale.receiptId}
            className="border rounded-xl p-4 mb-3 flex justify-between"
          >
            <div>

              <p className="font-semibold">
                Receipt {sale.receiptId}
              </p>

              <p className="text-sm text-gray-500">
                {formatDate(sale.created_at)}
              </p>

              {sale.items.map((item) => (
                <p key={item.id}>
                  {item.product_name} × {item.quantity}
                </p>
              ))}

            </div>

            <div className="flex items-center gap-3">

              <p className="text-green-600 font-bold">
                ₱{sale.total}
              </p>

              {!sale.refunded && (
                <button
                  onClick={() => handleRefund(sale.receiptId)}
                  className="bg-red-600 text-white px-3 py-1 rounded-full"
                >
                  Refund
                </button>
              )}

            </div>
          </div>
        ))}

      </div>

      {/* OVERLAY */}
      {openPanel && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">

          <div className="bg-white p-6 rounded-3xl w-96 relative">

            <button
              onClick={() => setOpenPanel(null)}
              className="absolute top-3 right-4 text-xl"
            >
              ✕
            </button>

            {openPanel === "filter" && (
              <>
                <h2 className="text-xl font-bold mb-4">Filter Sales</h2>

                <button onClick={()=>setFilter("today")} className="block mb-2">Today</button>
                <button onClick={()=>setFilter("month")} className="block mb-2">This Month</button>
                <button onClick={()=>setFilter("all")} className="block mb-2">All</button>

                <input
                  type="date"
                  value={customDate}
                  onChange={(e)=>{
                    setFilter("custom");
                    setCustomDate(e.target.value);
                  }}
                  className="border p-2 w-full mt-2"
                />
              </>
            )}

            {openPanel === "summary" && (
              <>
                <h2 className="text-xl font-bold mb-4">Summary</h2>

                <p>Total Sales: {filtered.length}</p>
                <p>Total Earnings: ₱{totalEarnings}</p>
                <p className="mt-3">{summaryString}</p>
              </>
            )}

            {openPanel === "most" && (
              <>
                <h2 className="text-xl font-bold mb-4">Most Bought</h2>

                {mostBoughtItems.map(([name, qty]) => (
                  <div key={name} className="flex justify-between">
                    <span>{name}</span>
                    <span>{qty}</span>
                  </div>
                ))}
              </>
            )}

            {openPanel === "print" && (
              <>
                <h2 className="text-xl font-bold mb-4">Print Daily Sales</h2>

                <input
                  type="date"
                  value={printDate}
                  onChange={(e)=>setPrintDate(e.target.value)}
                  className="border p-2 w-full mb-3"
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