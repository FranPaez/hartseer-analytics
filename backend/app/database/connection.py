from threading import Lock
from time import sleep

from mysql.connector import Error, MySQLConnection, connect
from mysql.connector.pooling import MySQLConnectionPool, PooledMySQLConnection

from app.core.config import settings


class DatabaseUnavailableError(Exception):
    """Database connectivity could not be recovered within the retry limit."""


class DatabaseConnection:
    """Open MySQL connections on demand so API startup tolerates cold databases."""

    def __init__(self) -> None:
        self._pool: MySQLConnectionPool | None = None
        self._pool_lock = Lock()

    def _connection_options(self) -> dict:
        return {
            "host": settings.DB_HOST,
            "port": settings.DB_PORT,
            "database": settings.DB_NAME,
            "user": settings.DB_USER,
            "password": settings.DB_PASSWORD,
            "connection_timeout": settings.DB_CONNECT_TIMEOUT,
        }

    def get_connection(self) -> MySQLConnection | PooledMySQLConnection:
        """Retry cold starts; optionally close physical connections when idle."""
        for attempt in range(settings.DB_CONNECT_RETRIES):
            try:
                if not settings.DB_USE_POOL:
                    return connect(**self._connection_options())

                if self._pool is None:
                    with self._pool_lock:
                        if self._pool is None:
                            self._pool = MySQLConnectionPool(
                                pool_name="hartseer_pool",
                                pool_size=10,
                                **self._connection_options(),
                            )
                return self._pool.get_connection()
            except Error as error:
                retryable = error.errno in {2002, 2003, 2005, 2006, 2013, 2055}
                if not retryable or attempt + 1 == settings.DB_CONNECT_RETRIES:
                    raise DatabaseUnavailableError("Database unavailable") from error
                sleep(settings.DB_CONNECT_RETRY_DELAY)

        raise DatabaseUnavailableError("Database unavailable")


database = DatabaseConnection()
