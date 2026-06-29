import React, { useCallback, useEffect, useMemo, useState } from "react";
import Sidebar from "./Sidebar";
import { getDepartmentInfo } from "../utils/departmentUtils";

export default function SalesPage() {
  const [sales, setSales] = useState([]);
  const [filter, setFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [customDate, setCustomDate] = useState("");
  const [openPanel, setOpenPanel] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  /* ================= LOAD ================= */
  const loadSales = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:5000/api/products/sales");
      const data = await res.json();
      console.log("Loaded sales:", data.sales);
      if (data.success) setSales(data.sales);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  const toDateStr = (d) => d.toISOString().slice(0, 10);

  const getSaleDepartmentLabel = useCallback((row) => {
    const rawDepartment = String(row.product_department || row.department || row.category || row.product?.department || row.product?.category || row.category_name || row.product_category?.name || "").trim();
    if (!rawDepartment) return null;
    const label = getDepartmentInfo(rawDepartment).label;
    if (label === "Students" || label === "Teachers" || label === "Personnel") return null;
    return label === "General" ? null : label;
  }, []);

  const getSaleBuyerTypeLabel = useCallback((row) => {
    const rawBuyerType = String(row.customer_type || row.checkout_department || "").trim();
    if (!rawBuyerType) return null;
    const label = getDepartmentInfo(rawBuyerType).label;
    return label === "Students" || label === "Teachers" || label === "Personnel" ? label : null;
  }, []);

  const getProductDepartmentLabel = useCallback((row) => {
    const rawDepartment = String(row.product_department || row.department || row.category || row.product?.department || row.product?.category || row.category_name || row.product_category?.name || "").trim();
    if (!rawDepartment) return null;
    const label = getDepartmentInfo(rawDepartment).label;
    if (label === "Students" || label === "Teachers" || label === "Personnel") return null;
    return label === "General" ? null : label;
  }, []);

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

      if (departmentFilter !== "all") {
        const deptLabel = getSaleDepartmentLabel(s);
        return deptLabel === departmentFilter;
      }

      return true;
    });
  }, [sales, filter, customDate, departmentFilter, getSaleDepartmentLabel]);

  /* ================= SUMMARY ================= */
  const totalEarnings = useMemo(
    () =>
      filtered
        .reduce((sum, sale) => sum + Number(sale.total || 0), 0),
    [filtered]
  );

  const productSummary = useMemo(() => {
    return filtered
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
        const key = row.receipt_id != null ? row.receipt_id : row.id;

        if (!acc[key]) {
          acc[key] = {
            receiptId: key,
            created_at: row.created_at,
            customer_name: row.customer_name?.trim() || null,
            items: {},
            total: 0,
          };
        }

        const itemKey = `${row.product_name}-${row.barcode}-${getProductDepartmentLabel(row) || ""}-${getSaleBuyerTypeLabel(row) || ""}`;
        const existingItem = acc[key].items[itemKey];
        const quantity = Number(row.quantity) || 0;
        const itemTotal = Number(row.total) || 0;

        if (existingItem) {
          existingItem.quantity += quantity;
          existingItem.total += itemTotal;
        } else {
          acc[key].items[itemKey] = {
            id: row.id || itemKey,
            product_name: row.product_name,
            quantity,
            total: itemTotal,
            department: getProductDepartmentLabel(row),
            buyerType: getSaleBuyerTypeLabel(row),
          };
        }

        acc[key].total += itemTotal;

        return acc;
      }, {})
    )
      .map((receipt) => ({
        ...receipt,
        items: Object.values(receipt.items),
      }))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [filtered, getProductDepartmentLabel, getSaleBuyerTypeLabel]);

  const paginatedSales = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return groupedByReceipt.slice(start, start + itemsPerPage);
  }, [groupedByReceipt, currentPage]);

  const departmentOptions = useMemo(
    () => Array.from(new Set(sales.map((sale) => getSaleDepartmentLabel(sale)).filter(Boolean))).sort(),
    [sales, getSaleDepartmentLabel]
  );

  const totalPages = Math.ceil(groupedByReceipt.length / itemsPerPage);

  const paginationItems = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = [];

    if (currentPage <= 4) {
      pages.push(1, 2, 3, 4, 5, "...", totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
    }

    return pages;
  }, [currentPage, totalPages]);

  /* ================= PRINT ================= */
  const handlePrint = () => {
    if (!printDate) return alert("Select date");

    const daily = sales.filter(
      (s) =>
        toDateStr(new Date(s.created_at)) === printDate &&
        (departmentFilter === "all" || getSaleDepartmentLabel(s) === departmentFilter)
    );

    const total = daily.reduce((sum, s) => sum + Number(s.total || 0), 0);

    const rows = daily.reduce((acc, s) => {
      const label = [getSaleBuyerTypeLabel(s), getProductDepartmentLabel(s)].filter(Boolean).join(")(");
      const labelText = label ? `(${label})` : "";
      const key = `${s.product_name}-${s.barcode}-${labelText}`;
      if (acc[key]) {
        acc[key].quantity += Number(s.quantity) || 0;
        acc[key].total += Number(s.total) || 0;
      } else {
        acc[key] = {
          product_name: s.product_name,
          quantity: Number(s.quantity) || 0,
          total: Number(s.total) || 0,
          department: labelText,
        };
      }
      return acc;
    }, {});

    const w = window.open("", "_blank");

    w.document.write(`
      <html>
        <head>
          <title>Daily Sales ${printDate}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1f2937; }
            .header { text-align: center; margin-bottom: 32px; padding-bottom: 16px; border-bottom: 2px solid #2563eb; }
            .header h1 { font-size: 24px; color: #1e3a8a; }
            .header p { color: #6b7280; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; }
            th { background: #2563eb; color: #fff; padding: 10px 14px; text-align: left; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; }
            td { padding: 10px 14px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
            tr:nth-child(even) td { background: #f9fafb; }
            .total-row td { font-weight: 700; font-size: 16px; border-top: 2px solid #2563eb; border-bottom: none; background: #eff6ff; }
            .text-right { text-align: right; }
            .footer { text-align: center; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Daily Sales Report</h1>
            <p>${printDate}</p>
          </div>
          <table>
            <thead>
              <tr>
                  <th>Product</th>
                  <th>Department</th>
                  <th class="text-right">Qty</th>
                  <th class="text-right">Total</th>
                </tr>
            </thead>
            <tbody>
                  ${Object.values(rows)
                .map(
                  (r) =>
                    `<tr><td>${r.product_name}</td><td>${r.department || "-"}</td><td class="text-right">${r.quantity}</td><td class="text-right">₱${r.total.toFixed(2)}</td></tr>`
                )
                .join("")}
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="2">Total</td>
                <td class="text-right">${daily.reduce((s, r) => s + (Number(r.quantity) || 0), 0)}</td>
                <td class="text-right">₱${total.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
          <div class="footer">LCCB Bookstore &mdash; Generated ${new Date().toLocaleString()}</div>
        </body>
      </html>
    `);

    w.print();
  };

  const handleMonthlyPrint = () => {
    if (!printMonth) return alert("Select month");

    const monthly = sales.filter((s) => {
      const d = new Date(s.created_at);
      return (
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` === printMonth &&
        (departmentFilter === "all" || getSaleDepartmentLabel(s) === departmentFilter)
      );
    });

    if (monthly.length === 0) return alert("No sales for this month");

    const total = monthly.reduce((sum, s) => sum + Number(s.total || 0), 0);

    const rows = monthly.reduce((acc, s) => {
      const label = [getSaleBuyerTypeLabel(s), getProductDepartmentLabel(s)].filter(Boolean).join(")(");
      const labelText = label ? `(${label})` : "";
      const key = `${s.product_name}-${s.barcode}-${labelText}`;
      if (acc[key]) {
        acc[key].quantity += Number(s.quantity) || 0;
        acc[key].total += Number(s.total) || 0;
      } else {
        acc[key] = {
          product_name: s.product_name,
          quantity: Number(s.quantity) || 0,
          total: Number(s.total) || 0,
          department: labelText,
        };
      }
      return acc;
    }, {});

    const [year, month] = printMonth.split("-");
    const monthName = new Date(year, month - 1).toLocaleString("en-US", { month: "long", year: "numeric" });
    const daysActive = new Set(monthly.map((s) => new Date(s.created_at).toDateString())).size;

    const w = window.open("", "_blank");

    w.document.write(`
      <html>
        <head>
          <title>Monthly Sales ${printMonth}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1f2937; }
            .header { text-align: center; margin-bottom: 32px; padding-bottom: 16px; border-bottom: 2px solid #2563eb; }
            .header h1 { font-size: 24px; color: #1e3a8a; }
            .header p { color: #6b7280; margin-top: 4px; }
            .summary { display: flex; gap: 24px; justify-content: center; margin-bottom: 24px; }
            .summary-card { text-align: center; padding: 12px 24px; background: #f9fafb; border-radius: 8px; }
            .summary-card .label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
            .summary-card .value { font-size: 20px; font-weight: 700; color: #1e3a8a; }
            table { width: 100%; border-collapse: collapse; }
            th { background: #2563eb; color: #fff; padding: 10px 14px; text-align: left; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; }
            td { padding: 10px 14px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
            tr:nth-child(even) td { background: #f9fafb; }
            .total-row td { font-weight: 700; font-size: 16px; border-top: 2px solid #2563eb; border-bottom: none; background: #eff6ff; }
            .text-right { text-align: right; }
            .footer { text-align: center; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Monthly Sales Report</h1>
            <p>${monthName}</p>
          </div>
          <div class="summary">
            <div class="summary-card">
              <div class="label">Total Revenue</div>
              <div class="value">₱${total.toFixed(2)}</div>
            </div>
            <div class="summary-card">
              <div class="label">Items Sold</div>
              <div class="value">${monthly.reduce((s, r) => s + (Number(r.quantity) || 0), 0)}</div>
            </div>
            <div class="summary-card">
              <div class="label">Days with Sales</div>
              <div class="value">${daysActive}</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                  <th>Product</th>
                  <th>Department</th>
                  <th class="text-right">Qty</th>
                  <th class="text-right">Total</th>
                </tr>
            </thead>
            <tbody>
                  ${Object.values(rows)
                .map(
                  (r) =>
                    `<tr><td>${r.product_name}</td><td>${r.department || "-"}</td><td class="text-right">${r.quantity}</td><td class="text-right">₱${r.total.toFixed(2)}</td></tr>`
                )
                .join("")}
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="2">Total</td>
                <td class="text-right">${monthly.reduce((s, r) => s + (Number(r.quantity) || 0), 0)}</td>
                <td class="text-right">₱${total.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
          <div class="footer">LCCB Bookstore &mdash; Generated ${new Date().toLocaleString()}</div>
        </body>
      </html>
    `);

    w.print();
  };



  return (
    <div className="h-screen w-screen flex flex-col bg-gray-100">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

<header className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-800 text-white px-4 py-2 shadow">

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

  </div>

  {/* ================= TRANSACTIONS ================= */}
<div>

  {/* HEADER ROW */}
  <div className="flex justify-between items-center flex-wrap gap-2">

    <h2 className="text-xl font-semibold">Transactions</h2>

    <div className="flex flex-wrap items-center gap-2">

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

        {sale.customer_name?.trim() && (
          <p className="text-sm text-gray-600 font-medium">
            Customer: {sale.customer_name.trim()}
          </p>
        )}

        <p className="text-sm text-gray-500 mt-1">
          {formatDate(sale.created_at)}
        </p>

        <div className="mt-3 space-y-1">
          {sale.items.map((item) => (
            <p key={item.id} className="text-sm text-gray-700">
              • {item.product_name} × {item.quantity}
              {item.department ? ` (${item.department})` : ""}
            </p>
          ))}
        </div>
      </div>

      {/* RIGHT - TOTAL */}
      <div className="flex flex-col justify-end items-end min-w-[120px]">
        <p className="text-sm text-gray-500">Total</p>
        <p className="text-xl font-bold text-green-600">
          ₱{sale.total}
        </p>
      </div>

    </div>
  </div>
))}
    {/* PAGINATION */}
    <div className="flex flex-wrap justify-center items-center gap-2 pt-4">
      <button
        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
        disabled={currentPage === 1}
        className="px-4 py-2 rounded-md border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 transition"
      >
        Previous
      </button>

      {paginationItems.map((page, index) =>
        page === "..." ? (
          <span key={`dots-${index}`} className="px-3 py-2 text-sm text-gray-500">
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className={`min-w-[38px] px-4 py-2 rounded-md border text-sm transition ${
              currentPage === page
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
            }`}
          >
            {page}
          </button>
        )
      )}

      <button
        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
        disabled={currentPage === totalPages || totalPages === 0}
        className="px-4 py-2 rounded-md border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 transition"
      >
        Next
      </button>
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


    </div>
  </div>
)}
    </div>
  );
}