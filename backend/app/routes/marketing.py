from datetime import date

from fastapi import APIRouter, Query

from app.controllers.marketing import marketing_controller

router = APIRouter()


@router.get("/marketing")
def get_dashboard(
    start_date: date = Query(...),
    end_date: date = Query(...),
    channel: str = Query(
        default="ALL",
        description=(
            "Marketing channel "
            "(ALL, Tienda, Instagram, Mercado Libre, Página Web, Facebook)"
        ),
    ),
):

    return marketing_controller.get_dashboard(
        start_date=start_date,
        end_date=end_date,
        channel=channel,
    )