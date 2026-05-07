import { useState, useEffect } from "react";
import api from "../../../shared/services/api";

export default function AnomalyAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/ai/anomalies")
      .then(r => setAlerts(r.data.alerts || []))
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Anomaly Alerts</h1>
      <p className="text-sm text-gray-500 mb-6">Real-time stock and sales anomaly detection</p>

      {alerts.length === 0 ? (
        <div className="text-center py-16">
          <div className="bg-green-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">✅</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">All Clear!</h3>
          <p className="text-gray-500">No anomalies detected. Everything is running smoothly.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert, i) => (
            <div key={i} className={`rounded-2xl border p-5 ${
              alert.severity === "critical" ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"
            }`}>
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${
                  alert.severity === "critical" ? "bg-red-100" : "bg-amber-100"
                }`}>
                  {alert.severity === "critical" ? "🚨" : "⚠️"}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`font-semibold ${alert.severity === "critical" ? "text-red-800" : "text-amber-800"}`}>
                      {alert.type === "low_stock" ? "Low Stock Alert" : alert.type}
                    </h3>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      alert.severity === "critical" ? "bg-red-200 text-red-800" : "bg-amber-200 text-amber-800"
                    }`}>
                      {alert.severity}
                    </span>
                  </div>
                  <p className={`text-sm ${alert.severity === "critical" ? "text-red-700" : "text-amber-700"}`}>
                    <strong>{alert.product}</strong> — Current stock: {alert.current}kg (threshold: {alert.threshold}kg)
                  </p>
                  {alert.current === 0 && (
                    <p className="text-sm text-red-600 font-medium mt-1">⚡ OUT OF STOCK — Immediate restocking required</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
