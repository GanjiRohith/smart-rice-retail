import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../../shared/services/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function OwnerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/retail/dashboard")
      .then(r => setData(r.data))
      .catch(() => setData(DEMO_DATA))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" /></div>;

  const d = data || DEMO_DATA;
  const kpis = [
    { label: "Today's Revenue", value: `₹${(d.today_revenue || 0).toFixed(0)}`, icon: "💰", bg: "bg-green-50", tc: "text-green-700" },
    { label: "Today's Orders", value: d.today_orders || 0, icon: "📦", bg: "bg-blue-50", tc: "text-blue-700" },
    { label: "Pending Orders", value: d.pending_orders || 0, icon: "⏳", bg: "bg-amber-50", tc: "text-amber-700" },
    { label: "Low Stock Alerts", value: d.low_stock_alerts || 0, icon: "⚠️", bg: "bg-red-50", tc: "text-red-700" },
    { label: "Total Products", value: d.total_products || 0, icon: "🌾", bg: "bg-purple-50", tc: "text-purple-700" },
    { label: "Total Revenue", value: `₹${(d.total_revenue || 0).toFixed(0)}`, icon: "📊", bg: "bg-teal-50", tc: "text-teal-700" },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map(kpi => (
          <div key={kpi.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl text-xl mb-3 ${kpi.bg}`}>{kpi.icon}</div>
            <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
            <p className="text-xs text-gray-500 mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Weekly Revenue (₹)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={d.weekly_sales || DEMO_DATA.weekly_sales}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={v => v.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => [`₹${v}`, "Revenue"]} />
              <Bar dataKey="revenue" fill="#2D6A4F" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { to: "/owner/orders", label: "View Orders", icon: "📦", color: "bg-blue-600" },
          { to: "/owner/products", label: "Add Product", icon: "➕", color: "bg-green-700" },
          { to: "/owner/inventory", label: "Check Stock", icon: "🏪", color: "bg-amber-600" },
          { to: "/owner/forecast", label: "AI Forecast", icon: "🔮", color: "bg-purple-600" },
        ].map(a => (
          <Link key={a.to} to={a.to}
            className={`${a.color} text-white rounded-2xl p-5 flex flex-col items-center gap-2 hover:opacity-90 transition-opacity text-center`}>
            <span className="text-2xl">{a.icon}</span>
            <span className="font-medium text-sm">{a.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

const DEMO_DATA = {
  today_revenue: 28450, today_orders: 14, pending_orders: 6, low_stock_alerts: 3, total_products: 18, total_revenue: 384000,
  weekly_sales: [
    { date: "2026-04-30", revenue: 22000 }, { date: "2026-05-01", revenue: 18500 },
    { date: "2026-05-02", revenue: 31000 }, { date: "2026-05-03", revenue: 26000 },
    { date: "2026-05-04", revenue: 15000 }, { date: "2026-05-05", revenue: 20000 },
    { date: "2026-05-06", revenue: 28450 },
  ]
};
