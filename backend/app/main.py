import sys
import os

sys.path.insert(
    0,
    os.path.dirname(
        os.path.dirname(
            os.path.abspath(__file__)
        )
    )
)

from fastapi import FastAPI, Request

from fastapi.middleware.cors import (
    CORSMiddleware
)

from fastapi.responses import (
    JSONResponse
)

from fastapi.exceptions import (
    RequestValidationError
)

from fastapi.staticfiles import (
    StaticFiles
)

# =========================
# ROUTES
# =========================

from app.routes import (
    auth_routes,
    product_routes,
    user_routes,
    retail_routes,
    ai_routes,
    payment_routes,
    upload_routes,
    operator_routes,
    forecast_route
)

# =========================
# APP
# =========================

app = FastAPI(

    title="Rice Retail AI",

    version="2.0.0"
)

# =========================
# CORS
# =========================

app.add_middleware(

    CORSMiddleware,

    allow_origins=[

        "http://localhost:3000",

        "http://localhost:5173",

        "http://127.0.0.1:3000",

        "http://127.0.0.1:5173"
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)

# =========================
# STATIC FILES
# =========================

os.makedirs(
    "static/product_images",
    exist_ok=True
)

app.mount(

    "/static",

    StaticFiles(directory="static"),

    name="static"
)

# =========================
# VALIDATION ERROR
# =========================

@app.exception_handler(
    RequestValidationError
)

async def validation_handler(

    request: Request,

    exc: RequestValidationError
):

    return JSONResponse(

        status_code=422,

        content={

            "detail":
                exc.errors()[0].get(
                    "msg",
                    "Validation error"
                )
        }
    )

# =========================
# GENERIC ERROR
# =========================

@app.exception_handler(Exception)

async def generic_exception_handler(

    request: Request,

    exc: Exception
):

    from fastapi import (
        HTTPException as FastAPIHTTPException
    )

    from starlette.exceptions import (
        HTTPException as StarletteHTTPException
    )

    if isinstance(

        exc,

        (
            FastAPIHTTPException,
            StarletteHTTPException
        )
    ):

        return JSONResponse(

            status_code=exc.status_code,

            content={
                "detail": exc.detail
            }
        )

    import traceback

    traceback.print_exc()

    return JSONResponse(

        status_code=500,

        content={
            "detail": str(exc)
        }
    )

# =========================
# STARTUP
# =========================

@app.on_event("startup")

def create_tables():

    from app.database.models import Base

    from app.database.db import engine

    if engine:

        try:

            Base.metadata.create_all(
                bind=engine
            )

            print(
                "[OK] All tables created successfully"
            )

        except Exception as e:

            print(
                f"[WARN] Table creation warning: {e}"
            )

# =========================
# ROOT
# =========================

@app.get("/")

def home():

    return {

        "message":
            "Rice Retail AI Backend v2.0"
    }

# =========================
# HEALTH
# =========================

@app.get("/health")

def health():

    return {

        "status": "ok"
    }

# =========================
# ROUTERS
# =========================

app.include_router(

    auth_routes.router,

    prefix="/auth",

    tags=["Auth"]
)

app.include_router(

    product_routes.router,

    prefix="/products",

    tags=["Products"]
)

app.include_router(

    user_routes.router,

    prefix="/user",

    tags=["Customer"]
)

app.include_router(

    retail_routes.router,

    prefix="/retail",

    tags=["Owner"]
)

app.include_router(

    ai_routes.router,

    prefix="/ai",

    tags=["AI"]
)

app.include_router(

    operator_routes.router,

    prefix="/ai",

    tags=["Operator"]
)

app.include_router(

    forecast_route.router,

    prefix="/forecast",

    tags=["Forecast"]
)

app.include_router(

    payment_routes.router,

    prefix="/payment",

    tags=["Payment"]
)

app.include_router(

    upload_routes.router,

    prefix="/upload",

    tags=["Upload"]
)

# =========================
# MAIN
# =========================

if __name__ == "__main__":

    import uvicorn

    uvicorn.run(

        "app.main:app",

        host="127.0.0.1",

        port=8001,

        reload=True
    )