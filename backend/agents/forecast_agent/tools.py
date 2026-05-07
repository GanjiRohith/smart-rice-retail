import os
from datetime import datetime

import joblib
import pandas as pd
import requests

from dotenv import load_dotenv

load_dotenv()


class ForecastTools:

    def __init__(self):

        self.use_endpoint = (
            os.getenv(
                "USE_FORECAST_ENDPOINT",
                "false"
            ).lower() == "true"
        )

        self.endpoint_url = os.getenv(
            "FORECAST_ENDPOINT_URL"
        )

        self.endpoint_key = os.getenv(
            "FORECAST_ENDPOINT_KEY"
        )

        model_path = os.path.join(
            "ml",
            "rice_forecast_model.pkl"
        )

        self.model = joblib.load(model_path)

    # =========================
    # MAIN PREDICT
    # =========================

    def predict(self, features):

        if self.use_endpoint:
            return self.predict_from_endpoint(features)

        return self.predict_local(features)

    # =========================
    # LOCAL MODEL
    # =========================

    def predict_local(self, features):

        trained_columns = list(
            self.model.feature_names_in_
        )

        # Start all columns at 0
        row = {col: 0 for col in trained_columns}

        now = datetime.now()

        # =========================
        # DATE FEATURES
        # =========================

        row["day"]         = now.day
        row["month"]       = now.month
        row["weekday"]     = now.weekday()
        row["weekday_num"] = now.weekday()

        # =========================
        # SEASON ENCODING
        # =========================

        month = now.month

        if month in [6, 7, 8, 9]:
            if "season_monsoon" in row:
                row["season_monsoon"] = 1

        elif month in [3, 4, 5]:
            if "season_summer" in row:
                row["season_summer"] = 1

        elif month in [11, 12, 1, 2]:
            if "season_winter" in row:
                row["season_winter"] = 1

        # =========================
        # DIRECT NUMERIC FEATURES
        # =========================

        direct_fields = [
            "price_per_kg",
            "discount",
            "stock_available",
            "transport_cost",
            "marketing_spend",
            "temperature",
            "rainfall",
            "rice_age_months",
            "sudden_spike_flag",
        ]

        for field in direct_fields:
            if field in features and field in row:
                row[field] = features[field]

        # =========================
        # FESTIVAL FLAG
        # =========================

        festival_raw = features.get(
            "festival_season",
            features.get("festival_flag", 0)
        )

        if str(festival_raw).lower() in ["yes", "true", "1"]:
            row["festival_flag"] = 1
        else:
            row["festival_flag"] = 0

        # =========================
        # REGION ENCODING
        # =========================

        region = features.get("region", "")
        region_col = f"region_{region}"

        if region_col in row:
            row[region_col] = 1

        # =========================
        # RICE TYPE ENCODING
        # =========================

        rice_type = features.get("rice_type", "")
        rice_col = f"rice_type_{rice_type}"

        if rice_col in row:
            row[rice_col] = 1

        # =========================
        # SUPPLIER ENCODING
        # =========================

        supplier = features.get("supplier_name", "")
        supplier_col = f"supplier_name_{supplier}"

        if supplier_col in row:
            row[supplier_col] = 1

        # =========================
        # DEFAULTS FOR MISSING
        # =========================

        defaults = {
            "rice_age_months": 6,
            "transport_cost":  0,
            "marketing_spend": 0,
            "temperature":     30,
            "rainfall":        0,
            "sudden_spike_flag": 0,
        }

        for key, value in defaults.items():
            if key in row and key not in features:
                row[key] = value

        # =========================
        # PREDICT
        # =========================

        df = pd.DataFrame([row])

        prediction = self.model.predict(df)

        return {
            "source":     "local_pkl",
            "prediction": float(prediction[0])
        }

    # =========================
    # ENDPOINT PREDICTION
    # =========================

    def predict_from_endpoint(self, features):

        headers = {
            "Authorization": f"Bearer {self.endpoint_key}",
            "Content-Type":  "application/json"
        }

        payload = {
            "input_data": [features]
        }

        response = requests.post(
            self.endpoint_url,
            headers=headers,
            json=payload
        )

        result = response.json()

        return {
            "source":     "azure_endpoint",
            "prediction": result
        }


# =========================
# RESTOCK RECOMMENDATION
# =========================

def generate_restock_recommendation(
    current_stock,
    predicted_demand
):

    try:
        current_stock = float(current_stock)
    except:
        current_stock = 0.0

    try:
        predicted_demand = float(predicted_demand)
    except:
        predicted_demand = 0.0

    if predicted_demand > current_stock:

        shortage = round(
            predicted_demand - current_stock,
            2
        )

        return (
            f"Restock immediately. "
            f"Expected shortage of "
            f"{shortage} units."
        )

    surplus = round(
        current_stock - predicted_demand,
        2
    )

    return (
        f"Current stock is sufficient. "
        f"Estimated surplus: {surplus} units."
    )