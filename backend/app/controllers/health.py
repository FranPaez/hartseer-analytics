from app.core.responses import success_response
from app.services.health import health_service


class HealthController:
    """Controller responsible for health endpoints."""

    def get_health(self):
        data = health_service.get_health_status()

        return success_response(data)


health_controller = HealthController()