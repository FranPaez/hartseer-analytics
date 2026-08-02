from fastapi import FastAPI

from app.core.config import settings
from app.routes.executive import router as executive_router
from app.routes.health import router as health_router


# ----------------------------
# FastAPI Application
# ----------------------------

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


# ----------------------------
# Routes
# ----------------------------

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