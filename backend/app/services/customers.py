from datetime import date

from app.repositories.customers import customers_repository


class CustomersService:
    """Service responsible for Customers dashboard business logic."""

    def get_dashboard_data(
        self,
        start_date: date,
        end_date: date,
    ) -> dict:

        return customers_repository.get_kpis(
            start_date,
            end_date,
        )


customers_service = CustomersService()