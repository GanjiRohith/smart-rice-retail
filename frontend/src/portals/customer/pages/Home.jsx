import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../../shared/services/api";

const RICE_CATEGORIES = ["All", "Basmati", "Sona Masoori", "Brown Rice", "Boiled Rice", "Parboiled", "Organic"];

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    api.get("/products/")
      .then(r => setProducts(r.data))
      .catch(() => setProducts(DEMO_PRODUCTS))
      .finally(() => setLoading(false));
  }, []);

  const filtered = products.filter(p => {
    const matchSearch = (p.rice_type || "").toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || (p.rice_type || "").toLowerCase().includes(category.toLowerCase());
    return matchSearch && matchCat;
  });

  const addToCart = (product) => {
    const cart = JSON.parse(localStorage.getItem("rice_cart") || "[]");
    const existing = cart.find(c => c.product_id === product.product_id);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ product_id: product.product_id, rice_type: product.rice_type, price_per_kg: product.price_per_kg, quantity: 1, brand: product.brand });
    }
    localStorage.setItem("rice_cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("storage"));
    // Force re-render
    setProducts([...products]);
  };

  const getCartQty = (pid) => {
    const cart = JSON.parse(localStorage.getItem("rice_cart") || "[]");
    const item = cart.find(c => c.product_id === pid);
    return item ? item.quantity : 0;
  };

  return (
    <div>
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-green-800 to-green-600 rounded-3xl p-10 mb-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-green-200 text-sm font-medium mb-2 uppercase tracking-wider">Premium Quality</p>
          <h1 className="text-4xl font-bold mb-3">Finest Rice, Fresh Delivered</h1>
          <p className="text-green-100 mb-6 max-w-lg">Sourced directly from paddy fields across India. Basmati, Sona Masoori, Brown Rice and more.</p>
          <div className="flex gap-3">
            <a href="#products" className="bg-white text-green-800 px-6 py-2.5 rounded-xl font-semibold hover:bg-green-50 transition-colors">Shop Now</a>
            <Link to="/customer/chatbot" className="border border-white text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-green-700 transition-colors">Ask AI Assistant</Link>
          </div>
        </div>
        <div className="absolute right-8 top-4 text-9xl opacity-20 select-none">🌾</div>
      </div>

      {/* Search + Filter */}
      <div id="products" className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-3 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search rice varieties..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none bg-white" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {RICE_CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                category === c ? "bg-green-700 text-white" : "bg-white text-gray-600 border border-gray-200 hover:border-green-500"
              }`}>{c}</button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 h-72 animate-pulse">
              <div className="bg-gray-100 h-44 rounded-t-2xl" />
              <div className="p-4 space-y-2">
                <div className="bg-gray-100 h-4 rounded w-3/4" />
                <div className="bg-gray-100 h-4 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-5xl mb-4">🌾</p>
          <p className="text-lg font-medium">No products found</p>
          <p className="text-sm">Try a different search or category</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map(p => {
            const cq = getCartQty(p.product_id);
            return (
              <div key={p.product_id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 flex flex-col">
                <Link to={`/customer/product/${p.product_id}`}>
                  <div className="h-44 bg-gradient-to-br from-amber-50 to-green-50 rounded-t-2xl flex items-center justify-center overflow-hidden">
                    {p.image_url ? (
                      <img
                        src={`${process.env.REACT_APP_API_URL || 'https://smart-rice-backend.azurewebsites.net'}${p.image_url}`}
                        alt={p.rice_type}
                        className="h-full w-full object-cover rounded-t-2xl"
                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                      />
                    ) : null}
                    <div className={`h-full w-full items-center justify-center text-6xl ${p.image_url ? 'hidden' : 'flex'}`}>
                      🌾
                    </div>
                  </div>
                </Link>
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-start justify-between mb-1">
                    <Link to={`/customer/product/${p.product_id}`}>
                      <h3 className="font-semibold text-gray-900 hover:text-green-700 transition-colors">{p.rice_type}</h3>
                    </Link>
                    {p.rice_age_months > 0 && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full whitespace-nowrap ml-2">{p.rice_age_months}m aged</span>
                    )}
                  </div>
                  {p.brand && <p className="text-xs text-gray-500 mb-2">{p.brand}</p>}
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
                    <div>
                      <span className="text-lg font-bold text-green-800">₹{p.price_per_kg}</span>
                      <span className="text-xs text-gray-500">/kg</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-lg ${
                      (p.stock_quantity || 0) > 50 ? "bg-green-50 text-green-700" :
                      (p.stock_quantity || 0) > 0 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-600"
                    }`}>
                      {(p.stock_quantity || 0) > 50 ? "In Stock" : (p.stock_quantity || 0) > 0 ? `${p.stock_quantity}kg left` : "Out of Stock"}
                    </span>
                  </div>
                  <button onClick={() => addToCart(p)}
                    disabled={(p.stock_quantity || 0) === 0}
                    className="mt-3 w-full bg-green-700 hover:bg-green-800 disabled:bg-gray-200 disabled:cursor-not-allowed text-white py-2 rounded-xl text-sm font-medium transition-colors">
                    {cq > 0 ? `In Cart (${cq}kg)` : "Add to Cart"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const DEMO_PRODUCTS = [
  { product_id: 1, rice_type: "Basmati Rice", brand: "India Gate", rice_age_months: 24, price_per_kg: 120, stock_quantity: 500, category: "Basmati" },
  { product_id: 2, rice_type: "Sona Masoori", brand: "Kohinoor", rice_age_months: 12, price_per_kg: 65, stock_quantity: 300, category: "Sona Masoori" },
  { product_id: 3, rice_type: "Brown Rice", brand: "Organic India", rice_age_months: 6, price_per_kg: 90, stock_quantity: 150, category: "Brown Rice" },
  { product_id: 4, rice_type: "Ponni Boiled Rice", brand: "Aachi", rice_age_months: 18, price_per_kg: 55, stock_quantity: 40, category: "Boiled Rice" },
];
