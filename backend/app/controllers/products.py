from datetime import date

from app.core.responses import success_response
from app.services.products import products_service


class ProductsController:
    """Controller responsible for Products dashboard endpoints."""

    def get_dashboard(
        self,
        start_date: date,
        end_date: date,
        group_by: str,
    ):
        data = products_service.get_dashboard_data(
            start_date,
            end_date,
            group_by,
        )

        return success_response(data)


products_controller = ProductsController()