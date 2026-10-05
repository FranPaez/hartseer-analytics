// Run with: node --test frontend/tests/regressions.cjs
// The VM uses the application's real scripts with a minimal DOM and Chart adapter.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const snapshotArg = process.argv.indexOf("--snapshot");
const project = snapshotArg >= 0 ? process.argv[snapshotArg + 1] : path.resolve(__dirname, "../..");
const plain = (value) => JSON.parse(JSON.stringify(value));
const deferred = () => {
    let resolve, reject;
    const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
    return { promise, resolve, reject };
};

function element(id = "") {
    const classes = new Set();
    return {
        id, value: "", textContent: "", src: "", children: [], listeners: {}, attributes: {}, dataset: {}, label: {},
        classList: {
            add: (...values) => values.forEach((value) => classes.add(value)),
            remove: (...values) => values.forEach((value) => classes.delete(value)),
            toggle: (value, enabled) => enabled ? classes.add(value) : classes.delete(value)
        },
        classes,
        addEventListener(type, callback) { this.listeners[type] = callback; },
        setAttribute(name, value) { this.attributes[name] = value; },
        removeAttribute(name) { delete this.attributes[name]; },
        closest() { return { querySelector: () => this.label }; },
        appendChild(child) { this.children.push(child); }
    };
}

function harness(rootPath = project) {
    const nodes = new Map();
    const charts = [];
    const errors = [];
    const requests = [];
    const root = element("dashboard-root");
    const links = ["executive", "products", "customers", "marketing"].map((route) => ({ ...element(), dataset: { route } }));
    Object.defineProperty(root, "innerHTML", {
        set(html) {
            nodes.clear();
            nodes.set("dashboard-root", root);
            root.firstElementChild = {};
            for (const match of html.matchAll(/\bid="([^"]+)"/g)) nodes.set(match[1], element(match[1]));
            if (nodes.has("product-dimension")) nodes.get("product-dimension").value = "category";
        }
    });
    nodes.set(root.id, root);
    const context = vm.createContext({
        console: { error: (...args) => errors.push(args), log: () => {} }, URLSearchParams,
        AbortController, clearTimeout,
        setTimeout: (callback, delay) => setTimeout(callback, delay === 1000 ? 0 : delay),
        document: {
            getElementById: (id) => nodes.get(id) || null,
            querySelectorAll: () => links,
            createElement: () => element()
        },
        window: { location: { hash: "#/executive" }, scrollTo() {}, addEventListener() {} },
        Chart: class {
            constructor(canvas, config) { this.canvas = canvas; this.config = config; this.destroyed = false; charts.push(this); }
            destroy() { this.destroyed = true; }
        },
        fetch: async (url) => {
            requests.push(url);
            const kind = new URL(url).pathname.split("/").at(-1);
            return { ok: true, json: async () => ({ success: true, data: fixtures[kind] }) };
        }
    });
    const scripts = ["data-service.js", "analytics.js", "charts.js", "dashboard-controller.js", "views/executive.js", "views/products.js", "views/customers.js", "views/marketing.js", "router.js"];
    for (const script of scripts) vm.runInContext(fs.readFileSync(path.join(rootPath, "frontend/js", script), "utf8"), context, { filename: script });
    return { context, nodes, charts, errors, requests, root, links,
        run: (code) => vm.runInContext(code, context),
        mount(route) {
            vm.runInContext(`{
                const config = routes["${route}"];
                const initialize = config.afterRender;
                config.afterRender = null;
                renderCurrentView("${route}");
                config.afterRender = initialize;
            }`, context);
        },
        snapshot() {
            return plain({
                nodes: [...nodes].filter(([id]) => id !== "dashboard-root").map(([id, node]) => [id, node.value, node.min, node.max, node.textContent, node.src, node.label, [...node.classes], node.children.map((child) => [child.value, child.textContent]), Object.keys(node.listeners)]),
                charts: charts.filter((chart) => !chart.destroyed).map((chart) => ({ canvas: chart.canvas.id, config: chart.config })),
                requests
            });
        }
    };
}

const fixtures = {
    executive: { revenue: 1200, profit: 400, margin: 33.33, orders: 12, customers: 8, aov: 100, trends: [{ period: "2026-05", revenue: 800, profit: 250 }, { period: "2026-06", revenue: 400, profit: 150 }] },
    products: {
        top_revenue: { dimension: "Tech", revenue: 800, profit: 250, margin: 31.25 },
        top_profit: { dimension: "Home", revenue: 400, profit: 300, margin: 75 },
        top_margin: { dimension: "Home", revenue: 400, profit: 300, margin: 75 },
        top_sales: { product: "Keyboard", units_sold: 10 },
        financial: [{ dimension: "Tech", revenue: 800, profit: 250, margin: 31.25 }, { dimension: "Home", revenue: 400, profit: 300, margin: 75 }]
    },
    customers: { new_customers: 4, returning_customers: 3, total_orders: 12, recurrence_rate: 37.5,
        top_revenue: { customer: "Jane", revenue: 300, profit: 50 }, top_profit: { customer: "John", revenue: 250, profit: 90 },
        revenue_ranking: [{ customer: "Jane", revenue: 300, profit: 50 }, { customer: "John", revenue: 250, profit: 90 }],
        profit_ranking: [{ customer: "John", revenue: 250, profit: 90 }, { customer: "Jane", revenue: 300, profit: 50 }]
    },
    marketing: { revenue: 1200, profit: 400, margin: 33.33, marketing_cost: 100, roas: 12, net_profit: 300,
        trends: [{ period: "2026-05", channel: "Tienda", revenue: 300, profit: 100, marketing_cost: 0, roas: 0 }, { period: "2026-05", channel: "Instagram", revenue: 900, profit: 300, marketing_cost: 100, roas: 9 }]
    }
};

const filterFunction = { executive: "applyExecutiveDateFilter", products: "applyProductsFilters", customers: "applyCustomersDateFilter", marketing: "applyMarketingFilters" };

async function dashboardSnapshot(rootPath, route, extra, longPeriod = false) {
    const h = harness(rootPath);
    h.mount(route);
    await h.context[`init${route[0].toUpperCase()}${route.slice(1)}Dashboard`]();
    if (extra || longPeriod) {
        if (route === "products") h.nodes.get("product-dimension").value = extra;
        if (route === "marketing") h.nodes.get("marketing-channel").value = extra;
        if (longPeriod) h.nodes.get(`${route}-start-date`).value = "2019-03-15";
        await h.context[filterFunction[route]]();
    }
    assert.equal(h.errors.length, 0, `Unexpected ${route} errors`);
    return h.snapshot();
}

if (snapshotArg >= 0) {
    (async () => {
        const output = {};
        for (const route of Object.keys(filterFunction)) {
            for (const extra of route === "products" ? ["category", "brand", "product"] : route === "marketing" ? ["ALL", "Tienda", "Instagram", "Mercado Libre", "Página Web", "Facebook"] : [null]) {
                for (const longPeriod of [false, true]) output[`${route}/${extra}/${longPeriod}`] = await dashboardSnapshot(project, route, extra, longPeriod);
            }
        }
        process.stdout.write(JSON.stringify(output));
    })().catch((error) => { console.error(error); process.exitCode = 1; });
} else {
    test("all dashboards retain date defaults, controls, KPIs and charts", async () => {
        for (const route of Object.keys(filterFunction)) {
            const h = harness();
            h.mount(route);
            await h.context[`init${route[0].toUpperCase()}${route.slice(1)}Dashboard`]();
            assert.equal(h.nodes.get(`${route}-start-date`).value, route === "executive" ? "2019-03-15" : "2026-06-01");
            assert.equal(h.nodes.get(`${route}-end-date`).value, "2026-06-26");
            assert.equal(h.charts.filter((chart) => !chart.destroyed).length, { executive: 2, products: 3, customers: 3, marketing: 4 }[route]);
            assert.equal(h.nodes.get(`${route}-start-date`).listeners.change, h.context[filterFunction[route]]);
            assert.equal(h.errors.length, 0);
        }
    });

    for (const route of Object.keys(filterFunction)) {
        test(`${route}: older requests cannot overwrite newer filter selections`, async () => {
            const h = harness();
            h.mount(route);
            h.nodes.get(`${route}-start-date`).value = "2026-06-01";
            h.nodes.get(`${route}-end-date`).value = "2026-06-26";
            if (route === "marketing") h.nodes.get("marketing-channel").value = "ALL";
            const pending = [];
            h.context.fetch = () => { const call = deferred(); pending.push(call); return call.promise; };
            const oldLoad = h.context[filterFunction[route]]();
            h.nodes.get(`${route}-end-date`).value = "2026-06-20";
            const newLoad = h.context[filterFunction[route]]();
            const oldCount = route === "products" ? 1 : 2;
            const result = (data) => ({ ok: true, json: async () => ({ success: true, data }) });
            for (const call of pending.slice(oldCount)) call.resolve(result(fixtures[route]));
            await newLoad;
            const expected = h.snapshot();
            for (const call of pending.slice(0, oldCount)) call.resolve(result({ ...fixtures[route], revenue: 999999, new_customers: 999999 }));
            await oldLoad;
            assert.deepEqual(h.snapshot(), expected);
            assert.equal(h.errors.length, 0);
        });
    }

    test("navigation destroys charts and releases all dashboard arrays", async () => {
        const h = harness();
        h.mount("executive");
        await h.context.initExecutiveDashboard();
        const oldCharts = [...h.charts];
        h.run('routes.products.afterRender = () => {}; renderCurrentView("products");');
        assert.ok(oldCharts.every((chart) => chart.destroyed));
        assert.deepEqual(plain(h.run("[executiveCharts, productsDashboardCharts, customersDashboardCharts, marketingDashboardCharts]")), [[], [], [], []]);
    });

    test("a pending request cannot render after navigating away and back", async () => {
        const h = harness();
        h.mount("products");
        h.nodes.get("products-start-date").value = "2026-06-01";
        h.nodes.get("products-end-date").value = "2026-06-26";
        const call = deferred();
        h.context.fetch = () => call.promise;
        const pending = h.context.applyProductsFilters();
        h.run('routes.executive.afterRender = () => {}; routes.products.afterRender = () => {}; renderCurrentView("executive"); renderCurrentView("products");');
        const expected = h.snapshot();
        call.resolve({ ok: true, json: async () => ({ success: true, data: fixtures.products }) });
        await pending;
        assert.deepEqual(h.snapshot(), expected);
    });

    test("identical simultaneous API requests share one network call", async () => {
        const h = harness();
        const call = deferred();
        let count = 0;
        h.context.fetch = () => { count++; return call.promise; };
        const first = h.context.getExecutiveData("2026-01-01", "2026-02-01");
        const second = h.context.getExecutiveData("2026-01-01", "2026-02-01");
        assert.equal(count, 1);
        call.resolve({ ok: true, json: async () => ({ success: true, data: fixtures.executive }) });
        assert.deepEqual(await first, await second);
        await h.context.getExecutiveData("2026-01-01", "2026-02-01");
        assert.equal(count, 2, "Completed results must remain fresh on later requests");
    });

    test("failed API requests release deduplication state for retry", async () => {
        const h = harness();
        h.context.fetch = async () => ({ ok: false, status: 503 });
        await assert.rejects(h.context.getExecutiveData("a", "b"), /503/);
        h.context.fetch = async () => ({ ok: true, json: async () => ({ success: true, data: fixtures.executive }) });
        assert.deepEqual(plain(await h.context.getExecutiveData("a", "b")), fixtures.executive);
        h.context.fetch = async () => ({ ok: true, json: async () => ({ success: false }) });
        await assert.rejects(h.context.getExecutiveData("a", "b"), /formato esperado/);
    });

    test("formatters preserve null, invalid, negative and large values", () => {
        const h = harness();
        for (const format of ["currency", "integer", "percentage", "roas"]) {
            for (const value of [null, undefined, NaN, Infinity, "invalid"]) assert.equal(h.context.formatChartValue(value, format), "No aplica");
        }
        assert.equal(h.context.formatChartValue(-1234.5, "currency"), "-$1,235");
        assert.equal(h.context.formatChartValue(1234.5), "1,235");
        assert.equal(h.context.formatCompactNumber(1500000), "1.5M");
        assert.equal(h.context.formatMonthLabel("2026-06"), "Jun 2026");
    });

    test("unknown routes fall back and navigation keeps accessibility state", () => {
        const h = harness();
        h.context.window.location.hash = "#/unknown";
        assert.equal(h.context.getCurrentRoute(), "executive");
        h.context.updateActiveNavigation("customers");
        assert.equal(h.links[2].attributes["aria-current"], "page");
        assert.ok(h.links[2].classes.has("sidebar__nav-link--active"));
        assert.ok(h.links.filter((_, index) => index !== 2).every((link) => !link.attributes["aria-current"]));
    });

    test("long periods skip comparison requests and clear trend values", async () => {
        const h = harness();
        h.mount("executive");
        await h.context.initExecutiveDashboard();
        assert.equal(h.requests.length, 1);
        assert.equal(h.nodes.get("executive-revenue-change").textContent, "—");
    });

    test("temporary gateway errors retry and recover without empty data", async () => {
        const h = harness();
        let calls = 0;
        h.context.fetch = async () => ++calls < 3
            ? { ok: false, status: 502 }
            : { ok: true, json: async () => ({ success: true, data: fixtures.executive }) };
        const data = await h.context.getExecutiveData("2026-01-01", "2026-01-31");
        assert.equal(calls, 3);
        assert.deepEqual(plain(data), fixtures.executive);
    });

    test("permanent HTTP errors fail without automatic retries", async () => {
        const h = harness();
        let calls = 0;
        h.context.fetch = async () => { calls++; return { ok: false, status: 404 }; };
        await assert.rejects(h.context.getExecutiveData("a", "b"), /404/);
        assert.equal(calls, 1);
    });

    test("request timeout aborts the network call and releases pending state", async () => {
        const h = harness();
        let deadline;
        h.context.setTimeout = (callback) => { deadline = callback; return 1; };
        h.context.clearTimeout = () => {};
        h.context.fetch = (_url, { signal }) => new Promise((_resolve, reject) => {
            signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
        });
        const pending = h.context.getExecutiveData("a", "b");
        deadline();
        await assert.rejects(pending, { name: "AbortError" });
        assert.equal(h.run("pendingRequests.size"), 0);
    });

    for (const route of Object.keys(filterFunction)) {
        test(`${route}: failed loads show an accessible retry control and recover`, async () => {
            const h = harness();
            h.mount(route);
            h.context.fetch = async () => ({ ok: false, status: 404 });
            await h.context[`init${route[0].toUpperCase()}${route.slice(1)}Dashboard`]();
            assert.equal(h.nodes.get("dashboard-status").hidden, false);
            assert.equal(h.nodes.get("dashboard-retry").hidden, false);
            assert.match(h.nodes.get("dashboard-status-message").textContent, /No se pudieron cargar/);
            assert.equal(h.nodes.get("dashboard-retry").onclick, h.context[filterFunction[route]]);
            h.context.fetch = async () => ({ ok: true, json: async () => ({ success: true, data: fixtures[route] }) });
            await h.nodes.get("dashboard-retry").onclick();
            assert.equal(h.nodes.get("dashboard-status").hidden, true);
            assert.ok(h.charts.filter((chart) => !chart.destroyed).length > 0);
        });
    }
}
