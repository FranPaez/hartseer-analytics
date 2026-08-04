from datetime import date

from app.repositories.products import products_repository


class ProductsService:
    """Service responsible for Products dashboard business logic."""

    def get_dashboard_data(
        self,
        start_date: date,
        end_date: date,
        group_by: str,
    ) -> dict:

        return products_repository.get_kpis(
            start_date,
            end_date,
            group_by,
        )


products_service = ProductsService()