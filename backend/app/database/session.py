from collections.abc import Iterator
from contextlib import contextmanager

from mysql.connector import MySQLConnection
from mysql.connector.cursor import MySQLCursorDict
from mysql.connector.pooling import PooledMySQLConnection

from app.database.connection import database


def get_db_session() -> MySQLConnection | PooledMySQLConnection:
    """Return a pooled or short-lived database connection."""
    return database.get_connection()


@contextmanager
def get_db_connection() -> Iterator[MySQLConnection | PooledMySQLConnection]:
    """Always close or return a connection to the pool, including on errors."""
    connection = get_db_session()
    try:
        yield connection
    finally:
        connection.close()


@contextmanager
def get_db_cursor() -> Iterator[MySQLCursorDict]:
    """Share cursor cleanup and release the connection if cursor setup fails."""
    with get_db_connection() as connection:
        cursor = connection.cursor(dictionary=True)
        try:
            yield cursor
        finally:
            cursor.close()
