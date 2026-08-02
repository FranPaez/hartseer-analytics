from app.core.responses import success_response
from app.services.executive import executive_service


class ExecutiveController:
    """Controller responsible for Executive dashboard endpoints."""

    def get_dashboard(self):
        data = executive_service.get_dashboard_data()

        return success_response(data)


executive_controller = ExecutiveController()