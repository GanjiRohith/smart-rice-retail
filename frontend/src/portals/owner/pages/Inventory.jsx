import { useState, useEffect } from "react";
import api from "../../../shared/services/api";

export default function OwnerInventory() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [editVal, setEditVal] = useState({});

  useEffect(() => { fetch(); }, []);
  const fetch = () => { api.get("/retail/inventory").then(r => setInventory(r.data)).catch(() => {}).finally(() => setLoading(false)); };

  const save = async (id) => {
    try {
      await api.put(`/retail/inventory/${id}`, editVal);
      setEditing(null);
      fetch();
    } catch {}
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Inventory Management</h1>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-gray-700">Product</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-700">Brand</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-700">Stock</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-700">Reorder Level</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-700">Warehouse</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-700">Status</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {inventory.map(inv => (
                <tr key={inv.inventory_id} className={`hover:bg-gray-50 ${inv.low_stock ? "bg-red-50/50" : ""}`}>
                  <td className="px-5 py-3 font-medium text-gray-900">{inv.rice_type}</td>
                  <td className="px-5 py-3 text-gray-600">{inv.brand || "—"}</td>
                  <td className="px-5 py-3">
                    {editing === inv.inventory_id ? (
                      <input type="number" value={editVal.stock_available} onChange={e => setEditVal(p => ({ ...p, stock_available: parseInt(e.target.value) || 0 }))}
                        className="w-20 px-2 py-1 border border-gray-200 rounded-lg text-sm" />
                    ) : (
                      <span className={`font-medium ${inv.low_stock ? "text-red-600" : "text-gray-900"}`}>{inv.stock_available}kg</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {editing === inv.inventory_id ? (
                      <input type="number" value={editVal.reorder_level} onChange={e => setEditVal(p => ({ ...p, reorder_level: parseInt(e.target.value) || 0 }))}
                        className="w-20 px-2 py-1 border border-gray-200 rounded-lg text-sm" />
                    ) : (
                      <span className="text-gray-600">{inv.reorder_level}kg</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-600">{inv.warehouse_location || "—"}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${inv.low_stock ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                      {inv.low_stock ? "Low Stock" : "OK"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {editing === inv.inventory_id ? (
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => save(inv.inventory_id)} className="text-green-600 hover:text-green-800 text-xs font-medium">Save</button>
                        <button onClick={() => setEditing(null)} className="text-gray-500 hover:text-gray-700 text-xs font-medium">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => { setEditing(inv.inventory_id); setEditVal({ stock_available: inv.stock_available, reorder_level: inv.reorder_level }); }}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium">Edit</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
