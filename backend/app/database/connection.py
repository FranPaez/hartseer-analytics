import mysql.connector
from mysql.connector import MySQLConnection
from mysql.connector.pooling import MySQLConnectionPool

from app.core.config import settings


class DatabaseConnection:
    """Manage the application's MySQL connection pool."""

    def __init__(self) -> None:
        self._pool = MySQLConnectionPool(
            pool_name="hartseer_pool",
            pool_size=10,
            host=settings.DB_HOST,
            port=settings.DB_PORT,
            database=settings.DB_NAME,
            user=settings.DB_USER,
            password=settings.DB_PASSWORD,
        )

    def get_connection(self) -> MySQLConnection:
        """Return an available database connection."""

        return self._pool.get_connection()


database = DatabaseConnection()