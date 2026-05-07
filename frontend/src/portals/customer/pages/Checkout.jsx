import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../../../shared/services/api";

export default function Checkout() {
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState("");
  const [paymentStep, setPaymentStep] = useState(null); // null | "processing" | "done"
 

  const items = JSON.parse(localStorage.getItem("rice_cart") || "[]");
  const subtotal = items.reduce((sum, i) => sum + i.price_per_kg * i.quantity, 0);

  if (items.length === 0 && !success) {
    return (
      <div className="text-center py-20">
        <p className="text-5xl mb-4">🛒</p>
        <p className="text-lg font-medium text-gray-700">No items in cart</p>
        <Link to="/customer" className="text-green-700 hover:underline text-sm mt-2 inline-block">← Browse products</Link>
      </div>
    );
  }

  const placeOrder = async () => {
    if (!address.trim()) { setError("Please enter delivery address"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/user/orders", {
        items: items.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
        delivery_address: address,
        payment_method: paymentMethod === "cash" ? "cash_on_delivery" : "online"
      });

      if (paymentMethod === "online") {
        // Initiate Stripe payment
        setPaymentStep("processing");
        try {
          const payRes = await api.post("/payment/initiate", {
            order_id: res.data.order_id,
            amount: res.data.total_amount
          });

          // Simulate payment success after 2 seconds (in real app, use Stripe.js)
          setTimeout(async () => {
            try {
              await api.post("/payment/confirm", {
                order_id: res.data.order_id,
                payment_intent_id: payRes.data.payment_intent_id
              });
              setPaymentStep("done");
              localStorage.removeItem("rice_cart");
              setSuccess({ ...res.data, payment_confirmed: true, transaction_id: payRes.data.payment_intent_id });
            } catch {
              setError("Payment confirmation failed. Your order is placed but payment is pending.");
              localStorage.removeItem("rice_cart");
              setSuccess(res.data);
            }
          }, 2000);
        } catch {
          setError("Payment initiation failed. Order placed with pending payment.");
          localStorage.removeItem("rice_cart");
          setSuccess(res.data);
        }
      } else {
        // COD: order placed directly
        localStorage.removeItem("rice_cart");
        setSuccess(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to place order");
      setLoading(false);
    }
  };

  if (paymentStep === "processing") {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="w-20 h-20 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Processing Payment...</h2>
        <p className="text-gray-500">Please wait while we confirm your payment</p>
        <div className="mt-6 bg-green-50 rounded-xl p-4">
          <p className="text-sm text-green-700 font-medium">Amount: ₹{subtotal.toFixed(2)}</p>
          <p className="text-xs text-green-600 mt-1">Secure payment via Stripe</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="bg-green-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h2>
        <p className="text-gray-500 mb-1">Order #{success.order_id}</p>
        <p className="text-gray-500 mb-2">Total: ₹{success.total_amount?.toFixed(2)}</p>
        {success.payment_confirmed && (
          <p className="text-green-600 text-sm font-medium mb-2">✓ Payment confirmed (TXN: {success.transaction_id})</p>
        )}
        {!success.payment_confirmed && paymentMethod === "cash" && (
          <p className="text-amber-600 text-sm font-medium mb-2">Pay ₹{success.total_amount?.toFixed(2)} on delivery</p>
        )}
        <div className="flex gap-3 justify-center mt-6">
          <Link to="/customer/orders" className="bg-green-700 hover:bg-green-800 text-white px-6 py-2.5 rounded-xl font-semibold transition-colors">
            View Orders
          </Link>
          <Link to="/customer" className="border border-gray-200 text-gray-700 px-6 py-2.5 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        {/* Form */}
        <div className="md:col-span-3 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Delivery Address</h3>
            <textarea value={address} onChange={e => setAddress(e.target.value)} rows={3} placeholder="Enter full delivery address..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none" />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Payment Method</h3>
            <div className="space-y-3">
              {[
                { value: "cash", label: "Cash on Delivery", icon: "💵", desc: "Pay when you receive" },
                { value: "online", label: "Online Payment (Stripe)", icon: "💳", desc: "Secure card payment via Stripe" },
              ].map(pm => (
                <label key={pm.value} className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                  paymentMethod === pm.value ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-gray-300"
                }`}>
                  <input type="radio" name="payment" value={pm.value} checked={paymentMethod === pm.value}
                    onChange={e => setPaymentMethod(e.target.value)} className="accent-green-600" />
                  <span className="text-2xl">{pm.icon}</span>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{pm.label}</p>
                    <p className="text-xs text-gray-500">{pm.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-24">
            <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
            <div className="space-y-3 mb-4">
              {items.map(i => (
                <div key={i.product_id} className="flex justify-between text-sm">
                  <span className="text-gray-600">{i.rice_type} × {i.quantity}kg</span>
                  <span className="font-medium">₹{(i.price_per_kg * i.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-4 mb-6">
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-green-800">₹{subtotal.toFixed(2)}</span>
              </div>
            </div>
            {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
            <button onClick={placeOrder} disabled={loading}
              className="w-full bg-green-700 hover:bg-green-800 disabled:bg-green-400 text-white py-3 rounded-xl font-semibold transition-colors">
              {loading ? "Processing..." : paymentMethod === "online" ? `Pay ₹${subtotal.toFixed(2)}` : "Place Order (COD)"}
            </button>
            {paymentMethod === "online" && (
              <p className="text-xs text-gray-400 text-center mt-2">🔒 Secured by Stripe</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
