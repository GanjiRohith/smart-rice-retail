import { useState, useEffect } from "react";
import api from "../../../shared/services/api";

export default function OwnerSuppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editSupplier, setEditSupplier] = useState(null);
  const [form, setForm] = useState({ supplier_name: "", contact_person: "", phone: "", region: "", transport_cost_per_km: 0, rating: 5.0 });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetch(); }, []);
  const fetch = () => { api.get("/retail/suppliers").then(r => setSuppliers(r.data)).catch(() => {}).finally(() => setLoading(false)); };

  const openAdd = () => { setEditSupplier(null); setForm({ supplier_name: "", contact_person: "", phone: "", region: "", transport_cost_per_km: 0, rating: 5.0 }); setShowModal(true); };
  const openEdit = (s) => { setEditSupplier(s); setForm({ supplier_name: s.supplier_name, contact_person: s.contact_person || "", phone: s.phone || "", region: s.region || "", transport_cost_per_km: s.transport_cost_per_km, rating: s.rating }); setShowModal(true); };

  const save = async () => {
    setSaving(true);
    try {
      if (editSupplier) {
        await api.put(`/retail/suppliers/${editSupplier.supplier_id}`, form);
      } else {
        await api.post("/retail/suppliers", form);
      }
      setShowModal(false);
      fetch();
    } catch {}
    setSaving(false);
  };

  const deleteSupplier = async (id) => {
    if (!window.confirm("Delete this supplier?")) return;
    await api.delete(`/retail/suppliers/${id}`);
    fetch();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
        <button onClick={openAdd} className="bg-green-700 hover:bg-green-800 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors">+ Add Supplier</button>
      </div>

      {suppliers.length === 0 ? (
        <div className="text-center py-16 text-gray-500"><p className="text-4xl mb-3">🚚</p><p>No suppliers yet</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {suppliers.map(s => (
            <div key={s.supplier_id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{s.supplier_name}</h3>
                  <p className="text-sm text-gray-500">{s.region || "No region"}</p>
                </div>
                <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg">
                  <span className="text-amber-500 text-sm">★</span>
                  <span className="text-xs font-medium text-amber-700">{s.rating}</span>
                </div>
              </div>
              <div className="space-y-2 text-sm mb-4">
                {s.contact_person && <p className="text-gray-600">👤 {s.contact_person}</p>}
                {s.phone && <p className="text-gray-600">📞 {s.phone}</p>}
                <p className="text-gray-600">🚛 ₹{s.transport_cost_per_km}/km transport</p>
              </div>
              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button onClick={() => openEdit(s)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">Edit</button>
                <button onClick={() => deleteSupplier(s.supplier_id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{editSupplier ? "Edit Supplier" : "Add Supplier"}</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Supplier Name *</label>
                  <input value={form.supplier_name} onChange={e => setForm(p => ({ ...p, supplier_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Contact Person</label>
                  <input value={form.contact_person} onChange={e => setForm(p => ({ ...p, contact_person: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                  <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Region</label>
                  <input value={form.region} onChange={e => setForm(p => ({ ...p, region: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Transport Cost/km (₹)</label>
                  <input type="number" step="0.1" value={form.transport_cost_per_km} onChange={e => setForm(p => ({ ...p, transport_cost_per_km: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Rating (1-5)</label>
                  <input type="number" step="0.1" min="1" max="5" value={form.rating} onChange={e => setForm(p => ({ ...p, rating: parseFloat(e.target.value) || 5 }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={save} disabled={saving}
                className="bg-green-700 hover:bg-green-800 disabled:bg-green-400 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors">
                {saving ? "Saving..." : editSupplier ? "Update" : "Create"}
              </button>
              <button onClick={() => setShowModal(false)} className="border border-gray-200 text-gray-700 px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
