import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../../shared/services/api";

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    api.get(`/products/${id}`)
      .then(r => setProduct(r.data))
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  const addToCart = () => {
    if (!product) return;
    const cart = JSON.parse(localStorage.getItem("rice_cart") || "[]");
    const existing = cart.find(c => c.product_id === product.product_id);
    if (existing) {
      existing.quantity += qty;
    } else {
      cart.push({ product_id: product.product_id, rice_type: product.rice_type, price_per_kg: product.price_per_kg, quantity: qty, brand: product.brand });
    }
    localStorage.setItem("rice_cart", JSON.stringify(cart));
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!product) return (
    <div className="text-center py-20">
      <p className="text-5xl mb-4">😔</p>
      <p className="text-lg font-medium text-gray-700">Product not found</p>
      <Link to="/customer" className="text-green-700 hover:underline text-sm mt-2 inline-block">← Back to shop</Link>
    </div>
  );

  return (
    <div>
      <Link to="/customer" className="text-sm text-gray-500 hover:text-green-700 mb-6 inline-flex items-center gap-1">
        ← Back to products
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-4">
        {/* Image */}
        <div className="bg-gradient-to-br from-amber-50 to-green-50 rounded-2xl flex items-center justify-center h-80 md:h-96 overflow-hidden">
          {product.image_url ? (
            <img
              src={`${process.env.REACT_APP_API_URL || 'https://smart-rice-backend.azurewebsites.net'}${product.image_url}`}
              alt={product.rice_type}
              className="h-full w-full object-cover rounded-2xl"
              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
            />
          ) : null}
          <div className={`h-full w-full items-center justify-center ${product.image_url ? 'hidden' : 'flex'}`}>
            <span className="text-8xl">🌾</span>
          </div>
        </div>

        {/* Details */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-green-100 text-green-700 text-xs font-medium px-3 py-1 rounded-full">{product.category}</span>
            {product.rice_age_months > 0 && (
              <span className="bg-amber-100 text-amber-700 text-xs font-medium px-3 py-1 rounded-full">{product.rice_age_months} months aged</span>
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">{product.rice_type}</h1>
          {product.brand && <p className="text-gray-500 mb-4">by {product.brand}</p>}
          
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-3xl font-bold text-green-800">₹{product.price_per_kg}</span>
            <span className="text-gray-500">/kg</span>
          </div>

          {product.description && (
            <p className="text-gray-600 mb-6 leading-relaxed">{product.description}</p>
          )}

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500">Package Size</p>
              <p className="font-semibold text-gray-900">{product.package_size} kg</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500">Stock</p>
              <p className={`font-semibold ${product.stock_quantity > 50 ? "text-green-700" : product.stock_quantity > 0 ? "text-amber-600" : "text-red-600"}`}>
                {product.stock_quantity > 0 ? `${product.stock_quantity} kg available` : "Out of Stock"}
              </p>
            </div>
          </div>

          {/* Quantity + Add to Cart */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center border border-gray-200 rounded-xl">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-l-xl">−</button>
              <span className="px-4 py-2 font-semibold text-gray-900 min-w-[3rem] text-center">{qty}</span>
              <button onClick={() => setQty(q => q + 1)} className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-r-xl">+</button>
            </div>
            <span className="text-sm text-gray-500">{qty} kg = ₹{(product.price_per_kg * qty).toFixed(2)}</span>
          </div>

          <button onClick={addToCart} disabled={product.stock_quantity === 0}
            className={`w-full py-3 rounded-xl font-semibold text-white transition-all ${
              added ? "bg-green-500" : "bg-green-700 hover:bg-green-800"
            } disabled:bg-gray-300 disabled:cursor-not-allowed`}>
            {added ? "✓ Added to Cart!" : product.stock_quantity === 0 ? "Out of Stock" : "Add to Cart"}
          </button>
        </div>
      </div>
    </div>
  );
}
