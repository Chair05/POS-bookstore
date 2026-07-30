import React, { useCallback, useEffect, useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import Layout from "./Layout";
import { getDepartmentInfo } from "../utils/departmentUtils";

export default function MonthlySalesReport() {
  const [user] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  });
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [chartFilter, setChartFilter] = useState("month");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [printDate, setPrintDate] = useState(new Date().toISOString().slice(0, 10));
  const [printMonth, setPrintMonth] = useState("");

  const toDateStr = (date) => date.toISOString().slice(0, 10);

  const loadSales = useCallback(async () => {
    if (user?.role !== "admin") {
      setError("Access denied");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:5000/api/products/sales", {
        headers: { "x-user-role": user?.role || "" },
      });
      const data = await res.json();
      if (!data.success) throw new Error("Failed to load sales data");
      if (data.sales && data.sales.length > 0) {
        console.log("Sales API first row:", data.sales[0]);
        console.log("Sales API first row customer_type:", data.sales[0].customer_type);
      }
      setSales(data.sales || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  const filteredSales = useMemo(() => sales, [sales]);

  const getSaleDepartment = (sale) => {
    const rawDepartment =
      sale.department ||
      sale.category ||
      sale.product?.department ||
      sale.product?.category ||
      sale.category_name ||
      sale.product_category?.name ||
      "";
    if (!String(rawDepartment || "").trim()) return null;
    const label = getDepartmentInfo(rawDepartment).label;
    if (label === "Students" || label === "Teachers" || label === "Personnel") return null;
    return label === "General" ? null : label;
  };

  const getStaffDepartmentLabel = (sale) => {
    const rawDepartment =
      sale.customer_type ||
      sale.checkout_department ||
      "";
    const label = getDepartmentInfo(rawDepartment).label;
    if (label === "Students" || label === "Teachers" || label === "Personnel") return label;
    return null;
  };

  const departmentOptions = useMemo(
    () => Array.from(new Set(filteredSales.map((sale) => getSaleDepartment(sale)).filter(Boolean))).sort(),
    [filteredSales]
  );

  const displayedSales = useMemo(
    () =>
      departmentFilter === "all"
        ? filteredSales
        : filteredSales.filter((sale) => getSaleDepartment(sale) === departmentFilter),
    [filteredSales, departmentFilter]
  );

  const staffDepartmentSales = useMemo(() => {
    const totals = { Students: 0, Teachers: 0, Personnel: 0 };
    filteredSales.forEach((sale) => {
      const label = getStaffDepartmentLabel(sale);
      if (!label) return;
      totals[label] += Number(sale.quantity || 0);
    });
    return Object.entries(totals).map(([name, value]) => ({ name, value }));
  }, [filteredSales]);

  const hasStaffDepartmentSales = staffDepartmentSales.some((entry) => entry.value > 0);

  const totalRevenue = useMemo(() => filteredSales.reduce((sum, sale) => sum + Number(sale.total || 0), 0), [filteredSales]);
  const totalItems = useMemo(() => filteredSales.reduce((sum, sale) => sum + Number(sale.quantity || 0), 0), [filteredSales]);
  const totalTransactions = useMemo(() => new Set(filteredSales.map((sale) => sale.receipt_id || sale.id)).size, [filteredSales]);

  const monthlyReports = useMemo(() => {
    const map = {};

    filteredSales.forEach((sale) => {
      const date = new Date(sale.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!map[key]) {
        map[key] = { month: key, revenue: 0, items: 0, transactions: new Set(), topProduct: {} };
      }

      map[key].revenue += Number(sale.total || 0);
      map[key].items += Number(sale.quantity || 0);
      map[key].transactions.add(sale.receipt_id || sale.id);

      const product = sale.product_name || "Unknown";
      map[key].topProduct[product] = (map[key].topProduct[product] || 0) + Number(sale.quantity || 0);
    });

    return Object.values(map)
      .map((entry) => ({
        month: entry.month,
        revenue: entry.revenue,
        items: entry.items,
        transactions: entry.transactions.size,
        top_product: Object.entries(entry.topProduct).sort((a, b) => b[1] - a[1])[0]?.[0] || "-",
      }))
      .sort((a, b) => b.month.localeCompare(a.month));
  }, [filteredSales]);

  const chartData = useMemo(() => {
    const map = {};

    filteredSales.forEach((sale) => {
      const date = new Date(sale.created_at);
      let key = "";

      if (chartFilter === "day") key = date.toISOString().slice(0, 10);
      if (chartFilter === "week") {
        const firstDay = new Date(date);
        firstDay.setDate(date.getDate() - date.getDay());
        key = firstDay.toISOString().slice(0, 10);
      }
      if (chartFilter === "month") key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      if (chartFilter === "year") key = `${date.getFullYear()}`;
      if (chartFilter === "all") key = "All";

      map[key] = (map[key] || 0) + Number(sale.total || 0);
    });

    return Object.entries(map).map(([name, total]) => ({ name, total })).sort((a, b) => {
      if (chartFilter === "day" || chartFilter === "week") return new Date(a.name) - new Date(b.name);
      if (chartFilter === "month") {
        const [aYear, aMonth] = a.name.split("-").map(Number);
        const [bYear, bMonth] = b.name.split("-").map(Number);
        return aYear === bYear ? aMonth - bMonth : aYear - bYear;
      }
      if (chartFilter === "year") return Number(a.name) - Number(b.name);
      return 0;
    });
  }, [filteredSales, chartFilter]);

  const categorySummary = useMemo(() => {
    return filteredSales.reduce((acc, sale) => {
      const rawCat = sale.category ?? sale.category_name ?? (sale.product_category && sale.product_category.name) ?? sale.product?.category ?? sale.product?.category_name ?? sale.category_id ?? sale.categoryId ?? null;
      const cat = rawCat === null || rawCat === undefined || rawCat === "" ? "Uncategorized" : String(rawCat);
      const qty = Number(sale.quantity) || 0;
      acc[cat] = (acc[cat] || 0) + qty;
      return acc;
    }, {});
  }, [filteredSales]);

  const handlePrint = () => {
    if (!printDate) return alert("Select date");

    const daily = filteredSales.filter(
      (sale) => toDateStr(new Date(sale.created_at)) === printDate
    );

    const total = daily.reduce((sum, sale) => sum + Number(sale.total || 0), 0);

    const rows = daily.reduce((acc, sale) => {
      const department = getSaleDepartment(sale) || "";
      const key = `${sale.product_name}-${sale.barcode}-${department}`;
      if (acc[key]) {
        acc[key].quantity += Number(sale.quantity) || 0;
        acc[key].total += Number(sale.total) || 0;
      } else {
        acc[key] = {
          product_name: sale.product_name,
          department,
          quantity: Number(sale.quantity) || 0,
          total: Number(sale.total) || 0,
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
                <td class="text-right">${daily.reduce((sum, sale) => sum + (Number(sale.quantity) || 0), 0)}</td>
                <td class="text-right">₱${total.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
          <div class="footer">LCCB Bookstore — Generated ${new Date().toLocaleString()}</div>
        </body>
      </html>
    `);
    w.print();
  };

  const handleMonthlyPrint = () => {
    if (!printMonth) return alert("Select month");

    const monthly = filteredSales.filter((sale) => {
      const d = new Date(sale.created_at);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` === printMonth;
    });

    if (monthly.length === 0) return alert("No sales for this month");

    const total = monthly.reduce((sum, sale) => sum + Number(sale.total || 0), 0);

    const rows = monthly.reduce((acc, sale) => {
      const department = getSaleDepartment(sale) || "";
      const key = `${sale.product_name}-${sale.barcode}-${department}`;
      if (acc[key]) {
        acc[key].quantity += Number(sale.quantity) || 0;
        acc[key].total += Number(sale.total) || 0;
      } else {
        acc[key] = {
          product_name: sale.product_name,
          department,
          quantity: Number(sale.quantity) || 0,
          total: Number(sale.total) || 0,
        };
      }
      return acc;
    }, {});

    const [year, month] = printMonth.split("-");
    const monthName = new Date(year, month - 1).toLocaleString("en-US", { month: "long", year: "numeric" });

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
                <td class="text-right">${monthly.reduce((sum, sale) => sum + (Number(sale.quantity) || 0), 0)}</td>
                <td class="text-right">₱${total.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
          <div class="footer">LCCB Bookstore — Generated ${new Date().toLocaleString()}</div>
        </body>
      </html>
    `);
    w.print();
  };

  const pieData = useMemo(() => {
    const total = Object.values(categorySummary).reduce((sum, value) => sum + value, 0);
    return Object.entries(categorySummary).map(([name, value]) => ({
      name,
      value: total > 0 ? (value / total) * 100 : 0,
      raw: value,
    }));
  }, [categorySummary]);

  const departmentSales = useMemo(() => {
    const totals = {};
    departmentOptions.forEach((d) => {
      totals[d] = 0;
    });
    displayedSales.forEach((sale) => {
      const department = getSaleDepartment(sale);
      if (!department) return;
      totals[department] = (totals[department] || 0) + Number(sale.total || 0);
    });
    return Object.entries(totals).map(([name, value]) => ({ name, value }));
  }, [displayedSales, departmentOptions]);

  const departmentCards = useMemo(() => {
    const totals = {};
    departmentOptions.forEach((d) => {
      totals[d] = 0;
    });
    displayedSales.forEach((sale) => {
      const department = getSaleDepartment(sale);
      if (!department) return;
      totals[department] = (totals[department] || 0) + Number(sale.quantity || 0);
    });
    return Object.entries(totals).map(([name, quantity]) => ({ name, quantity }));
  }, [displayedSales, departmentOptions]);

  const hasDepartmentSales = departmentSales.some((entry) => entry.value > 0);

  const topProductsByCategory = useMemo(() => {
    const map = {};
    filteredSales.forEach((sale) => {
      const rawCat = sale.category ?? sale.category_name ?? (sale.product_category && sale.product_category.name) ?? sale.product?.category ?? sale.product?.category_name ?? sale.category_id ?? sale.categoryId ?? null;
      const cat = rawCat === null || rawCat === undefined || rawCat === "" ? "Uncategorized" : String(rawCat);
      const name = sale.product_name || "Unknown";
      const qty = Number(sale.quantity) || 0;
      map[cat] = map[cat] || {};
      map[cat][name] = (map[cat][name] || 0) + qty;
    });

    return Object.entries(map).reduce((acc, [cat, prodMap]) => {
      const items = Object.entries(prodMap).map(([name, qty]) => ({ name, qty })).sort((a, b) => b.qty - a.qty).slice(0, 5);
      acc[cat] = items;
      return acc;
    }, {});
  }, [filteredSales]);

  const PIE_COLORS = ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#7c3aed", "#0ea5e9"];

  if (loading) return <div className="h-screen w-screen flex items-center justify-center bg-gray-100">Loading...</div>;
  if (error) return <div className="h-screen w-screen flex items-center justify-center bg-gray-100 text-red-500">{error}</div>;

  return (
    <Layout title="Sales Report">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-gray-500">Total Revenue</p>
            <p className="text-2xl font-bold text-green-600">₱{totalRevenue.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-gray-500">Total Items Sold</p>
            <p className="text-2xl font-bold">{totalItems}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-gray-500">Total Transactions</p>
            <p className="text-2xl font-bold">{totalTransactions}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-4 mb-5 justify-between">
            <div className="flex flex-wrap items-center gap-4">
              <h2 className="font-semibold text-lg">Sales Trend</h2>
              <select value={chartFilter} onChange={(e) => setChartFilter(e.target.value)} className="border border-gray-300 bg-white px-3 py-1 rounded-md text-sm shadow-sm hover:bg-blue-50 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 cursor-pointer">
                <option value="all">All</option>
                <option value="year">Year</option>
                <option value="month">Month</option>
                <option value="week">Week</option>
                <option value="day">Day</option>
              </select>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={printDate}
                onChange={(e) => setPrintDate(e.target.value)}
                className="border border-gray-300 bg-white px-3 py-1 rounded-md text-sm shadow-sm hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
              <button
                onClick={handlePrint}
                className="bg-blue-600 text-white px-4 py-1 rounded-md text-sm hover:bg-blue-700 transition relative -top-[9px]"
              >
                Print Day
              </button>
              <input
                type="month"
                value={printMonth}
                onChange={(e) => setPrintMonth(e.target.value)}
                className="border border-gray-300 bg-white px-3 py-1 rounded-md text-sm shadow-sm hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
              <button
                onClick={handleMonthlyPrint}
                className="bg-blue-600 text-white px-4 py-1 rounded-md text-sm hover:bg-blue-700 transition relative -top-[9px]"
              >
                Print Month
              </button>
            </div>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ left: 0, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis orientation="left" />
                <Tooltip />
                <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-4 mb-5">
            <h2 className="font-semibold text-lg">Department Sales</h2>
            <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} className="border border-gray-300 bg-white px-3 py-1 rounded-md text-sm shadow-sm hover:bg-blue-50 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 cursor-pointer">
              <option value="all">All Departments</option>
              {departmentOptions.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-[240px]">
              {hasDepartmentSales ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={departmentSales}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={80}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {departmentSales.map((entry, index) => (<Cell key={`dept-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />))}
                    </Pie>
                    <Legend />
                    <Tooltip formatter={(value) => `₱${value}`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-gray-500">
                  No department sales data available.
                </div>
              )}
            </div>
            <div className="space-y-3">
              {departmentCards.length > 0 ? departmentCards.map((card) => (
                <div key={card.name} className="rounded-xl border border-gray-200 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-700">{card.name}</span>
                    <span className="text-sm text-blue-600 font-semibold">{card.quantity} items</span>
                  </div>
                </div>
              )) : (
                <div className="rounded-xl border border-gray-200 p-3 text-sm text-gray-500">
                  No department cards to display.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="font-semibold mb-3">Sales by Category</h3>
            <div className="h-[260px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={90}
                    fill="#8884d8"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip formatter={(value, name, props) => [`${Number(value).toFixed(2)}%`, name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="font-semibold mb-3">Student/Teacher/Personnel Sales</h3>
            <div className="h-[260px] flex items-center justify-center">
              {hasStaffDepartmentSales ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={staffDepartmentSales}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={90}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {staffDepartmentSales.map((entry, index) => (
                        <Cell key={`staff-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip formatter={(value) => `${value} items`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-gray-500">
                  No student/teacher/personnel sales data available.
                </div>
              )}
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="font-semibold mb-3">Top Products by Category</h3>
            <div className="space-y-3 max-h-[260px] overflow-y-auto">
              {Object.keys(topProductsByCategory).length === 0 && <p className="text-sm text-gray-500">No category data available.</p>}
              {Object.entries(topProductsByCategory).map(([cat, items]) => (
                <div key={cat} className="border-b pb-2">
                  <p className="font-medium">{cat}</p>
                  <ul className="text-sm mt-1 space-y-1">
                    {items.map((it) => <li key={it.name} className="flex justify-between"><span>{it.name}</span><span className="text-gray-600">{it.qty}</span></li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Transactions</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Items Sold</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Top Product</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {monthlyReports.map((report) => {
                const [year, month] = report.month.split("-");
                const monthName = new Date(year, month - 1).toLocaleString("en-US", { month: "long", year: "numeric" });
                return (
                  <tr key={report.month} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{monthName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-gray-700">{report.transactions}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-gray-700">{report.items}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-green-600 font-medium">₱{Number(report.revenue).toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">{report.top_product}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
