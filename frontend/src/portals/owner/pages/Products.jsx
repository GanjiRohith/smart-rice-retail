import { useState, useEffect, useRef } from "react";
import api from "../../../shared/services/api";
import { Upload, X } from "lucide-react";

const API_BASE = process.env.REACT_APP_API_URL || "https://smart-rice-backend.azurewebsites.net";

export default function OwnerProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState({ rice_type: "", brand: "", rice_age_months: 0, price_per_kg: 0, package_size: 1, stock_quantity: 0, description: "", image_url: "" });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => { fetchProducts(); }, []);
  const fetchProducts = () => { api.get("/products/").then(r => setProducts(r.data)).catch(() => {}).finally(() => setLoading(false)); };

  const openAdd = () => {
    setEditProduct(null);
    setForm({ rice_type: "", brand: "", rice_age_months: 0, price_per_kg: 0, package_size: 1, stock_quantity: 0, description: "", image_url: "" });
    setImagePreview(null);
    setShowModal(true);
  };
  const openEdit = (p) => {
    setEditProduct(p);
    setForm({ rice_type: p.rice_type, brand: p.brand || "", rice_age_months: p.rice_age_months, price_per_kg: p.price_per_kg, package_size: p.package_size, stock_quantity: p.stock_quantity, description: p.description || "", image_url: p.image_url || "" });
    setImagePreview(p.image_url ? `${API_BASE}${p.image_url}` : null);
    setShowModal(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);
    try {
      const res = await api.post("/upload/product-image", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const imageUrl = res.data.image_url;
      setForm(prev => ({ ...prev, image_url: imageUrl }));
      setImagePreview(`${API_BASE}${imageUrl}`);
    } catch {
      alert("Image upload failed. Max 5MB, JPEG/PNG/WebP only.");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setForm(prev => ({ ...prev, image_url: "" }));
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const save = async () => {
    setSaving(true);
    try {
      if (editProduct) {
        await api.put(`/products/${editProduct.product_id}`, form);
      } else {
        await api.post("/products/", form);
      }
      setShowModal(false);
      fetchProducts();
    } catch {}
    setSaving(false);
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Deactivate this product?")) return;
    await api.delete(`/products/${id}`);
    fetchProducts();
  };

  const filtered = products.filter(p => p.rice_type.toLowerCase().includes(search.toLowerCase()) || (p.brand || "").toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <button onClick={openAdd} className="bg-green-700 hover:bg-green-800 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors">+ Add Product</button>
      </div>

      <div className="mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."
          className="w-full max-w-sm px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none bg-white" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-gray-700">Image</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-700">Rice Type</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-700">Brand</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-700">Age</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-700">Price/kg</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-700">Stock</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-700">Status</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(p => (
                <tr key={p.product_id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    {p.image_url ? (
                      <img src={`${API_BASE}${p.image_url}`} alt={p.rice_type}
                        className="w-10 h-10 rounded-lg object-cover border border-gray-100" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-lg">🌾</div>
                    )}
                  </td>
                  <td className="px-5 py-3 font-medium text-gray-900">{p.rice_type}</td>
                  <td className="px-5 py-3 text-gray-600">{p.brand || "—"}</td>
                  <td className="px-5 py-3 text-gray-600">{p.rice_age_months}m</td>
                  <td className="px-5 py-3 text-green-700 font-medium">₹{p.price_per_kg}</td>
                  <td className="px-5 py-3">{p.stock_quantity}kg</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${p.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                      {p.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => openEdit(p)} className="text-blue-600 hover:text-blue-800 text-xs font-medium mr-3">Edit</button>
                    <button onClick={() => deleteProduct(p.product_id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{editProduct ? "Edit Product" : "Add Product"}</h3>
            <div className="space-y-3">
              {/* Image Upload */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Product Image</label>
                {imagePreview ? (
                  <div className="relative w-full h-40 rounded-xl overflow-hidden border border-gray-200">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button onClick={removeImage} className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full shadow-lg">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-green-400 transition-colors cursor-pointer"
                    onClick={() => fileRef.current?.click()}>
                    <Upload size={24} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">{uploading ? "Uploading..." : "Click to upload image"}</p>
                    <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP (max 5MB)</p>
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Rice Type *</label>
                  <input value={form.rice_type} onChange={e => setForm(p => ({ ...p, rice_type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Brand</label>
                  <input value={form.brand} onChange={e => setForm(p => ({ ...p, brand: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Price/kg *</label>
                  <input type="number" value={form.price_per_kg} onChange={e => setForm(p => ({ ...p, price_per_kg: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Stock (kg)</label>
                  <input type="number" value={form.stock_quantity} onChange={e => setForm(p => ({ ...p, stock_quantity: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Age (months)</label>
                  <input type="number" value={form.rice_age_months} onChange={e => setForm(p => ({ ...p, rice_age_months: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={save} disabled={saving}
                className="bg-green-700 hover:bg-green-800 disabled:bg-green-400 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors">
                {saving ? "Saving..." : editProduct ? "Update" : "Create"}
              </button>
              <button onClick={() => setShowModal(false)} className="border border-gray-200 text-gray-700 px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
