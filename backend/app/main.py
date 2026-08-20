from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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
    marketing.router,
    prefix="/api/v1",
    tags=["Marketing"],
)