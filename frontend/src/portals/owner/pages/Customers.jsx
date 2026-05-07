import { useState, useEffect } from "react";
import api from "../../../shared/services/api";

export default function OwnerCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get("/retail/users")
      .then(r => setCustomers(r.data))
      .catch(() => setCustomers([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = customers.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500">{customers.length} registered customers</p>
        </div>
      </div>

      <div className="mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customers..."
          className="w-full max-w-sm px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none bg-white" />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500"><p className="text-4xl mb-3">👥</p><p>No customers found</p></div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold text-gray-700">Customer</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-700">Email</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-700">Phone</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-700">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(c => (
                  <tr key={c.user_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-800 font-bold text-sm">
                          {(c.name || "?")[0].toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{c.email}</td>
                    <td className="px-5 py-3 text-gray-600">{c.phone || "—"}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{c.created_at ? new Date(c.created_at).toLocaleDateString("en-IN") : "—"}</td>
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
