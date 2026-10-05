"""Offline regression checks: no MySQL server or extra test dependency required.

Run: python tests/test_regressions.py
The SQLite adapter executes analytical SQL against deterministic retail fixtures.
MySQL date functions are translated; live MySQL execution remains a separate check.
"""
import asyncio
from concurrent.futures import ThreadPoolExecutor
from datetime import date, datetime, timedelta
import importlib
import json
from pathlib import Path
import random
import re
import sqlite3
import sys
import unittest
from unittest.mock import Mock, patch
from urllib.parse import urlencode


if "--snapshot" in sys.argv:
    BACKEND = Path(sys.argv[sys.argv.index("--snapshot") + 1]) / "backend"
else:
    BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))


class Cursor:
    def __init__(self, connection):
        self.connection = connection
        self.cursor = connection.fixture.db.cursor()
        self.closed = False

    def execute(self, query, params):
        self.connection.queries.append(query)
        query = query.replace("%s", "?")
        query = re.sub(
            r"DATE_ADD\(\s*(DATE_FORMAT\(\?,\s*'[^']+'\))\s*,\s*INTERVAL 1 MONTH\s*\)",
            r"ADD_MONTH(\1)", query,
        )
        query = re.sub(r"DATE_ADD\(\s*\?,\s*INTERVAL 1 DAY\s*\)", "ADD_DAY(?)", query)
        self.cursor.execute(query, tuple(str(p) if isinstance(p, date) else p for p in params))

    def fetchone(self):
        row = self.cursor.fetchone()
        return dict(row) if row else None

    def fetchall(self):
        return [dict(row) for row in self.cursor.fetchall()]

    def close(self):
        self.closed = True
        self.cursor.close()


class Connection:
    def __init__(self, fixture):
        self.fixture = fixture
        self.queries = []
        self.closed = False
        self.last_cursor = None

    def cursor(self, dictionary=True):
        self.last_cursor = Cursor(self)
        return self.last_cursor

    def close(self):
        self.closed = True

    def is_connected(self):
        return True


class Fixture:
    def __init__(self):
        self.db = sqlite3.connect(":memory:", check_same_thread=False)
        self.db.row_factory = sqlite3.Row
        self.connections = []
        self.db.create_function("DATE_FORMAT", 2, lambda value, fmt: datetime.fromisoformat(value).strftime(fmt))
        self.db.create_function("ADD_DAY", 1, lambda value: (date.fromisoformat(value) + timedelta(days=1)).isoformat())
        self.db.create_function("ADD_MONTH", 1, lambda value: date(date.fromisoformat(value).year + (date.fromisoformat(value).month == 12), date.fromisoformat(value).month % 12 + 1, 1).isoformat())
        self.db.create_function("CONCAT", -1, lambda *values: "".join(str(v) for v in values) if all(v is not None for v in values) else None)
        self.db.executescript("""
            CREATE TABLE compra (id_compra INTEGER PRIMARY KEY, id_cliente INTEGER, id_canal INTEGER, fecha TEXT);
            CREATE TABLE detalle_compra (id_compra INTEGER, id_producto INTEGER, cantidad INTEGER, subtotal REAL);
            CREATE TABLE productos (id_producto INTEGER PRIMARY KEY, nombre TEXT, costo REAL, id_categoria INTEGER, id_marca INTEGER);
            CREATE TABLE cliente (id_cliente INTEGER PRIMARY KEY, nombre TEXT, apellido TEXT);
            CREATE TABLE canal (id_canal INTEGER PRIMARY KEY, nombre TEXT);
            CREATE TABLE categoria (id_categoria INTEGER PRIMARY KEY, nombre TEXT);
            CREATE TABLE marca (id_marca INTEGER PRIMARY KEY, nombre TEXT);
            CREATE TABLE costos_publicitarios (id_canal INTEGER, fecha TEXT, monto REAL);
        """)
        self.db.executemany("INSERT INTO canal VALUES (?, ?)", enumerate(["Tienda", "Instagram", "Mercado Libre", "Página Web", "Facebook"], 1))
        self.db.executemany("INSERT INTO categoria VALUES (?, ?)", [(1, "Home"), (2, "Tech")])
        self.db.executemany("INSERT INTO marca VALUES (?, ?)", [(1, "A"), (2, "B")])
        self.db.executemany("INSERT INTO productos VALUES (?, ?, ?, ?, ?)", [(i, f"Product {i}", float(i * 2), 1 + i % 2, None if i == 4 else 1 + i % 2) for i in range(1, 9)])
        self.db.executemany("INSERT INTO cliente VALUES (?, ?, ?)", [(i, f"Customer {i}", "Test") for i in range(1, 13)])
        rng = random.Random(42)
        for order in range(1, 181):
            month = 1 + (order - 1) // 30
            day = 1 + (order - 1) % 28
            self.db.execute("INSERT INTO compra VALUES (?, ?, ?, ?)", (order, rng.randint(1, 12), 1 + order % 5, f"2026-{month:02d}-{day:02d} 23:59:59"))
            for item in rng.sample(range(1, 9), rng.randint(1, 3)):
                quantity = rng.randint(1, 4)
                self.db.execute("INSERT INTO detalle_compra VALUES (?, ?, ?, ?)", (order, item, quantity, float(item * quantity * 5)))
        # An order without detail lines preserves the separate business/AOV semantics.
        self.db.execute("INSERT INTO compra VALUES (999, 1, 1, '2026-06-28 12:00:00')")
        for month in range(1, 7):
            for channel in range(1, 6):
                if (month, channel) == (3, 4):
                    continue  # Missing spend must produce zero.
                for day in (1, 16):
                    self.db.execute("INSERT INTO costos_publicitarios VALUES (?, ?, ?)", (channel, f"2026-{month:02d}-{day:02d}", float(month * channel * 10)))

    def get_connection(self):
        connection = Connection(self)
        self.connections.append(connection)
        return connection


fixture = Fixture()
pool = Mock()
pool.get_connection.side_effect = lambda: fixture.get_connection()
with patch("mysql.connector.pooling.MySQLConnectionPool", return_value=pool), patch("dotenv.load_dotenv", return_value=False):
    repositories = {name: importlib.import_module(f"app.repositories.{name}") for name in ("executive", "products", "customers", "marketing")}
    session = importlib.import_module("app.database.session")
    health = importlib.import_module("app.services.health")
    app = importlib.import_module("app.main").app


def kpis(name, start="2026-01-01", end="2026-06-28", extra=None):
    args = [date.fromisoformat(start), date.fromisoformat(end)]
    if extra is not None:
        args.append(extra)
    return getattr(repositories[name], f"{name}_repository").get_kpis(*args)


async def request(path, params):
    messages = []

    async def receive():
        return {"type": "http.request", "body": b"", "more_body": False}

    async def send(message):
        messages.append(message)

    await app({"type": "http", "asgi": {"version": "3.0"}, "http_version": "1.1", "method": "GET", "scheme": "http", "path": path, "raw_path": path.encode(), "query_string": urlencode(params).encode(), "headers": [], "client": ("127.0.0.1", 1234), "server": ("test", 80), "root_path": ""}, receive, send)
    status = next(m["status"] for m in messages if m["type"] == "http.response.start")
    body = b"".join(m.get("body", b"") for m in messages if m["type"] == "http.response.body")
    return status, json.loads(body)


class RegressionTests(unittest.TestCase):
    def setUp(self):
        global fixture
        fixture = Fixture()

    def tearDown(self):
        fixture.db.close()

    def test_all_routes_keep_response_contract(self):
        for name, extra in [("executive", {}), ("customers", {}), ("products", {"group_by": "category"}), ("marketing", {"channel": "ALL"})]:
            with self.subTest(name=name):
                status, body = asyncio.run(request(f"/api/v1/{name}", {"start_date": "2026-01-01", "end_date": "2026-06-28", **extra}))
                self.assertEqual(status, 200)
                self.assertTrue(body["success"])
                self.assertEqual(body["meta"]["api_version"], "1.0.0")
                self.assertIn("timestamp", body["meta"])
                schema = getattr(importlib.import_module(f"app.schemas.{name}"), f"{name.title()}ResponseSchema")
                schema.model_validate(body)

    def test_health_route(self):
        status, body = asyncio.run(request("/api/v1/health", {}))
        self.assertEqual(status, 200)
        self.assertEqual(body["data"], {"status": "ok", "database": "connected"})

    def test_invalid_or_missing_dates(self):
        for params in ({}, {"start_date": "bad", "end_date": "2026-06-28"}):
            status, _ = asyncio.run(request("/api/v1/executive", params))
            self.assertEqual(status, 422)

    def test_product_groupings(self):
        for grouping, count in [("category", 2), ("brand", 3), ("product", 8)]:
            data = kpis("products", extra=grouping)
            self.assertEqual(len(data["financial"]), count)
            self.assertEqual(data["top_revenue"]["revenue"], max(row["revenue"] for row in data["financial"]))

    def test_end_date_includes_late_orders(self):
        data = kpis("executive", "2026-06-28", "2026-06-28")
        self.assertGreater(data["orders"], 0)
        self.assertGreater(data["revenue"], 0)

    def test_empty_executive_and_customers(self):
        for name in ("executive", "customers"):
            data = kpis(name, "2025-01-01", "2025-01-31")
            self.assertEqual(data["revenue"] if name == "executive" else data["total_orders"], 0)

    def test_customers_query_count_and_counts(self):
        data = kpis("customers")
        self.assertEqual(data["total_orders"], 181)
        self.assertEqual(data["returning_customers"], 12)
        self.assertEqual(data["recurrence_rate"], 100)
        self.assertEqual(len(fixture.connections[-1].queries), 3)

    def test_marketing_queries_are_bounded(self):
        for channel in ("ALL", "Tienda", "Instagram", "Mercado Libre", "Página Web", "Facebook"):
            kpis("marketing", extra=channel)
            self.assertLessEqual(len(fixture.connections[-1].queries), 4)

    def test_marketing_kpis_use_whole_selected_period(self):
        for channel, channel_id in [("ALL", None), ("Tienda", 1), ("Instagram", 2), ("Mercado Libre", 3), ("Página Web", 4), ("Facebook", 5)]:
            data = kpis("marketing", extra=channel)
            cost = fixture.db.execute("SELECT COALESCE(SUM(monto), 0) FROM costos_publicitarios" + (" WHERE id_canal = ?" if channel_id else ""), (channel_id,) if channel_id else ()).fetchone()[0]
            expected_cost = 0 if channel_id == 1 else cost
            self.assertEqual(data["marketing_cost"], expected_cost)
            self.assertEqual(data["roas"], round(data["revenue"] / expected_cost, 2) if expected_cost else 0)
            self.assertEqual(data["net_profit"], data["profit"] - expected_cost)

    def test_marketing_trends_keep_all_channels(self):
        all_data = kpis("marketing", extra="ALL")
        selected_data = kpis("marketing", extra="Instagram")
        self.assertEqual(all_data["trends"], selected_data["trends"])
        self.assertEqual(len(all_data["trends"]), 30)
        for trend in all_data["trends"]:
            if trend["channel"] == "Tienda" or (trend["period"], trend["channel"]) == ("2026-03", "Página Web"):
                self.assertEqual(trend["marketing_cost"], 0)
                self.assertEqual(trend["roas"], 0)

    def test_partial_month_keeps_whole_month_spend(self):
        data = kpis("marketing", "2026-03-10", "2026-03-12", "Instagram")
        self.assertEqual(data["marketing_cost"], 120)

    def test_resources_close_after_success(self):
        for name, extra in [("executive", None), ("products", "category"), ("customers", None), ("marketing", "ALL")]:
            kpis(name, extra=extra)
            connection = fixture.connections[-1]
            self.assertTrue(connection.closed)
            self.assertTrue(connection.last_cursor.closed)

    def test_connection_closes_when_cursor_creation_fails(self):
        connection = Mock()
        connection.cursor.side_effect = RuntimeError("cursor setup")
        with patch.object(session, "get_db_session", return_value=connection):
            with self.assertRaises(RuntimeError):
                with session.get_db_cursor():
                    pass
        connection.close.assert_called_once()

    def test_connection_closes_when_cursor_close_fails(self):
        connection = Mock()
        connection.cursor.return_value.close.side_effect = RuntimeError("cursor cleanup")
        with patch.object(session, "get_db_session", return_value=connection):
            with self.assertRaises(RuntimeError):
                with session.get_db_cursor():
                    pass
        connection.close.assert_called_once()

    def test_resources_close_when_query_fails(self):
        connection = Mock()
        connection.cursor.return_value.execute.side_effect = RuntimeError("query")
        with patch.object(session, "get_db_session", return_value=connection):
            with self.assertRaises(RuntimeError):
                kpis("executive")
        connection.cursor.return_value.close.assert_called_once()
        connection.close.assert_called_once()

    def test_health_releases_connection_on_failure(self):
        connection = Mock()
        connection.is_connected.side_effect = RuntimeError("health")
        with patch.object(session, "get_db_session", return_value=connection):
            self.assertEqual(health.health_service.get_health_status()["database"], "disconnected")
        connection.close.assert_called_once()

    def test_ranking_ties_preserve_order(self):
        fixture.db.execute("DELETE FROM compra")
        fixture.db.execute("DELETE FROM detalle_compra")
        for customer in range(1, 13):
            fixture.db.execute("INSERT INTO compra VALUES (?, ?, 1, '2026-06-01')", (customer, customer))
            fixture.db.execute("INSERT INTO detalle_compra VALUES (?, 1, 1, 100.0)", (customer,))
        data = kpis("customers")
        self.assertEqual(data["revenue_ranking"], data["profit_ranking"])
        self.assertEqual([row["customer"] for row in data["revenue_ranking"]], [f"Customer {i} Test" for i in range(1, 6)])

    def test_response_metadata_and_overrides(self):
        from app.core.responses import success_response

        supplied_meta = {"api_version": "custom", "source": "fixture"}
        response = success_response({"metric": 1}, supplied_meta, 201)
        body = json.loads(response.body)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(body["data"], {"metric": 1})
        self.assertEqual(body["meta"]["api_version"], "custom")
        self.assertIsNone(datetime.fromisoformat(body["meta"]["timestamp"]).tzinfo)
        self.assertEqual(supplied_meta, {"api_version": "custom", "source": "fixture"})

    def test_error_response_contract(self):
        from app.core.responses import error_response

        response = error_response("test", "message", 400, {"field": "date"}, {"source": "fixture"})
        body = json.loads(response.body)
        self.assertEqual(response.status_code, 400)
        self.assertFalse(body["success"])
        self.assertEqual(body["error"], {"code": "test", "message": "message", "details": {"field": "date"}})
        self.assertEqual(body["meta"]["source"], "fixture")

    def test_invalid_product_group_does_not_borrow_connection(self):
        with self.assertRaises(ValueError):
            kpis("products", extra="invalid")
        self.assertEqual(fixture.connections, [])

    def test_api_startup_does_not_open_database_connections(self):
        module = importlib.import_module("app.database.connection")
        with patch.object(module, "MySQLConnectionPool") as factory:
            connection = module.DatabaseConnection()
            self.assertIsNone(connection._pool)
            factory.assert_not_called()

    def test_lazy_pool_is_created_once_for_concurrent_requests(self):
        module = importlib.import_module("app.database.connection")
        with patch.object(module, "MySQLConnectionPool") as factory:
            connection = module.DatabaseConnection()
            with ThreadPoolExecutor(max_workers=8) as executor:
                list(executor.map(lambda _: connection.get_connection(), range(8)))
            factory.assert_called_once()
            self.assertEqual(factory.return_value.get_connection.call_count, 8)

    def test_sleep_friendly_connections_close_physical_sockets(self):
        module = importlib.import_module("app.database.connection")
        raw_connection = Mock()
        with patch.object(module.settings, "DB_USE_POOL", False), patch.object(module, "connect", return_value=raw_connection) as connect:
            connection = module.DatabaseConnection()
            with patch.object(session, "get_db_session", side_effect=connection.get_connection):
                with session.get_db_connection():
                    pass
            connect.assert_called_once()
            raw_connection.close.assert_called_once()

    def test_database_cold_start_retries_then_recovers(self):
        module = importlib.import_module("app.database.connection")
        cold_start = module.Error("not ready", errno=2003)
        with patch.object(module, "MySQLConnectionPool", side_effect=[cold_start, Mock()]) as factory, patch.object(module, "sleep"):
            connection = module.DatabaseConnection()
            connection.get_connection()
            self.assertEqual(factory.call_count, 2)

    def test_exhausted_database_retries_return_safe_service_unavailable(self):
        module = importlib.import_module("app.database.connection")
        with patch.object(module, "MySQLConnectionPool", side_effect=module.Error("private details", errno=2003)), patch.object(module, "sleep"):
            connection = module.DatabaseConnection()
            with patch.object(session, "get_db_session", side_effect=connection.get_connection):
                status, body = asyncio.run(request("/api/v1/executive", {"start_date": "2026-01-01", "end_date": "2026-06-28"}))
            self.assertEqual(status, 503)
            self.assertEqual(body["error"]["code"], "DATABASE_UNAVAILABLE")
            self.assertNotIn("private details", json.dumps(body))


def snapshot():
    output = {}
    for start, end in [("2026-01-01", "2026-06-28"), ("2026-03-10", "2026-03-12"), ("2026-06-28", "2026-06-28"), ("2025-01-01", "2025-01-31")]:
        for name, extras in [("executive", [None]), ("customers", [None]), ("products", ["category", "brand", "product"]), ("marketing", ["ALL", "Tienda", "Instagram", "Mercado Libre", "Página Web", "Facebook"])]:
            if name == "products" and start.startswith("2025"):
                continue  # Existing empty-products behavior is outside this refactor.
            for extra in extras:
                key = f"{name}/{start}/{end}/{extra}"
                data = kpis(name, start, end, extra)
                # The original Marketing loop overwrites these two selected-period KPIs.
                # All other fields, including every trend, must remain identical.
                if name == "marketing":
                    data.pop("marketing_cost")
                    data.pop("roas")
                output[key] = data
    print(json.dumps(output, sort_keys=True, ensure_ascii=False))


if __name__ == "__main__":
    if "--snapshot" in sys.argv:
        snapshot()
    else:
        unittest.main()
