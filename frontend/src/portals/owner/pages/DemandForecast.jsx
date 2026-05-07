import { useState } from "react";
import api from "../../../services/api";

export default function DemandForecast() {

  const [formData, setFormData] = useState({
    rice_type:        "Basmati",
    price_per_kg:     70,
    festival_flag:    0,
    temperature:      30,
    rainfall:         50,
    stock_available:  150,
    transport_cost:   12,
    marketing_spend:  5000,
    sudden_spike_flag: 0,
    discount:         5,
    rice_age_months:  6,
    region:           "Hyderabad",
  });

  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePredict = async () => {
    try {
      setLoading(true);

      const response = await api.post("/ai/forecast", {
        message: "Predict demand forecast",
        payload: [formData]
      });

      const data = response.data.forecast;

      const prediction = parseFloat(data?.prediction) || 0;

      setResult({
        predicted_demand_7d: prediction,
        recommendation:      data?.recommendation || "N/A",
        analysis:            data?.analysis       || "",
        trend:
          prediction > 140 ? "up"
          : prediction < 80 ? "down"
          : "stable"
      });

    } catch (err) {
      console.error(err);
      alert("Prediction failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">AI Demand Forecast</h1>
        <p className="text-gray-500 mt-2">Predict future rice demand using AI forecasting</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">

        {/* Rice Type */}
        <div>
          <label className="text-sm font-medium">Rice Type</label>
          <select name="rice_type" value={formData.rice_type} onChange={handleChange}
            className="w-full mt-1 border rounded-xl p-3">
            <option value="Basmati">Basmati</option>
            <option value="Sona Masuri">Sona Masuri</option>
            <option value="Kolam">Kolam</option>
            <option value="Brown Rice">Brown Rice</option>
          </select>
        </div>

        {/* Region */}
        <div>
          <label className="text-sm font-medium">Region</label>
          <select name="region" value={formData.region} onChange={handleChange}
            className="w-full mt-1 border rounded-xl p-3">
            <option value="Hyderabad">Hyderabad</option>
            <option value="Warangal">Warangal</option>
            <option value="Karimnagar">Karimnagar</option>
            <option value="Nizamabad">Nizamabad</option>
            <option value="Adilabad">Adilabad</option>
          </select>
        </div>

        {/* Price Per KG */}
        <div>
          <label className="text-sm font-medium">Price Per KG</label>
          <input type="number" name="price_per_kg" value={formData.price_per_kg}
            onChange={handleChange} className="w-full mt-1 border rounded-xl p-3" />
        </div>

        {/* Current Stock */}
        <div>
          <label className="text-sm font-medium">Current Stock (kg)</label>
          <input type="number" name="stock_available" value={formData.stock_available}
            onChange={handleChange} className="w-full mt-1 border rounded-xl p-3" />
        </div>

        {/* Discount */}
        <div>
          <label className="text-sm font-medium">Discount %</label>
          <input type="number" name="discount" value={formData.discount}
            onChange={handleChange} className="w-full mt-1 border rounded-xl p-3" />
        </div>

        {/* Temperature */}
        <div>
          <label className="text-sm font-medium">Temperature (°C)</label>
          <input type="number" name="temperature" value={formData.temperature}
            onChange={handleChange} className="w-full mt-1 border rounded-xl p-3" />
        </div>

        {/* Rainfall */}
        <div>
          <label className="text-sm font-medium">Rainfall (mm)</label>
          <input type="number" name="rainfall" value={formData.rainfall}
            onChange={handleChange} className="w-full mt-1 border rounded-xl p-3" />
        </div>

        {/* Marketing Spend */}
        <div>
          <label className="text-sm font-medium">Marketing Spend (₹)</label>
          <input type="number" name="marketing_spend" value={formData.marketing_spend}
            onChange={handleChange} className="w-full mt-1 border rounded-xl p-3" />
        </div>

        {/* Transport Cost */}
        <div>
          <label className="text-sm font-medium">Transport Cost (₹)</label>
          <input type="number" name="transport_cost" value={formData.transport_cost}
            onChange={handleChange} className="w-full mt-1 border rounded-xl p-3" />
        </div>

        {/* Rice Age */}
        <div>
          <label className="text-sm font-medium">Rice Age (months)</label>
          <input type="number" name="rice_age_months" value={formData.rice_age_months}
            onChange={handleChange} className="w-full mt-1 border rounded-xl p-3" />
        </div>

        {/* Festival Season */}
        <div>
          <label className="text-sm font-medium">Festival Season</label>
          <select name="festival_flag" value={formData.festival_flag} onChange={handleChange}
            className="w-full mt-1 border rounded-xl p-3">
            <option value={0}>No</option>
            <option value={1}>Yes</option>
          </select>
        </div>

        {/* Sudden Spike */}
        <div>
          <label className="text-sm font-medium">Sudden Demand Spike?</label>
          <select name="sudden_spike_flag" value={formData.sudden_spike_flag} onChange={handleChange}
            className="w-full mt-1 border rounded-xl p-3">
            <option value={0}>No</option>
            <option value={1}>Yes</option>
          </select>
        </div>

      </div>

      <button
        onClick={handlePredict}
        disabled={loading}
        className="mt-6 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium"
      >
        {loading ? "Predicting..." : "Predict Demand"}
      </button>

      {result && (
        <div className="mt-8 bg-white border border-gray-100 rounded-2xl shadow-sm p-6">

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Forecast Result</h2>
              <p className="text-gray-500 mt-1">AI-generated demand prediction</p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${
              result.trend === "up"   ? "bg-green-100 text-green-700" :
              result.trend === "down" ? "bg-red-100 text-red-700"     :
                                        "bg-gray-100 text-gray-700"
            }`}>
              {result.trend === "up" ? "📈 Trending Up" : result.trend === "down" ? "📉 Declining" : "➡️ Stable"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">

            <div className="bg-blue-50 rounded-2xl p-5">
              <p className="text-sm text-blue-600">Predicted Demand (7 Days)</p>
              <h3 className="text-4xl font-bold text-blue-700 mt-2">
                {Number(result.predicted_demand_7d).toFixed(2)} kg
              </h3>
            </div>

            <div className="bg-green-50 rounded-2xl p-5">
              <p className="text-sm text-green-700">Recommendation</p>
              <h3 className="text-xl font-semibold text-green-800 mt-2">
                {result.recommendation}
              </h3>
            </div>

          </div>

          {result.analysis && (
            <div className="mt-6 bg-gray-50 rounded-2xl p-5">
              <p className="text-sm font-medium text-gray-700 mb-2">AI Analysis</p>
              <p className="text-gray-600 text-sm whitespace-pre-wrap">{result.analysis}</p>
            </div>
          )}

        </div>
      )}

    </div>
  );
}