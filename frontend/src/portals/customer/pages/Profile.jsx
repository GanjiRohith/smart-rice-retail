import { useState, useEffect } from "react";
import api from "../../../shared/services/api";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api.get("/user/profile")
      .then(r => { setProfile(r.data); setForm(r.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.put("/user/profile", { name: form.name, phone: form.phone, address: form.address });
      setProfile(form);
      setEditing(false);
      setMsg("Profile updated successfully");
      setTimeout(() => setMsg(""), 3000);
    } catch { setMsg("Failed to update"); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>

      {msg && <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl mb-4">{msg}</div>}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-2xl font-bold text-green-800">
            {(profile?.name || "U")[0].toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{profile?.name}</h2>
            <p className="text-gray-500 text-sm">{profile?.email}</p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            {editing ? (
              <input value={form.name || ""} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none" />
            ) : (
              <p className="text-gray-900 py-2">{profile?.name || "—"}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <p className="text-gray-500 py-2">{profile?.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            {editing ? (
              <input value={form.phone || ""} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none" />
            ) : (
              <p className="text-gray-900 py-2">{profile?.phone || "Not set"}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
            {editing ? (
              <textarea value={form.address || ""} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} rows={3}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none" />
            ) : (
              <p className="text-gray-900 py-2">{profile?.address || "Not set"}</p>
            )}
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          {editing ? (
            <>
              <button onClick={save} disabled={saving}
                className="bg-green-700 hover:bg-green-800 disabled:bg-green-400 text-white px-6 py-2.5 rounded-xl font-semibold transition-colors">
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button onClick={() => { setEditing(false); setForm(profile); }}
                className="border border-gray-200 text-gray-700 px-6 py-2.5 rounded-xl font-semibold hover:bg-gray-50 transition-colors">Cancel</button>
            </>
          ) : (
            <button onClick={() => setEditing(true)}
              className="bg-green-700 hover:bg-green-800 text-white px-6 py-2.5 rounded-xl font-semibold transition-colors">Edit Profile</button>
          )}
        </div>
      </div>
    </div>
  );
}
