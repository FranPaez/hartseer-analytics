class HealthService:
    """Service responsible for application health checks."""

    def get_health_status(self) -> dict:
        return {
            "status": "ok"
        }


health_service = HealthService()