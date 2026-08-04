from datetime import date

from app.core.responses import success_response
from app.services.executive import executive_service


class ExecutiveController:
    """Controller responsible for Executive dashboard endpoints."""

    def get_dashboard(
        self,
        start_date: date,
        end_date: date,
    ):
        data = executive_service.get_dashboard_data(
            start_date,
            end_date,
        )

        return success_response(data)


executive_controller = ExecutiveController()