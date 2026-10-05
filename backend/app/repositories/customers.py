from datetime import date
from heapq import nlargest

from app.database.session import get_db_cursor


class CustomersRepository:
    """Repository responsible for Customers dashboard queries."""

    def get_kpis(
        self,
        start_date: date,
        end_date: date,
    ) -> dict:


        with get_db_cursor() as cursor:

            # New Customers

            cursor.execute(
                """
                SELECT
                    COUNT(*) AS new_customers

                FROM (
                    SELECT
                        id_cliente,
                        MIN(fecha) AS first_purchase_date

                    FROM compra

                    GROUP BY
                        id_cliente
                ) AS first_purchases

                WHERE first_purchase_date >= %s
                AND first_purchase_date < DATE_ADD(
                    %s,
                    INTERVAL 1 DAY
                );
                """,
                (start_date, end_date),
            )

            new_customers = cursor.fetchone()

            # Aggregate purchase counts in SQL instead of transferring every customer.
            cursor.execute(
                """
                SELECT
                    COUNT(*) AS total_customers,
                    COALESCE(SUM(purchase_count > 1), 0) AS returning_customers,
                    COALESCE(SUM(purchase_count), 0) AS total_orders
                FROM (
                    SELECT id_cliente, COUNT(*) AS purchase_count
                    FROM compra
                    WHERE fecha >= %s
                    AND fecha < DATE_ADD(%s, INTERVAL 1 DAY)
                    GROUP BY id_cliente
                ) AS customer_purchases;
                """,
                (start_date, end_date),
            )

            purchase_summary = cursor.fetchone()
            returning_customers = int(purchase_summary["returning_customers"])
            total_customers = int(purchase_summary["total_customers"])
            recurrence_rate = (
                (returning_customers / total_customers) * 100
                if total_customers > 0
                else 0
            )

            # Customer Financial Performance

            cursor.execute(
                """
                SELECT
                    CONCAT(
                        cl.nombre,
                        ' ',
                        cl.apellido
                    ) AS customer,

                    COALESCE(
                        SUM(dc.subtotal),
                        0
                    ) AS revenue,

                    COALESCE(
                        SUM(dc.subtotal)
                        - SUM(dc.cantidad * p.costo),
                        0
                    ) AS profit

                FROM compra co

                JOIN cliente cl
                    ON co.id_cliente = cl.id_cliente

                JOIN detalle_compra dc
                    ON co.id_compra = dc.id_compra

                JOIN productos p
                    ON dc.id_producto = p.id_producto

                WHERE co.fecha >= %s
                AND co.fecha < DATE_ADD(%s, INTERVAL 1 DAY)

                GROUP BY
                    cl.id_cliente,
                    cl.nombre,
                    cl.apellido;
                """,
                (start_date, end_date),
            )

            financial = [
                {
                    "customer": row["customer"],
                    "revenue": float(row["revenue"]),
                    "profit": float(row["profit"]),
                }
                for row in cursor.fetchall()
            ]

            # Keep only the five highest rows while preserving tie order.
            revenue_ranking = nlargest(5, financial, key=lambda row: row["revenue"])
            profit_ranking = nlargest(5, financial, key=lambda row: row["profit"])
            empty_customer = {"customer": "No data", "revenue": 0, "profit": 0}
            top_revenue = revenue_ranking[0] if revenue_ranking else empty_customer
            top_profit = profit_ranking[0] if profit_ranking else empty_customer

            return {
                "new_customers": new_customers["new_customers"],
                "returning_customers": returning_customers,
                "total_orders": int(purchase_summary["total_orders"]),
                "recurrence_rate": round(
                    recurrence_rate,
                    2,
                ),
                "top_revenue": top_revenue,
                "top_profit": top_profit,
                "revenue_ranking": revenue_ranking,
                "profit_ranking": profit_ranking,
            }


customers_repository = CustomersRepository()
