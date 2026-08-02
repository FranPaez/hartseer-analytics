from app.repositories.executive import executive_repository


class ExecutiveService:
    """Service responsible for Executive dashboard business logic."""

    def get_dashboard_data(self) -> dict:
        return {}


executive_service = ExecutiveService()