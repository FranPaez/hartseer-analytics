from datetime import date

from app.core.responses import success_response
from app.services.customers import customers_service


class CustomersController:
    """Controller responsible for Customers dashboard endpoints."""

    def get_dashboard(
        self,
        start_date: date,
        end_date: date,
    ):
        data = customers_service.get_dashboard_data(
            start_date,
            end_date,
        )

        return success_response(data)


customers_controller = CustomersController()