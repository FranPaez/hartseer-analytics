from mysql.connector import MySQLConnection

from app.database.connection import database


def get_db_session() -> MySQLConnection:
    """
    Return a database connection from the connection pool.
    """

    return database.get_connection()