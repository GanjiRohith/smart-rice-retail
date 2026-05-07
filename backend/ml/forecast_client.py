import requests
import os
from dotenv import load_dotenv

load_dotenv()

AZURE_ML_ENDPOINT = os.getenv("AZURE_ML_ENDPOINT")

AZURE_ML_KEY = os.getenv("AZURE_ML_KEY")


def predict_demand(data):

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {AZURE_ML_KEY}"
    }

    response = requests.post(
        AZURE_ML_ENDPOINT,
        json=data,
        headers=headers
    )

    return response.json()