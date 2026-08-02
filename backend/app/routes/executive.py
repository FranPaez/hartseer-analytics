from fastapi import APIRouter

from app.controllers.executive import executive_controller


router = APIRouter()


@router.get(
    "/executive",
    summary="Executive Dashboard",
    description="Returns the Executive dashboard data.",
)
def get_dashboard():
    return executive_controller.get_dashboard()