import os
from dotenv import load_dotenv

load_dotenv()

# Environment configurations with fail-safe defaults for development
DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./smart_retail.db")
SECRET_KEY: str = os.getenv("SECRET_KEY", "fallback_secret_key_change_in_production")
ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))