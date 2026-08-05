from datetime import date

from app.database.session import get_db_session


class MarketingRepository:
    """Repository responsible for Marketing dashboard queries."""

    def get_kpis(
        self,
        start_date: date,
        end_date: date,
        channel: str,
    ) -> dict:

        connection = get_db_session()
        cursor = connection.cursor(dictionary=True)

        channel_mapping = {
            "Tienda": 1,
            "Instagram": 2,
            "Mercado Libre": 3,
            "Página Web": 4,
            "Facebook": 5,
        }

        try:

            # Financial KPIs

            query = """
                SELECT

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
                            /
                            NULLIF(SUM(dc.subtotal), 0)
                        ) * 100,
                        0
                    ) AS margin

                FROM compra co

                JOIN detalle_compra dc
                    ON co.id_compra = dc.id_compra

                JOIN productos p
                    ON dc.id_producto = p.id_producto

                JOIN canal c
                    ON co.id_canal = c.id_canal

                WHERE
                    co.fecha >= %s

                AND
                    co.fecha < DATE_ADD(%s, INTERVAL 1 DAY)
            """

            params = [
                start_date,
                end_date,
            ]

            if channel != "ALL":

                query += """
                    AND c.id_canal = %s
                """

                params.append(channel_mapping[channel])

            cursor.execute(
                query,
                tuple(params),
            )

            financial = cursor.fetchone()

            # Marketing Cost

            query = """
                SELECT

                    COALESCE(
                        SUM(cp.monto),
                        0
                    ) AS marketing_cost

                FROM costos_publicitarios cp

                JOIN canal c
                    ON cp.id_canal = c.id_canal

                WHERE

                    cp.fecha >= DATE_FORMAT(%s, '%Y-%m-01')

                AND

                    cp.fecha < DATE_ADD(
                        DATE_FORMAT(%s, '%Y-%m-01'),
                        INTERVAL 1 MONTH
                    )
            """

            params = [
                start_date,
                end_date,
            ]

            if channel != "ALL":

                query += """
                    AND c.id_canal = %s
                """

                params.append(channel_mapping[channel])

            cursor.execute(
                query,
                tuple(params),
            )

            marketing = cursor.fetchone()

            revenue = float(financial["revenue"])
            profit = float(financial["profit"])
            margin = float(financial["margin"])

            if channel == "Tienda":

                marketing_cost = 0.0
                roas = 0.0

            else:

                marketing_cost = float(
                    marketing["marketing_cost"]
                )

                roas = (
                    revenue / marketing_cost
                    if marketing_cost > 0
                    else 0
                )

            net_profit = (
                profit
                - marketing_cost
            )

            

            # Trend Charts
            cursor.execute(
                """
                SELECT
                    DATE_FORMAT(co.fecha, '%Y-%m') AS period,

                    c.id_canal,
                    c.nombre AS channel,

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

                JOIN detalle_compra dc
                    ON co.id_compra = dc.id_compra

                JOIN productos p
                    ON dc.id_producto = p.id_producto

                JOIN canal c
                    ON co.id_canal = c.id_canal

                WHERE
                    co.fecha >= %s

                AND
                    co.fecha < DATE_ADD(%s, INTERVAL 1 DAY)

                GROUP BY
                    DATE_FORMAT(co.fecha, '%Y-%m'),
                    c.id_canal,
                    c.nombre

                ORDER BY
                    period,
                    c.id_canal;
                """,
                (start_date, end_date),
            )

            trends = []

            for row in cursor.fetchall():

                marketing_cost = 0.0
                roas = 0.0

                if row["id_canal"] != 1:

                    cursor.execute(
                        """
                        SELECT
                            COALESCE(
                                SUM(cp.monto),
                                0
                            ) AS marketing_cost

                        FROM costos_publicitarios cp

                        WHERE
                            cp.id_canal = %s

                        AND
                            DATE_FORMAT(cp.fecha, '%Y-%m')
                            = %s;
                        """,
                        (
                            row["id_canal"],
                            row["period"],
                        ),
                    )

                    marketing = cursor.fetchone()

                    marketing_cost = float(
                        marketing["marketing_cost"]
                    )

                    roas = (
                        float(row["revenue"])
                        / marketing_cost
                        if marketing_cost > 0
                        else 0
                    )

                trends.append(
                    {
                        "period": row["period"],
                        "channel": row["channel"],
                        "revenue": float(row["revenue"]),
                        "profit": float(row["profit"]),
                        "marketing_cost": marketing_cost,
                        "roas": round(roas, 2),
                    }
                )

            return {
                "revenue": revenue,
                "profit": profit,
                "margin": margin,
                "marketing_cost": marketing_cost,
                "roas": round(roas, 2),
                "net_profit": net_profit,
                "trends": trends,
            }

        finally:
            cursor.close()
            connection.close()


marketing_repository = MarketingRepository()