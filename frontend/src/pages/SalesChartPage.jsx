import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

export default function SalesChartPage() {
  const [sales, setSales] = useState([]);

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

  const chartData = useMemo(() => {
    const earningsByDate = sales
      .filter((s) => !s.refunded)
      .reduce((acc, sale) => {
        const day = toDateStr(new Date(sale.created_at));
        acc[day] = (acc[day] || 0) + Number(sale.total || 0);
        return acc;
      }, {});

    return Object.entries(earningsByDate)
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [sales]);

  return (
    <div className="h-screen w-screen bg-blue-500 p-6 flex flex-col">
      <header className="flex justify-between items-center mb-4">
        <h1 className="text-4xl font-bold text-white">📈 Sales Chart</h1>
        <Link to="/sales">
          <button className="px-5 py-3 bg-white text-blue-600 rounded-full font-semibold hover:bg-gray-100 transition">
            ⬅ Back to Sales
          </button>
        </Link>
      </header>

      <div className="bg-white rounded-3xl p-6 shadow-md flex-1">
        {chartData.length === 0 ? (
          <p className="text-center text-gray-500 mt-20 text-lg">No sales to display.</p>
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
    </div>
  );
}
