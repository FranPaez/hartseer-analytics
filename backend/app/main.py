from fastapi import FastAPI

from app.core.config import settings
from app.routes.executive import router as executive_router
from app.routes.health import router as health_router
from app.routes.products import router as products_router
from app.routes.customers import router as customers_router
from app.routes import marketing


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
    marketing.router,
    prefix="/api/v1/marketing",
    tags=["Marketing"],
)