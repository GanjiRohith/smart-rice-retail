import { useState, useEffect } from "react";
import api from "../../../shared/services/api";

const STATUS_COLORS = {
  placed: "bg-blue-100 text-blue-700",
  confirmed: "bg-indigo-100 text-indigo-700",
  packed: "bg-purple-100 text-purple-700",
  shipped: "bg-amber-100 text-amber-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    api.get("/user/orders")
      .then(r => setOrders(r.data))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (orders.length === 0) return (
    <div className="text-center py-20">
      <p className="text-5xl mb-4">📦</p>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h2>
      <p className="text-gray-500">Start shopping to place your first order</p>
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>
      <div className="space-y-4">
        {orders.map(order => (
          <div key={order.order_id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <button onClick={() => setExpanded(expanded === order.order_id ? null : order.order_id)}
              className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-lg">📦</div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Order #{order.order_id}</p>
                  <p className="text-xs text-gray-500">{new Date(order.order_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-bold text-green-800">₹{order.total_amount?.toFixed(2)}</span>
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${STATUS_COLORS[order.order_status] || "bg-gray-100 text-gray-600"}`}>
                  {order.order_status}
                </span>
                <svg className={`w-5 h-5 text-gray-400 transition-transform ${expanded === order.order_id ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {expanded === order.order_id && (
              <div className="border-t border-gray-100 p-5 bg-gray-50">
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <p className="text-gray-500">Payment</p>
                    <p className={`font-medium ${order.payment_status === "paid" ? "text-green-700" : "text-amber-600"}`}>
                      {order.payment_status}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Delivery Address</p>
                    <p className="font-medium text-gray-900">{order.delivery_address || "—"}</p>
                  </div>
                </div>
                {order.items && order.items.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Items</p>
                    <div className="space-y-2">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm bg-white rounded-xl p-3">
                          <span className="text-gray-700">Product #{item.product_id} × {item.quantity}kg</span>
                          <span className="font-medium">₹{(item.unit_price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
