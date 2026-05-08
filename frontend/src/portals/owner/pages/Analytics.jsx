import { useState, useEffect } from "react";
import api from "../../../services/api";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line
} from "recharts";

const COLORS = [
  "#2D6A4F",
  "#52B788",
  "#B7791F",
  "#6366F1",
  "#EC4899",
  "#F59E0B",
  "#14B8A6",
  "#EF4444",
  "#8B5CF6",
  "#06B6D4"
];

export default function OwnerAnalytics() {

  const [analytics,   setAnalytics]   = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [activeTab,   setActiveTab]   = useState("overview");
  const [error,       setError]       = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [salesRes, revenueRes] = await Promise.all([
          api.get("/retail/analytics/sales"),
          api.get("/retail/analytics/revenue")
        ]);

        const byRice   = salesRes.data.by_rice_type || [];
        const revenue  = revenueRes.data;

        setAnalytics({
          total_sales:         revenue.total_revenue      || 0,
          total_orders:        revenue.order_count        || 0,
          average_order_value: revenue.avg_order_value    || 0,
          top_products: byRice.map(p => ({
            rice_type:    p.rice_type,
            quantity_sold: p.quantity_kg,
            revenue:       p.revenue
          }))
        });

      } catch (err) {
        console.error(err);
        setError("Failed to load analytics data.");
        setAnalytics({});
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  // ── Loading ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Derived values ───────────────────────────────────────
  const totalSales        = analytics?.total_sales         || 0;
  const totalOrders       = analytics?.total_orders        || 0;
  const avgOrderValue     = analytics?.average_order_value || 0;
  const topProducts       = analytics?.top_products        || [];

  const totalQty = topProducts.reduce(
    (sum, p) => sum + (p.quantity_sold || 0), 0
  );

  const chartData = [...topProducts]
    .sort((a, b) => b.quantity_sold - a.quantity_sold)
    .map(p => ({
      rice_type:    p.rice_type,
      revenue:      parseFloat((p.revenue      || 0).toFixed(2)),
      quantity_kg:  parseFloat((p.quantity_sold || 0).toFixed(2))
    }));

  const revenueChartData = [...topProducts]
    .sort((a, b) => b.revenue - a.revenue)
    .map(p => ({
      rice_type: p.rice_type,
      revenue:   parseFloat((p.revenue || 0).toFixed(2))
    }));

  const tabs = ["overview", "quantity", "revenue"];

  // ── Empty state ──────────────────────────────────────────
  if (!topProducts.length && !error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Sales Analytics</h1>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center text-gray-500">
          <p className="text-4xl mb-3">📊</p>
          <p className="font-medium">No analytics data yet</p>
          <p className="text-sm mt-1">Analytics will appear after orders are placed</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">

      {/* ── Header ── */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Sales Analytics</h1>
        <p className="text-gray-500 mt-1">Overview of your rice retail performance</p>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-sm text-gray-500 mb-1">Total Revenue</p>
          <p className="text-3xl font-bold text-green-800">
            ₹{Number(totalSales).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-gray-400 mt-1">from paid orders</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-sm text-gray-500 mb-1">Total Orders</p>
          <p className="text-3xl font-bold text-blue-700">{totalOrders}</p>
          <p className="text-xs text-gray-400 mt-1">completed orders</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-sm text-gray-500 mb-1">Avg Order Value</p>
          <p className="text-3xl font-bold text-amber-700">
            ₹{Number(avgOrderValue).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-gray-400 mt-1">per order</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-sm text-gray-500 mb-1">Total Qty Sold</p>
          <p className="text-3xl font-bold text-purple-700">
            {Number(totalQty).toFixed(0)} kg
          </p>
          <p className="text-xs text-gray-400 mt-1">across all products</p>
        </div>

      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-2 border-b border-gray-200">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize rounded-t-lg transition-colors ${
              activeTab === tab
                ? "bg-white border border-b-white border-gray-200 text-green-700 -mb-px"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab === "overview"  ? "📊 Overview"  :
             tab === "quantity"  ? "📦 By Quantity" :
                                   "💰 By Revenue"}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ── */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Bar Chart — Quantity */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Top Selling Rice Types (kg)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="rice_type"
                    tick={{ fontSize: 10 }}
                    angle={-20}
                    textAnchor="end"
                    height={55}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [`${v} kg`, "Quantity Sold"]} />
                  <Bar dataKey="quantity_kg" fill="#2D6A4F" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart — Distribution */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Sales Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="quantity_kg"
                    nameKey="rice_type"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ rice_type, percent }) =>
                      `${rice_type}: ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v} kg`, "Qty Sold"]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

      {/* ── Quantity Tab ── */}
      {activeTab === "quantity" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-semibold text-gray-800 mb-6">Quantity Sold by Rice Type</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="rice_type" tick={{ fontSize: 11 }} width={120} />
                <Tooltip formatter={(v) => [`${v} kg`, "Quantity Sold"]} />
                <Bar dataKey="quantity_kg" radius={[0, 4, 4, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Table */}
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-gray-600 font-medium">Rice Type</th>
                  <th className="text-right py-2 px-3 text-gray-600 font-medium">Qty Sold (kg)</th>
                  <th className="text-right py-2 px-3 text-gray-600 font-medium">Share</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((row, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 px-3 flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full inline-block"
                        style={{ background: COLORS[i % COLORS.length] }}
                      />
                      {row.rice_type}
                    </td>
                    <td className="py-2 px-3 text-right font-medium">{row.quantity_kg} kg</td>
                    <td className="py-2 px-3 text-right text-gray-500">
                      {totalQty > 0 ? ((row.quantity_kg / totalQty) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Revenue Tab ── */}
      {activeTab === "revenue" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-semibold text-gray-800 mb-6">Revenue by Rice Type (₹)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueChartData} margin={{ bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="rice_type"
                  tick={{ fontSize: 10 }}
                  angle={-25}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(v) => [
                    `₹${Number(v).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
                    "Revenue"
                  ]}
                />
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                  {revenueChartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue Table */}
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-gray-600 font-medium">Rice Type</th>
                  <th className="text-right py-2 px-3 text-gray-600 font-medium">Revenue (₹)</th>
                  <th className="text-right py-2 px-3 text-gray-600 font-medium">Share</th>
                </tr>
              </thead>
              <tbody>
                {revenueChartData.map((row, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 px-3 flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full inline-block"
                        style={{ background: COLORS[i % COLORS.length] }}
                      />
                      {row.rice_type}
                    </td>
                    <td className="py-2 px-3 text-right font-medium">
                      ₹{Number(row.revenue).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                    </td>
                    <td className="py-2 px-3 text-right text-gray-500">
                      {totalSales > 0 ? ((row.revenue / totalSales) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}