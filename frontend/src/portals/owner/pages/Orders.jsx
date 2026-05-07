import { useState, useEffect } from "react";
import api from "../../../shared/services/api";

const STATUS_COLORS = {
  placed: "bg-blue-100 text-blue-700", confirmed: "bg-indigo-100 text-indigo-700",
  packed: "bg-purple-100 text-purple-700", shipped: "bg-amber-100 text-amber-700",
  delivered: "bg-green-100 text-green-700", cancelled: "bg-red-100 text-red-700",
};
const STATUSES = ["placed", "confirmed", "packed", "shipped", "delivered", "cancelled"];

export default function OwnerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = () => {
    setLoading(true);
    api.get("/retail/orders").then(r => setOrders(r.data)).catch(() => setOrders([])).finally(() => setLoading(false));
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/retail/orders/${orderId}/status`, { order_status: newStatus });
      fetchOrders();
    } catch {}
  };

  const filtered = filter ? orders.filter(o => o.order_status === filter) : orders;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilter("")} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${!filter ? "bg-green-700 text-white" : "bg-white border text-gray-600"}`}>All</button>
          {STATUSES.slice(0, 4).map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize ${filter === s ? "bg-green-700 text-white" : "bg-white border text-gray-600"}`}>{s}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500"><p className="text-4xl mb-3">📦</p><p>No orders found</p></div>
      ) : (
        <div className="space-y-4">
          {filtered.map(o => (
            <div key={o.order_id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
                <div>
                  <p className="font-semibold text-gray-900">Order #{o.order_id}</p>
                  <p className="text-xs text-gray-500">{o.customer_name} • {o.customer_email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-green-800">₹{o.total_amount?.toFixed(2)}</span>
                  <span className={`text-xs font-medium px-3 py-1 rounded-full ${STATUS_COLORS[o.order_status] || "bg-gray-100"}`}>{o.order_status}</span>
                </div>
              </div>
              
              {o.items && o.items.length > 0 && (
                <div className="text-sm text-gray-600 mb-3">
                  {o.items.map((it, i) => (
                    <span key={i}>{it.product_name} × {it.quantity}kg{i < o.items.length - 1 ? ", " : ""}</span>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-500">{new Date(o.order_date).toLocaleDateString("en-IN")}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${o.payment_status === "paid" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                  Payment: {o.payment_status}
                </span>
                {o.order_status !== "delivered" && o.order_status !== "cancelled" && (
                  <select value={o.order_status} onChange={e => updateStatus(o.order_id, e.target.value)}
                    className="ml-auto text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-green-500 outline-none">
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
