from app.database.session import get_db_session


class HealthService:
    """Service responsible for application health checks."""

    def get_health_status(self) -> dict:
        database_status = "disconnected"

        try:
            connection = get_db_session()

            if connection.is_connected():
                database_status = "connected"

            connection.close()

        except Exception:
            database_status = "disconnected"

        return {
            "status": "ok",
            "database": database_status,
        }


health_service = HealthService()