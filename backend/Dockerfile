# ============================================================
# Smart Rice Retail — FastAPI Backend
# Production Dockerfile for Azure App Service
# ============================================================

# --------------- Stage 1: Builder ---------------
FROM python:3.11-slim AS builder

WORKDIR /build

# Install build-time system deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    libodbc2 \
    unixodbc-dev \
    curl \
    gnupg2 \
    && rm -rf /var/lib/apt/lists/*

# Install ODBC Driver 18 for SQL Server (required by Azure SQL)
RUN curl -fsSL https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor -o /usr/share/keyrings/microsoft-prod.gpg \
    && echo "deb [signed-by=/usr/share/keyrings/microsoft-prod.gpg] https://packages.microsoft.com/debian/12/prod bookworm main" > /etc/apt/sources.list.d/mssql-release.list \
    && apt-get update \
    && ACCEPT_EULA=Y apt-get install -y --no-install-recommends msodbcsql18 \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps into a virtual-env for clean copy
COPY requirements.txt .

# Install PyTorch CPU-only first (saves ~1.5 GB vs full CUDA)
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

# Install remaining requirements
RUN pip install --no-cache-dir -r requirements.txt


# --------------- Stage 2: Runtime ---------------
FROM python:3.11-slim AS runtime

LABEL maintainer="Smart Rice Retail Team"
LABEL description="FastAPI backend with LangChain, LangGraph, RAG & ML"

WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install minimal runtime system deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    libodbc2 \
    unixodbc \
    curl \
    gnupg2 \
    && rm -rf /var/lib/apt/lists/*

# Install ODBC Driver 18 at runtime too
RUN curl -fsSL https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor -o /usr/share/keyrings/microsoft-prod.gpg \
    && echo "deb [signed-by=/usr/share/keyrings/microsoft-prod.gpg] https://packages.microsoft.com/debian/12/prod bookworm main" > /etc/apt/sources.list.d/mssql-release.list \
    && apt-get update \
    && ACCEPT_EULA=Y apt-get install -y --no-install-recommends msodbcsql18 \
    && rm -rf /var/lib/apt/lists/*

# Copy installed Python packages from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
# Install Playwright browser
RUN playwright install chromium

# Copy application source code
COPY app/        ./app/
COPY agents/     ./agents/
COPY ml/         ./ml/
COPY rag/        ./rag/
COPY static/     ./static/

# Create writable dirs for runtime
RUN mkdir -p /app/static/product_images

# Expose port 8000 (Azure App Service default for custom containers)
EXPOSE 8000

# Health check for Azure App Service
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start FastAPI with production settings
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2", "--timeout-keep-alive", "120"]
