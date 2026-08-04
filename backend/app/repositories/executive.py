from datetime import date

from app.database.session import get_db_session


class ExecutiveRepository:
    """Repository responsible for Executive dashboard queries."""

    def get_kpis(
        self,
        start_date: date,
        end_date: date,
    ) -> dict:

        connection = get_db_session()
        cursor = connection.cursor(dictionary=True)

        try:
            # Financial KPIs
            cursor.execute(
                """
                SELECT
                    COALESCE(SUM(dc.subtotal), 0) AS revenue,

                    COALESCE(
                        SUM(dc.subtotal)
                        - SUM(dc.cantidad * p.costo),
                        0
                    ) AS profit,

                    COALESCE(
                        (
                            (
                                SUM(dc.subtotal)
                                - SUM(dc.cantidad * p.costo)
                            )
                            / NULLIF(SUM(dc.subtotal), 0)
                        ) * 100,
                        0
                    ) AS margin

                FROM detalle_compra dc

                JOIN compra co
                    ON dc.id_compra = co.id_compra

                JOIN productos p
                    ON dc.id_producto = p.id_producto

                WHERE co.fecha >= %s
                AND co.fecha < DATE_ADD(%s, INTERVAL 1 DAY);
                """,
                (start_date, end_date),
            )

            financial = cursor.fetchone()

            # Orders & Customers
            cursor.execute(
                """
                SELECT
                    COUNT(*) AS orders,
                    COUNT(DISTINCT id_cliente) AS customers
                FROM compra
                WHERE fecha >= %s
                AND fecha < DATE_ADD(%s, INTERVAL 1 DAY);
                """,
                (start_date, end_date),
            )

            business = cursor.fetchone()

            # Average Order Value (AOV)
            cursor.execute(
                """
                SELECT
                    COALESCE(
                        SUM(dc.subtotal)
                        / NULLIF(COUNT(DISTINCT co.id_compra), 0),
                        0
                    ) AS aov

                FROM compra co

                JOIN detalle_compra dc
                    ON co.id_compra = dc.id_compra

                WHERE co.fecha >= %s
                AND co.fecha < DATE_ADD(%s, INTERVAL 1 DAY);
                """,
                (start_date, end_date),
            )

            aov = cursor.fetchone()

            return {
                "revenue": float(financial["revenue"]),
                "profit": float(financial["profit"]),
                "margin": float(financial["margin"]),
                "orders": int(business["orders"]),
                "customers": int(business["customers"]),
                "aov": float(aov["aov"]),
            }

        finally:
            cursor.close()
            connection.close()


executive_repository = ExecutiveRepository()