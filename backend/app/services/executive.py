from datetime import date

from app.repositories.executive import executive_repository


class ExecutiveService:
    """Service responsible for Executive dashboard business logic."""

    def get_dashboard_data(
        self,
        start_date: date,
        end_date: date,
    ) -> dict:

        return executive_repository.get_kpis(
            start_date,
            end_date,
        )


executive_service = ExecutiveService()