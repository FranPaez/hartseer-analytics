from app.database.session import get_db_connection


class HealthService:
    """Service responsible for application health checks."""

    def get_health_status(self) -> dict:
        database_status = "disconnected"

        try:
            with get_db_connection() as connection:
                if connection.is_connected():
                    database_status = "connected"
        except Exception:
            database_status = "disconnected"

        return {"status": "ok", "database": database_status}


health_service = HealthService()
