from datetime import date

from fastapi import APIRouter

from app.controllers.executive import executive_controller
from app.schemas.executive import ExecutiveResponseSchema


router = APIRouter()


@router.get(
    "/executive",
    response_model=ExecutiveResponseSchema,
    summary="Executive Dashboard",
    description="Returns the Executive dashboard data.",
)
def get_dashboard(
    start_date: date,
    end_date: date,
):
    return executive_controller.get_dashboard(
        start_date,
        end_date,
    )