from fastapi import FastAPI

from app.core.config import settings


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