from datetime import date

from fastapi import APIRouter

from app.controllers.products import products_controller
from app.schemas.products import ProductsResponseSchema


router = APIRouter()


@router.get(
    "/products",
    response_model=ProductsResponseSchema,
    summary="Products Dashboard",
    description="Returns the Products dashboard data.",
)
def get_dashboard(
    start_date: date,
    end_date: date,
    group_by: str,
):
    return products_controller.get_dashboard(
        start_date,
        end_date,
        group_by,
    )