from mysql.connector import MySQLConnection

from app.database.session import get_db_session


class ExecutiveRepository:
    """Repository responsible for Executive dashboard queries."""

    def __init__(self) -> None:
        self._connection: MySQLConnection = get_db_session()

    def close(self) -> None:
        """Close the current database connection."""

        if self._connection.is_connected():
            self._connection.close()


executive_repository = ExecutiveRepository()