import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../../../shared/hooks/useAuth";
import { useState, useEffect } from "react";
import api from "../../../shared/services/api";

const NAV_ITEMS = [
  { to: "/owner", label: "Dashboard", icon: "📊" },
  { to: "/owner/orders", label: "Orders", icon: "📦" },
  { to: "/owner/products", label: "Products", icon: "🌾" },
  { to: "/owner/inventory", label: "Inventory", icon: "🏪" },
  { to: "/owner/suppliers", label: "Suppliers", icon: "🚚" },
  { to: "/owner/analytics", label: "Analytics", icon: "📈" },
  { to: "/owner/forecast", label: "AI Forecast", icon: "🔮" },

  { to: "/owner/customers", label: "Customers", icon: "👥" },
  { to: "/owner/chatbot", label: "AI Chat", icon: "🤖" },
];

export default function OwnerLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    api.get("/retail/notifications").then(r => {
      setUnreadCount(r.data.filter(n => !n.is_read).length);
    }).catch(() => {});
  }, [location.pathname]);

  const isActive = (to) => {
    if (to === "/owner") return location.pathname === "/owner";
    return location.pathname.startsWith(to);
  };

  const currentPage = NAV_ITEMS.find(n => isActive(n.to))?.label || "Owner Dashboard";

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full shadow-sm z-50 transition-transform lg:translate-x-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌾</span>
            <div>
              <div className="font-bold text-green-800 text-lg leading-tight">RiceRetail</div>
              <div className="text-xs text-gray-500">Owner Portal</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {NAV_ITEMS.map(item => (
            <Link key={item.to} to={item.to} onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl mb-1 text-sm font-medium transition-all ${
                isActive(item.to) ? "bg-green-50 text-green-800 font-semibold" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}>
              <span>{item.icon}</span>
              <span>{item.label}</span>
              {item.label === "Orders" && unreadCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{unreadCount}</span>
              )}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-800 font-bold text-sm">
              {(user?.name || user?.email || "O")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name || user?.email}</p>
              <p className="text-xs text-gray-500">Owner</p>
            </div>
          </div>
          <button onClick={logout} className="w-full text-left text-sm text-red-600 hover:text-red-800 transition-colors px-2 py-1">
            → Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <header className="bg-white border-b border-gray-200 px-4 lg:px-8 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-gray-600 hover:text-gray-900">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{currentPage}</h1>
              <p className="text-xs text-gray-500">{new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
            </div>
          </div>
          {unreadCount > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1.5 rounded-xl text-xs font-medium">
              🔔 {unreadCount} new alerts
            </div>
          )}
        </header>

        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>

        <footer className="bg-white border-t border-gray-100 px-8 py-4 text-center text-xs text-gray-400">
          © 2026 RiceRetail Owner Portal
        </footer>
      </div>
    </div>
  );
}
