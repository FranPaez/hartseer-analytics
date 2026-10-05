from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.responses import error_response
from app.database.connection import DatabaseUnavailableError

from app.routes.executive import router as executive_router
from app.routes.health import router as health_router
from app.routes.products import router as products_router
from app.routes.customers import router as customers_router
from app.routes.marketing import router as marketing_router


app = FastAPI(
    title=settings.API_TITLE,
    description=settings.API_DESCRIPTION,
    version=settings.API_VERSION,
    contact={
        "name": "Franco Paez",
    },
    license_info={
        "name": "MIT License",
    },
)


@app.exception_handler(DatabaseUnavailableError)
def database_unavailable_handler(
    _request: Request,
    _error: DatabaseUnavailableError,
):
    return error_response(
        "DATABASE_UNAVAILABLE",
        "El servicio de datos no está disponible temporalmente.",
        status_code=503,
    )


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "https://franpaez.github.io",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(
    health_router,
    prefix="/api/v1",
    tags=["Health"],
)


app.include_router(
    executive_router,
    prefix="/api/v1",
    tags=["Executive"],
)


app.include_router(
    products_router,
    prefix="/api/v1",
    tags=["Products"],
)


app.include_router(
    customers_router,
    prefix="/api/v1",
    tags=["Customers"],
)


app.include_router(
    marketing_router,
    prefix="/api/v1",
    tags=["Marketing"],
)
