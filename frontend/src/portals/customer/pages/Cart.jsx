import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Cart() {
  const [items, setItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadCart();
    window.addEventListener("storage", loadCart);
    return () => window.removeEventListener("storage", loadCart);
  }, []);

  const loadCart = () => {
    setItems(JSON.parse(localStorage.getItem("rice_cart") || "[]"));
  };

  const updateQty = (pid, delta) => {
    const cart = items.map(i => {
      if (i.product_id === pid) return { ...i, quantity: Math.max(1, i.quantity + delta) };
      return i;
    });
    localStorage.setItem("rice_cart", JSON.stringify(cart));
    setItems(cart);
  };

  const removeItem = (pid) => {
    const cart = items.filter(i => i.product_id !== pid);
    localStorage.setItem("rice_cart", JSON.stringify(cart));
    setItems(cart);
  };

  const clearCart = () => {
    localStorage.removeItem("rice_cart");
    setItems([]);
  };

  const subtotal = items.reduce((sum, i) => sum + i.price_per_kg * i.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-6xl mb-4">🛒</p>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Add some premium rice to get started</p>
        <Link to="/customer" className="bg-green-700 hover:bg-green-800 text-white px-6 py-2.5 rounded-xl font-semibold transition-colors">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
        <button onClick={clearCart} className="text-sm text-red-500 hover:text-red-700 transition-colors">Clear Cart</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map(item => (
            <div key={item.product_id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-5">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-50 to-green-50 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">🌾</div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900">{item.rice_type}</h3>
                {item.brand && <p className="text-xs text-gray-500">{item.brand}</p>}
                <p className="text-green-700 font-medium mt-1">₹{item.price_per_kg}/kg</p>
              </div>
              <div className="flex items-center border border-gray-200 rounded-xl">
                <button onClick={() => updateQty(item.product_id, -1)} className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 rounded-l-xl">−</button>
                <span className="px-3 py-1.5 font-semibold text-sm min-w-[2.5rem] text-center">{item.quantity}</span>
                <button onClick={() => updateQty(item.product_id, 1)} className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 rounded-r-xl">+</button>
              </div>
              <p className="font-semibold text-gray-900 min-w-[5rem] text-right">₹{(item.price_per_kg * item.quantity).toFixed(2)}</p>
              <button onClick={() => removeItem(item.product_id)} className="text-red-400 hover:text-red-600 transition-colors p-1">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-fit sticky top-24">
          <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
          <div className="space-y-3 mb-4">
            {items.map(i => (
              <div key={i.product_id} className="flex justify-between text-sm">
                <span className="text-gray-600">{i.rice_type} × {i.quantity}kg</span>
                <span className="text-gray-900 font-medium">₹{(i.price_per_kg * i.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 pt-4 mb-6">
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-green-800">₹{subtotal.toFixed(2)}</span>
            </div>
          </div>
          <button onClick={() => navigate("/customer/checkout")}
            className="w-full bg-green-700 hover:bg-green-800 text-white py-3 rounded-xl font-semibold transition-colors">
            Proceed to Checkout
          </button>
          <Link to="/customer" className="block text-center text-sm text-gray-500 hover:text-green-700 mt-3 transition-colors">
            ← Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
