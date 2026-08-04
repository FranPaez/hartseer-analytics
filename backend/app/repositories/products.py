from datetime import date

from app.database.session import get_db_session


class ProductsRepository:
    """Repository responsible for Products dashboard queries."""

    def get_kpis(
        self,
        start_date: date,
        end_date: date,
        group_by: str,
    ) -> dict:

        if group_by == "category":
            dimension_name = "c.nombre"

            dimension_join = """
                JOIN categoria c
                    ON p.id_categoria = c.id_categoria
            """

            group_clause = """
                c.id_categoria,
                c.nombre
            """

        elif group_by == "brand":
            dimension_name = "COALESCE(m.nombre, 'No aplica')"

            dimension_join = """
                LEFT JOIN marca m
                    ON p.id_marca = m.id_marca
            """

            group_clause = """
                m.id_marca,
                m.nombre
            """

        elif group_by == "product":
            dimension_name = "p.nombre"

            dimension_join = ""

            group_clause = """
                p.id_producto,
                p.nombre
            """

        else:
            raise ValueError("Invalid group_by value.")

        connection = get_db_session()
        cursor = connection.cursor(dictionary=True)

        try:

            query = f"""
                SELECT
                    {dimension_name} AS dimension,

                    COALESCE(
                        SUM(dc.subtotal),
                        0
                    ) AS revenue,

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

                {dimension_join}

                WHERE co.fecha >= %s
                AND co.fecha < DATE_ADD(%s, INTERVAL 1 DAY)

                GROUP BY
                    {group_clause}

                ORDER BY revenue DESC;
            """

            cursor.execute(
                query,
                (start_date, end_date),
            )

            financial = [
                {
                    "dimension": row["dimension"],
                    "revenue": float(row["revenue"]),
                    "profit": float(row["profit"]),
                    "margin": float(row["margin"]),
                }
                for row in cursor.fetchall()
            ]

            top_revenue = max(
                financial,
                key=lambda row: row["revenue"],
            )

            top_profit = max(
                financial,
                key=lambda row: row["profit"],
            )

            top_margin = max(
                financial,
                key=lambda row: row["margin"],
            )

            cursor.execute(
                """
                SELECT
                    p.nombre AS product,
                    SUM(dc.cantidad) AS units_sold

                FROM detalle_compra dc

                JOIN compra co
                    ON dc.id_compra = co.id_compra

                JOIN productos p
                    ON dc.id_producto = p.id_producto

                WHERE co.fecha >= %s
                AND co.fecha < DATE_ADD(%s, INTERVAL 1 DAY)

                GROUP BY
                    p.id_producto,
                    p.nombre

                ORDER BY units_sold DESC

                LIMIT 1;
                """,
                (start_date, end_date),
            )

            top_sales = cursor.fetchone()

            return {
                "top_revenue": top_revenue,
                "top_profit": top_profit,
                "top_margin": top_margin,
                "top_sales": {
                    "product": top_sales["product"],
                    "units_sold": int(top_sales["units_sold"]),
                },
                "financial": financial,
            }

        finally:
            cursor.close()
            connection.close()


products_repository = ProductsRepository()