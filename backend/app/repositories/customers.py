from datetime import date

from app.database.session import get_db_session


class CustomersRepository:
    """Repository responsible for Customers dashboard queries."""

    def get_kpis(
        self,
        start_date: date,
        end_date: date,
    ) -> dict:

        connection = get_db_session()
        cursor = connection.cursor(dictionary=True)

        try:

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

            # Returning Customers & Recurrence Rate

            cursor.execute(
                """
                SELECT
                    id_cliente,
                    COUNT(*) AS purchase_count
                FROM compra
                WHERE fecha >= %s
                AND fecha < DATE_ADD(%s, INTERVAL 1 DAY)
                GROUP BY id_cliente;
                """,
                (start_date, end_date),
            )

            customers = cursor.fetchall()

            returning_customers = sum(
                1
                for customer in customers
                if customer["purchase_count"] > 1
            )

            total_customers = len(customers)

            recurrence_rate = (
                (returning_customers / total_customers) * 100
                if total_customers > 0
                else 0
            )

            # Total Orders

            cursor.execute(
                """
                SELECT
                    COUNT(id_compra) AS total_orders
                FROM compra
                WHERE fecha >= %s
                AND fecha < DATE_ADD(%s, INTERVAL 1 DAY);
                """,
                (start_date, end_date),
            )

            total_orders = cursor.fetchone()

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

            top_revenue = max(
                financial,
                key=lambda row: row["revenue"],
            ) if financial else {
                "customer": "No data",
                "revenue": 0,
                "profit": 0,
            }

            top_profit = max(
                financial,
                key=lambda row: row["profit"],
            ) if financial else {
                "customer": "No data",
                "revenue": 0,
                "profit": 0,
            }

            # Customer Rankings

            revenue_ranking = sorted(
                financial,
                key=lambda row: row["revenue"],
                reverse=True,
            )[:5]

            profit_ranking = sorted(
                financial,
                key=lambda row: row["profit"],
                reverse=True,
            )[:5]

            return {
                "new_customers": new_customers["new_customers"],
                "returning_customers": returning_customers,
                "total_orders": total_orders["total_orders"],
                "recurrence_rate": round(
                    recurrence_rate,
                    2,
                ),
                "top_revenue": top_revenue,
                "top_profit": top_profit,
                "revenue_ranking": revenue_ranking,
                "profit_ranking": profit_ranking,
            }

        finally:
            cursor.close()
            connection.close()


customers_repository = CustomersRepository()