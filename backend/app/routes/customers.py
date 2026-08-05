from datetime import date

from fastapi import APIRouter

from app.controllers.customers import customers_controller
from app.schemas.customers import CustomersResponseSchema


router = APIRouter()


@router.get(
    "/customers",
    response_model=CustomersResponseSchema,
    summary="Customers Dashboard",
    description="Returns the Customers dashboard data.",
)
def get_dashboard(
    start_date: date,
    end_date: date,
):
    return customers_controller.get_dashboard(
        start_date,
        end_date,
    )