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
  Legend
} from "recharts";

const COLORS = [
  "#2D6A4F",
  "#52B788",
  "#B7791F",
  "#6366F1",
  "#EC4899",
  "#F59E0B",
  "#14B8A6"
];

export default function OwnerAnalytics() {

  const [analytics, setAnalytics] = useState(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const fetchAnalytics = async () => {

      try {

        const res = await api.get("/ai/analytics");

        setAnalytics(
          res.data.analytics?.analytics || {}
        );

      } catch (err) {

        console.log(err);

        setAnalytics({});

      } finally {

        setLoading(false);
      }
    };

    fetchAnalytics();

  }, []);

  if (loading) {

    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalSales =
    analytics?.total_sales || 0;

  const totalOrders =
    analytics?.total_orders || 0;

  const avgOrderValue =
    analytics?.average_order_value || 0;

  const topProducts =
    analytics?.top_products || [];

  const chartData = topProducts.map((p) => ({
    rice_type: p.rice_type,
    revenue: p.quantity_sold * 100,
    quantity_kg: p.quantity_sold
  }));

  return (

    <div className="space-y-8">

      <h1 className="text-2xl font-bold text-gray-900">
        Sales Analytics
      </h1>

      {/* KPI Cards */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">

          <p className="text-sm text-gray-500 mb-1">
            Total Revenue
          </p>

          <p className="text-3xl font-bold text-green-800">
            ₹{Number(totalSales).toFixed(0)}
          </p>

        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">

          <p className="text-sm text-gray-500 mb-1">
            Total Orders
          </p>

          <p className="text-3xl font-bold text-blue-700">
            {totalOrders}
          </p>

        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">

          <p className="text-sm text-gray-500 mb-1">
            Avg Order Value
          </p>

          <p className="text-3xl font-bold text-amber-700">
            ₹{Number(avgOrderValue).toFixed(0)}
          </p>

        </div>

      </div>

      {
        chartData.length > 0 ? (

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* BAR CHART */}

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">

              <h3 className="font-semibold text-gray-800 mb-4">
                Top Selling Rice Types
              </h3>

              <div className="h-64">

                <ResponsiveContainer width="100%" height="100%">

                  <BarChart data={chartData}>

                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f0f0f0"
                    />

                    <XAxis
                      dataKey="rice_type"
                      tick={{ fontSize: 10 }}
                      angle={-20}
                      textAnchor="end"
                      height={50}
                    />

                    <YAxis tick={{ fontSize: 11 }} />

                    <Tooltip
                      formatter={(v) => [
                        `${v} kg`,
                        "Quantity Sold"
                      ]}
                    />

                    <Bar
                      dataKey="quantity_kg"
                      fill="#2D6A4F"
                      radius={[4,4,0,0]}
                    />

                  </BarChart>

                </ResponsiveContainer>

              </div>

            </div>

            {/* PIE CHART */}

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">

              <h3 className="font-semibold text-gray-800 mb-4">
                Product Sales Distribution
              </h3>

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
                      label={({ rice_type, quantity_kg }) =>
                        `${rice_type}: ${quantity_kg}kg`
                      }
                    >

                      {chartData.map((_, i) => (

                        <Cell
                          key={i}
                          fill={
                            COLORS[i % COLORS.length]
                          }
                        />

                      ))}

                    </Pie>

                    <Tooltip />

                    <Legend />

                  </PieChart>

                </ResponsiveContainer>

              </div>

            </div>

          </div>

        ) : (

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center text-gray-500">

            <p className="text-4xl mb-3">
              📊
            </p>

            <p className="font-medium">
              No analytics data yet
            </p>

            <p className="text-sm">
              Analytics will appear after orders are placed
            </p>

          </div>

        )
      }

    </div>
  );
}