from fastapi import APIRouter

from app.controllers.health import health_controller
from app.schemas.health import HealthResponseSchema


router = APIRouter()


@router.get(
    "/health",
    response_model=HealthResponseSchema,
    summary="Health Check",
    description="Returns the current status of the API.",
)
def get_health():
    return health_controller.get_health()