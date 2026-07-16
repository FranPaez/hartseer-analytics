"""Exporta las vistas analíticas de MySQL a archivos JSON."""

from __future__ import annotations

import json
import os
from datetime import date, datetime
from decimal import Decimal
from pathlib import Path
from typing import Any

import mysql.connector
from dotenv import load_dotenv
from mysql.connector import Error, MySQLConnection


# -- PATH CONFIGURATION --

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIRECTORY = PROJECT_ROOT / "data"
ENV_FILE = PROJECT_ROOT / ".env"

SALES_OUTPUT = DATA_DIRECTORY / "sales.json"
MARKETING_COSTS_OUTPUT = DATA_DIRECTORY / "marketing-costs.json"


# -- ENVIRONMENT CONFIGURATION --

load_dotenv(ENV_FILE)

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", "3306")),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD", ""),
    "database": os.getenv(
        "DB_NAME",
        "hartseer_analytics_db"
    )
}


# -- DATABASE QUERIES --

EXPORTS = [
    {
        "view": "vw_sales_analytics",
        "output": SALES_OUTPUT
    },
    {
        "view": "vw_marketing_costs",
        "output": MARKETING_COSTS_OUTPUT
    }
]


# -- JSON SERIALIZATION --

def serialize_value(value: Any) -> Any:
    """Convierte tipos de MySQL en valores compatibles con JSON."""

    if isinstance(value, Decimal):
        return float(value)

    if isinstance(value, (datetime, date)):
        return value.isoformat()

    if isinstance(value, bytes):
        return value.decode("utf-8")

    return value


def serialize_row(row: dict[str, Any]) -> dict[str, Any]:
    """Convierte todos los valores de una fila."""

    return {
        column: serialize_value(value)
        for column, value in row.items()
    }


# -- DATABASE CONNECTION --

def create_connection() -> MySQLConnection:
    """Crea y devuelve una conexión con MySQL."""

    return mysql.connector.connect(**DB_CONFIG)


# -- DATA EXTRACTION --

def fetch_view_data(
    connection: MySQLConnection,
    view_name: str
) -> list[dict[str, Any]]:
    """Extrae todos los registros de una vista."""

    query = f"SELECT * FROM `{view_name}`"

    cursor = connection.cursor(dictionary=True)

    try:
        cursor.execute(query)
        rows = cursor.fetchall()

        return [
            serialize_row(row)
            for row in rows
        ]
    finally:
        cursor.close()


# -- JSON EXPORT --

def write_json(
    output_path: Path,
    records: list[dict[str, Any]]
) -> None:
    """Guarda los registros en un archivo JSON."""

    output_path.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    with output_path.open(
        mode="w",
        encoding="utf-8"
    ) as json_file:
        json.dump(
            records,
            json_file,
            ensure_ascii=False,
            indent=2
        )


def export_view(
    connection: MySQLConnection,
    view_name: str,
    output_path: Path
) -> None:
    """Extrae una vista y genera su archivo JSON."""

    records = fetch_view_data(
        connection,
        view_name
    )

    write_json(
        output_path,
        records
    )

    print(
        f"Exportación completada: "
        f"{view_name} → {output_path.name} "
        f"({len(records)} registros)"
    )


# -- APPLICATION EXECUTION --

def main() -> None:
    """Ejecuta todas las exportaciones configuradas."""

    connection: MySQLConnection | None = None

    try:
        connection = create_connection()

        if not connection.is_connected():
            raise ConnectionError(
                "No fue posible establecer la conexión con MySQL."
            )

        print(
            "Conexión establecida con "
            f"{DB_CONFIG['database']}."
        )

        for export_config in EXPORTS:
            export_view(
                connection,
                export_config["view"],
                export_config["output"]
            )

        print("Todos los archivos JSON fueron generados.")

    except (Error, OSError, ValueError, ConnectionError) as error:
        print(f"Error durante la exportación: {error}")
        raise SystemExit(1) from error

    finally:
        if (
            connection is not None
            and connection.is_connected()
        ):
            connection.close()
            print("Conexión con MySQL cerrada.")


if __name__ == "__main__":
    main()