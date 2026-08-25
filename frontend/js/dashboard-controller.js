"use strict";


/* -- DASHBOARD STATE --*/

let executiveCharts = [];
let productsDashboardCharts = [];
let customersDashboardCharts = [];
let marketingDashboardCharts = [];


/* -- DATA DATE CONFIGURATION --*/

const DASHBOARD_DATA_RANGE = {
    minimumDate: "2019-03-15",
    maximumDate: "2026-06-26"
};


/* -- VALUE FORMATTERS --*/

/* -- DASHBOARD NUMBER FORMATTERS --*/

const DASHBOARD_CURRENCY_FORMATTER =
    new Intl.NumberFormat(
        "en-US",
        {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0
        }
    );


const DASHBOARD_INTEGER_FORMATTER =
    new Intl.NumberFormat(
        "en-US",
        {
            maximumFractionDigits: 0
        }
    );


function formatDashboardCurrency(value) {
    if (
        value === null ||
        value === undefined
    ) {
        return "No aplica";
    }

    return DASHBOARD_CURRENCY_FORMATTER.format(
        value
    );
}


function formatDashboardInteger(value) {
    if (
        value === null ||
        value === undefined
    ) {
        return "No aplica";
    }

    return DASHBOARD_INTEGER_FORMATTER.format(
        value
    );
}


function formatDashboardPercentage(value) {
    if (
        value === null ||
        value === undefined
    ) {
        return "No aplica";
    }

    return `${Number(value).toFixed(2)}%`;
}


function formatDashboardRoas(value) {
    if (
        value === null ||
        value === undefined
    ) {
        return "No aplica";
    }

    return `${Number(value).toFixed(2)}x`;
}


function formatDashboardChange(
    value,
    suffix = "%"
) {
    if (
        value === null ||
        value === undefined
    ) {
        return "No aplica";
    }

    return (
        `${Math.abs(Number(value)).toFixed(2)}` +
        suffix
    );
}


/* -- DATE HELPERS --*/

function getDashboardDateRange() {
    return {
        minimumDate:
            DASHBOARD_DATA_RANGE.minimumDate,

        maximumDate:
            DASHBOARD_DATA_RANGE.maximumDate
    };
}


function getLastAvailableMonthRange() {
    const {
        maximumDate
    } = getDashboardDateRange();

    const maximumDateObject =
        parseDataDate(
            maximumDate
        );

    if (!maximumDateObject) {
        return null;
    }

    const startDate =
        new Date(
            maximumDateObject
        );

    startDate.setDate(1);

    return {
        startDate:
            formatDateForInput(
                startDate
            ),

        endDate:
            maximumDate
    };
}


function configureDateInputRange(
    startInput,
    endInput,
    startDate,
    endDate
) {
    if (
        !startInput ||
        !endInput
    ) {
        return;
    }

    startInput.min =
        DASHBOARD_DATA_RANGE.minimumDate;

    startInput.max =
        DASHBOARD_DATA_RANGE.maximumDate;

    endInput.min =
        DASHBOARD_DATA_RANGE.minimumDate;

    endInput.max =
        DASHBOARD_DATA_RANGE.maximumDate;

    startInput.value =
        startDate;

    endInput.value =
        endDate;
}


function clampDateToRange(
    date,
    minimumDate,
    maximumDate
) {
    if (!(date instanceof Date)) {
        return null;
    }

    if (date < minimumDate) {
        return new Date(minimumDate);
    }

    if (date > maximumDate) {
        return new Date(maximumDate);
    }

    return date;
}


function synchronizeDateInputLimits(
    startInput,
    endInput,
    datasetMinimum,
    datasetMaximum
) {
    if (
        !startInput ||
        !endInput
    ) {
        return;
    }

    startInput.min = datasetMinimum;
    endInput.max = datasetMaximum;

    startInput.max =
        endInput.value ||
        datasetMaximum;

    endInput.min =
        startInput.value ||
        datasetMinimum;
}


function formatMonthLabel(monthKey) {
    const [year, month] = monthKey
        .split("-")
        .map(Number);

    const date = new Date(
        year,
        month - 1,
        1
    );

    return new Intl.DateTimeFormat(
        "en-US",
        {
            month: "short",
            year: "numeric"
        }
    ).format(date);
}

/* -- TREND COMPARISON PERIODS --*/

const MAX_TREND_COMPARISON_YEARS = 1;


function isTrendPeriodWithinLimit(
    startDate,
    endDate
) {
    const maximumEndDate =
        new Date(startDate);

    maximumEndDate.setFullYear(
        maximumEndDate.getFullYear() +
        MAX_TREND_COMPARISON_YEARS
    );

    maximumEndDate.setDate(
        maximumEndDate.getDate() - 1
    );

    return endDate <= maximumEndDate;
}

function getTrendComparisonPeriods(
    startDate,
    endDate
) {
    if (
        isTrendPeriodWithinLimit(
            startDate,
            endDate
        )
    ) {
        const previousPeriod =
            getPreviousPeriodRange(
                startDate,
                endDate
            );

        if (!previousPeriod) {
            return null;
        }

        return {
            enabled: true,

            currentPeriod: {
                startDate,
                endDate
            },

            previousPeriod
        };
    }

    return {
        enabled: false,

        currentPeriod: {
            startDate,
            endDate
        },

        previousPeriod: null
    };
}


function updateDashboardTrendLabels(
    dashboardName,
    metricNames,
    label
) {
    metricNames.forEach(
        (metricName) => {
            const trendElement =
                document.getElementById(
                    `${dashboardName}-${metricName}-trend`
                );

            if (!trendElement) {
                return;
            }

            const comparisonContainer =
                trendElement.closest(
                    ".kpi-card__comparison"
                );

            const labelElement =
                comparisonContainer?.querySelector(
                    ".kpi-card__comparison-label"
                );

            if (labelElement) {
                labelElement.textContent =
                    label;
            }
        }
    );
}

/* -- TREND HELPERS --*/

function getTrendIconPath(direction) {
    const icons = {
        positive:
            "./frontend/assets/icons/trends/trending-up.svg",

        negative:
            "./frontend/assets/icons/trends/trending-down.svg",

        neutral:
            "./frontend/assets/icons/trends/minus.svg"
    };

    return icons[direction] ?? icons.neutral;
}


function updateDashboardTrend(
    dashboardName,
    metricName,
    comparison,
    suffix = "%"
) {
    const trendElement = document.getElementById(
        `${dashboardName}-${metricName}-trend`
    );

    const iconElement = document.getElementById(
        `${dashboardName}-${metricName}-trend-icon`
    );

    const valueElement = document.getElementById(
        `${dashboardName}-${metricName}-change`
    );

    if (
        !trendElement ||
        !iconElement ||
        !valueElement
    ) {
        return;
    }

    const direction =
        comparison?.direction ?? "neutral";

    trendElement.classList.remove(
        "kpi-card__change--positive",
        "kpi-card__change--negative",
        "kpi-card__change--neutral"
    );

    trendElement.classList.add(
        `kpi-card__change--${direction}`
    );

    iconElement.src = getTrendIconPath(
        direction
    );

    valueElement.textContent =
        formatDashboardChange(
            comparison?.change,
            suffix
        );
}

function clearDashboardTrend(
    dashboardName,
    metricName
) {
    const trendElement = document.getElementById(
        `${dashboardName}-${metricName}-trend`
    );

    const iconElement = document.getElementById(
        `${dashboardName}-${metricName}-trend-icon`
    );

    const valueElement = document.getElementById(
        `${dashboardName}-${metricName}-change`
    );

    if (
        !trendElement ||
        !iconElement ||
        !valueElement
    ) {
        return;
    }

    trendElement.classList.remove(
        "kpi-card__change--positive",
        "kpi-card__change--negative"
    );

    trendElement.classList.add(
        "kpi-card__change--neutral"
    );

    iconElement.src =
        getTrendIconPath("neutral");

    valueElement.textContent = "—";
}

function clearDashboardTrends(
    dashboardName,
    metricNames
) {
    metricNames.forEach(
        (metricName) => {
            clearDashboardTrend(
                dashboardName,
                metricName
            );
        }
    );
}

function comparePointValues(
    currentValue,
    previousValue
) {
    const current =
        Number(currentValue) || 0;

    const previous =
        Number(previousValue) || 0;

    const change = roundNumber(
        current - previous
    );

    return {
        currentValue: current,
        previousValue: previous,
        change,

        direction:
            change > 0
                ? "positive"
                : change < 0
                    ? "negative"
                    : "neutral"
    };
}


/* -- EXECUTIVE CHART MANAGEMENT --*/

function destroyExecutiveCharts() {
    executiveCharts.forEach((chart) => {
        chart.destroy();
    });

    executiveCharts = [];
}


function renderExecutiveCharts(
    trends
) {
    destroyExecutiveCharts();

    const labels = trends.map((item) => {
        return formatMonthLabel(
            item.period
        );
    });

    const revenueData = trends.map((item) => {
        return Number(item.revenue);
    });

    const profitData = trends.map((item) => {
        return Number(item.profit);
    });

    const revenueChart = createLineChart(
        "revenue-chart",
        {
            label: "Revenue",
            labels,
            data: revenueData,
            color: CHART_COLORS.revenue,
            format: "currency"
        }
    );

    const profitChart = createLineChart(
        "profit-chart",
        {
            label: "Profit",
            labels,
            data: profitData,
            color: CHART_COLORS.profit,
            format: "currency"
        }
    );

    if (revenueChart) {
        executiveCharts.push(
            revenueChart
        );
    }

    if (profitChart) {
        executiveCharts.push(
            profitChart
        );
    }
}


/* -- EXECUTIVE KPI VALUES --*/

function updateExecutiveKpiValues(
    metrics
) {
    updateElementText(
        "executive-revenue-value",
        formatDashboardCurrency(
            metrics.revenue
        )
    );

    updateElementText(
        "executive-profit-value",
        formatDashboardCurrency(
            metrics.profit
        )
    );

    updateElementText(
        "executive-margin-value",
        formatDashboardPercentage(
            metrics.margin
        )
    );

    updateElementText(
        "executive-orders-value",
        formatDashboardInteger(
            metrics.orders
        )
    );

    updateElementText(
        "executive-aov-value",
        formatDashboardCurrency(
            metrics.aov
        )
    );

    updateElementText(
        "executive-customers-value",
        formatDashboardInteger(
            metrics.customers
        )
    );
}


/* -- EXECUTIVE KPI TRENDS --*/

function updateExecutiveTrends(
    comparisons
) {
    updateDashboardTrend(
        "executive",
        "revenue",
        comparisons.revenue
    );

    updateDashboardTrend(
        "executive",
        "profit",
        comparisons.profit
    );

    updateDashboardTrend(
        "executive",
        "margin",
        comparisons.margin,
        " pp"
    );

    updateDashboardTrend(
        "executive",
        "orders",
        comparisons.orders
    );

    updateDashboardTrend(
        "executive",
        "aov",
        comparisons.aov
    );

    updateDashboardTrend(
        "executive",
        "customers",
        comparisons.customers
    );
}


/* -- EXECUTIVE COMPARISON --*/

function compareExecutiveMetrics(
    currentMetrics,
    previousMetrics
) {
    return {
        revenue: compareMetricValues(
            currentMetrics.revenue,
            previousMetrics.revenue
        ),

        profit: compareMetricValues(
            currentMetrics.profit,
            previousMetrics.profit
        ),

        margin: comparePointValues(
            currentMetrics.margin,
            previousMetrics.margin
        ),

        orders: compareMetricValues(
            currentMetrics.orders,
            previousMetrics.orders
        ),

        aov: compareMetricValues(
            currentMetrics.aov,
            previousMetrics.aov
        ),

        customers: compareMetricValues(
            currentMetrics.customers,
            previousMetrics.customers
        )
    };
}


/* -- EXECUTIVE DASHBOARD RENDERING --*/

function renderExecutiveDashboard(
    currentData,
    previousData,
    trendEnabled,
    comparisonLabel
) {
    updateExecutiveKpiValues(
        currentData
    );

    renderExecutiveCharts(
        currentData.trends
    );

    if (trendEnabled) {
        const comparison =
            compareExecutiveMetrics(
                currentData,
                previousData
            );

        updateExecutiveTrends(
            comparison
        );
    } else {
        clearDashboardTrends(
            "executive",
            [
                "revenue",
                "profit",
                "margin",
                "orders",
                "aov",
                "customers"
            ]
        );
    }

    updateDashboardTrendLabels(
        "executive",
        [
            "revenue",
            "profit",
            "margin",
            "orders",
            "aov",
            "customers"
        ],
        comparisonLabel
    );
}


/* -- EXECUTIVE DATE FILTER --*/

async function applyExecutiveDateFilter() {
    const startInput =
        document.getElementById(
            "executive-start-date"
        );

    const endInput =
        document.getElementById(
            "executive-end-date"
        );

    if (
        !startInput ||
        !endInput ||
        !startInput.value ||
        !endInput.value
    ) {
        return;
    }

    let startDate = parseDataDate(
        startInput.value
    );

    let endDate = parseDataDate(
        endInput.value
    );

    if (
        !startDate ||
        !endDate
    ) {
        return;
    }

    if (startDate > endDate) {
        endDate = new Date(startDate);

        endInput.value =
            formatDateForInput(
                endDate
            );
    }

    const trendPeriods =
        getTrendComparisonPeriods(
            startDate,
            endDate
        );

    if (!trendPeriods) {
        return;
    }

    const trendEnabled =
        trendPeriods.enabled;

    const comparisonLabel =
        trendEnabled
            ? "vs previous period"
            : "vs previous 12 months";

    try {
        const currentStartDate =
            formatDateForInput(
                startDate
            );

        const currentEndDate =
            formatDateForInput(
                endDate
            );

        const currentRequest =
            getExecutiveData(
                currentStartDate,
                currentEndDate
            );

        let previousRequest = null;

        if (trendEnabled) {
            previousRequest =
                getExecutiveData(
                    formatDateForInput(
                        trendPeriods.previousPeriod.startDate
                    ),
                    formatDateForInput(
                        trendPeriods.previousPeriod.endDate
                    )
                );
        }

        const [
            currentData,
            previousData
        ] = await Promise.all([
            currentRequest,
            previousRequest
        ]);

        renderExecutiveDashboard(
            currentData,
            previousData,
            trendEnabled,
            comparisonLabel
        );

    } catch (error) {
        console.error(
            "Error al cargar Executive:",
            error
        );
    }
}

/* -- EXECUTIVE DATE FILTER CONFIGURATION --*/

function configureExecutiveDateFilter() {
    const startInput =
        document.getElementById(
            "executive-start-date"
        );

    const endInput =
        document.getElementById(
            "executive-end-date"
        );

    if (
        !startInput ||
        !endInput
    ) {
        return;
    }

    const {
        minimumDate,
        maximumDate
    } = getDashboardDateRange();

    configureDateInputRange(
        startInput,
        endInput,
        minimumDate,
        maximumDate
    );

    startInput.addEventListener(
        "change",
        applyExecutiveDateFilter
    );

    endInput.addEventListener(
        "change",
        applyExecutiveDateFilter
    );
}


/* -- EXECUTIVE INITIALIZATION --*/

async function initExecutiveDashboard() {
    const startInput =
        document.getElementById(
            "executive-start-date"
        );

    const endInput =
        document.getElementById(
            "executive-end-date"
        );

    if (
        !startInput ||
        !endInput
    ) {
        return;
    }

    configureExecutiveDateFilter();

    const {
        minimumDate,
        maximumDate
    } = getDashboardDateRange();

    startInput.value =
        minimumDate;

    endInput.value =
        maximumDate;

    await applyExecutiveDateFilter();
}


/* -- PRODUCTS CONFIGURATION --*/

const PRODUCT_DIMENSIONS = {
    category: {
        field: "category_name",
        singular: "Category",
        plural: "Categories"
    },

    brand: {
        field: "brand_name",
        singular: "Brand",
        plural: "Brands"
    },

    product: {
        field: "product_name",
        singular: "Product",
        plural: "Products"
    }
};


/* -- PRODUCTS CHART MANAGEMENT --*/

function destroyProductsDashboardCharts() {
    productsDashboardCharts.forEach((chart) => {
        chart.destroy();
    });

    productsDashboardCharts = [];
}


/* -- PRODUCTS TOP METRIC --*/

function getTopMetricResult(
    results,
    metric
) {
    let topResult = null;
    let topValue = -Infinity;

    results.forEach((item) => {
        const value =
            Number(item?.[metric]) || 0;

        if (
            topResult === null ||
            value > topValue
        ) {
            topResult = item;
            topValue = value;
        }
    });

    return topResult;
}


/* -- PRODUCTS KPI UPDATE --*/

function updateProductsKpiCards(
    data,
    dimension,
    dimensionConfig
) {
    const results =
        Array.isArray(data?.financial)
            ? data.financial
            : [];

    const topRevenue =
        getTopMetricResult(
            results,
            "revenue"
        );

    const topProfit =
        getTopMetricResult(
            results,
            "profit"
        );

    const thirdMetricName =
        dimension === "product"
            ? "units_sold"
            : "margin";

    const thirdResult =
        getTopMetricResult(
            results,
            thirdMetricName
        );

    const cards = [
        {
            title:
                `Top Revenue ${dimensionConfig.singular}`,

            value:
                topRevenue?.dimension ??
                "No data",

            metric:
                formatDashboardCurrency(
                    topRevenue?.revenue ?? 0
                ),

            label:
                `highest ${dimensionConfig.singular.toLowerCase()} revenue`
        },

        {
            title:
                `Top Profit ${dimensionConfig.singular}`,

            value:
                topProfit?.dimension ??
                "No data",

            metric:
                formatDashboardCurrency(
                    topProfit?.profit ?? 0
                ),

            label:
                `highest ${dimensionConfig.singular.toLowerCase()} profit`
        },

        {
            title:
                dimension === "product"
                    ? "Most Sold Product"
                    : `Top Margin ${dimensionConfig.singular}`,

            value:
                thirdResult?.dimension ??
                "No data",

            metric:
                dimension === "product"
                    ? `${formatDashboardInteger(
                        thirdResult?.units_sold ?? 0
                    )} units`
                    : formatDashboardPercentage(
                        thirdResult?.margin ?? 0
                    ),

            label:
                dimension === "product"
                    ? "highest sales volume"
                    : `highest ${dimensionConfig.singular.toLowerCase()} margin`
        }
    ];

    cards.forEach((card, index) => {
        const cardNumber = index + 1;

        updateElementText(
            `products-kpi-title-${cardNumber}`,
            card.title
        );

        updateElementText(
            `products-kpi-value-${cardNumber}`,
            card.value
        );

        updateElementText(
            `products-kpi-metric-${cardNumber}`,
            card.metric
        );

        updateElementText(
            `products-kpi-label-${cardNumber}`,
            card.label
        );
    });
}



/* -- PRODUCTS SORTING --*/

function sortMetricResults(
    results,
    metric
) {
    return [...results].sort(
        (a, b) =>
            (Number(b[metric]) || 0) -
            (Number(a[metric]) || 0)
    );
}

/* -- PRODUCTS CHARTS --*/

function renderProductsDashboardCharts(
    financial,
    dimension,
    dimensionConfig
) {
    destroyProductsDashboardCharts();

    const results =
        Array.isArray(financial)
            ? financial
            : [];

    const revenueResults =
        sortMetricResults(
            results,
            "revenue"
        ).slice(0, 8);

    const profitResults =
        sortMetricResults(
            results,
            "profit"
        ).slice(0, 8);

    const thirdMetricName =
        dimension === "product"
            ? "units_sold"
            : "margin";

    const thirdResults =
        sortMetricResults(
            results,
            thirdMetricName
        ).slice(0, 8);

    updateElementText(
        "products-chart-title-1",
        `Revenue by ${dimensionConfig.singular}`
    );

    updateElementText(
        "products-chart-subtitle-1",
        `Revenue comparison across product ${dimensionConfig.plural.toLowerCase()}`
    );

    updateElementText(
        "products-chart-title-2",
        `Profit by ${dimensionConfig.singular}`
    );

    updateElementText(
        "products-chart-subtitle-2",
        `Profit comparison across product ${dimensionConfig.plural.toLowerCase()}`
    );

    updateElementText(
        "products-chart-title-3",
        dimension === "product"
            ? "Product Ranking by Units Sold"
            : `Margin % by ${dimensionConfig.singular}`
    );

    updateElementText(
        "products-chart-subtitle-3",
        dimension === "product"
            ? "Top products ranked by sales volume"
            : `Margin comparison across product ${dimensionConfig.plural.toLowerCase()}`
    );

    const charts = [
        createHorizontalBarChart(
            "products-chart-1",
            {
                label: "Revenue",

                labels: revenueResults.map(
                    (item) => item.dimension
                ),

                data: revenueResults.map(
                    (item) => item.revenue
                ),

                color: CHART_COLORS.revenue,
                format: "currency"
            }
        ),

        createHorizontalBarChart(
            "products-chart-2",
            {
                label: "Profit",

                labels: profitResults.map(
                    (item) => item.dimension
                ),

                data: profitResults.map(
                    (item) => item.profit
                ),

                color: CHART_COLORS.profit,
                format: "currency"
            }
        ),

        createHorizontalBarChart(
            "products-chart-3",
            {
                label:
                    dimension === "product"
                        ? "Units Sold"
                        : "Margin %",

                labels: thirdResults.map(
                    (item) => item.dimension
                ),

                data: thirdResults.map(
                    (item) => {
                        return item[thirdMetricName];
                    }
                ),

                color: CHART_COLORS.accent,

                format:
                    dimension === "product"
                        ? "integer"
                        : "percentage"
            }
        )
    ];

    charts
        .filter(Boolean)
        .forEach((chart) => {
            productsDashboardCharts.push(chart);
        });
}


/* -- PRODUCTS DASHBOARD RENDERING --*/

function renderProductsDashboard(
    data,
    dimension
) {
    const dimensionConfig =
        PRODUCT_DIMENSIONS[dimension] ??
        PRODUCT_DIMENSIONS.category;

    updateProductsKpiCards(
        data,
        dimension,
        dimensionConfig
    );

    renderProductsDashboardCharts(
        data.financial ?? [],
        dimension,
        dimensionConfig
    );
}


/* -- PRODUCTS FILTERS --*/

async function applyProductsFilters() {
    const startInput =
        document.getElementById(
            "products-start-date"
        );

    const endInput =
        document.getElementById(
            "products-end-date"
        );

    const dimensionSelect =
        document.getElementById(
            "product-dimension"
        );

    if (
        !startInput ||
        !endInput ||
        !startInput.value ||
        !endInput.value
    ) {
        return;
    }

    const dimension =
        dimensionSelect?.value ??
        "category";

    let startDate =
        parseDataDate(
            startInput.value
        );

    let endDate =
        parseDataDate(
            endInput.value
        );

    if (
        !startDate ||
        !endDate
    ) {
        return;
    }

    if (startDate > endDate) {
        endDate = new Date(
            startDate
        );

        endInput.value =
            formatDateForInput(
                endDate
            );
    }

    try {
        const data =
            await getProductsData(
                formatDateForInput(
                    startDate
                ),
                formatDateForInput(
                    endDate
                ),
                dimension
            );

        renderProductsDashboard(
            data,
            dimension
        );

    } catch (error) {
        console.error(
            "Error al cargar Products:",
            error
        );
    }
}


/* -- PRODUCTS DATE FILTER CONFIGURATION --*/

function configureProductsDateFilter() {
    const startInput =
        document.getElementById(
            "products-start-date"
        );

    const endInput =
        document.getElementById(
            "products-end-date"
        );

    if (
        !startInput ||
        !endInput
    ) {
        return;
    }

    const {
        minimumDate,
        maximumDate
    } = getDashboardDateRange();

    const lastAvailableMonth =
        getLastAvailableMonthRange();

    if (!lastAvailableMonth) {
        return;
    }

    configureDateInputRange(
        startInput,
        endInput,
        lastAvailableMonth.startDate,
        lastAvailableMonth.endDate
    );

    startInput.addEventListener(
        "change",
        applyProductsFilters
    );

    endInput.addEventListener(
        "change",
        applyProductsFilters
    );
}


/* -- PRODUCTS INITIALIZATION --*/

async function initProductsDashboard() {
    const dimensionSelect =
        document.getElementById(
            "product-dimension"
        );

    configureProductsDateFilter();

    if (dimensionSelect) {
        dimensionSelect.addEventListener(
            "change",
            applyProductsFilters
        );
    }

    await applyProductsFilters();
}


/* -- CUSTOMERS CHART MANAGEMENT --*/

function destroyCustomersDashboardCharts() {
    customersDashboardCharts.forEach((chart) => {
        chart.destroy();
    });

    customersDashboardCharts = [];
}


/* -- CUSTOMERS KPI UPDATE --*/

function updateCustomersDashboardKpis(
    currentData,
    previousData,
    trendEnabled
) {
    const current =
        currentData ?? {};

    updateElementText(
        "customers-new-value",
        formatDashboardInteger(
            current.new_customers ?? 0
        )
    );

    updateElementText(
        "customers-returning-value",
        formatDashboardInteger(
            current.returning_customers ?? 0
        )
    );

    updateElementText(
        "customers-one-time-value",
        formatDashboardInteger(
            current.total_orders ?? 0
        )
    );

    updateElementText(
        "customers-top-revenue-name",
        current.top_revenue?.customer ??
        "No data"
    );

    updateElementText(
        "customers-top-revenue-metric",
        formatDashboardCurrency(
            current.top_revenue?.revenue ?? 0
        )
    );

    updateElementText(
        "customers-top-profit-name",
        current.top_profit?.customer ??
        "No data"
    );

    updateElementText(
        "customers-top-profit-metric",
        formatDashboardCurrency(
            current.top_profit?.profit ?? 0
        )
    );

    updateElementText(
        "customers-recurrence-value",
        formatDashboardPercentage(
            current.recurrence_rate ?? 0
        )
    );

    if (!trendEnabled) {
        clearDashboardTrends(
            "customers",
            [
                "new",
                "returning",
                "one-time",
                "recurrence"
            ]
        );

        return;
    }

    const previous =
        previousData ?? {};

    updateDashboardTrend(
        "customers",
        "new",
        compareMetricValues(
            current.new_customers ?? 0,
            previous.new_customers ?? 0
        )
    );

    updateDashboardTrend(
        "customers",
        "returning",
        compareMetricValues(
            current.returning_customers ?? 0,
            previous.returning_customers ?? 0
        )
    );

    updateDashboardTrend(
        "customers",
        "one-time",
        compareMetricValues(
            current.total_orders ?? 0,
            previous.total_orders ?? 0
        )
    );

    updateDashboardTrend(
        "customers",
        "recurrence",
        comparePointValues(
            current.recurrence_rate ?? 0,
            previous.recurrence_rate ?? 0
        ),
        " pp"
    );
}


/* -- CUSTOMERS CHARTS --*/

function renderCustomersDashboardCharts(
    data
) {
    destroyCustomersDashboardCharts();

    const revenueRanking =
        Array.isArray(
            data.revenue_ranking
        )
            ? data.revenue_ranking
            : [];

    const profitRanking =
        Array.isArray(
            data.profit_ranking
        )
            ? data.profit_ranking
            : [];

    const charts = [
        createHorizontalBarChart(
            "customers-revenue-chart",
            {
                label: "Revenue",

                labels: revenueRanking.map(
                    (item) => item.customer
                ),

                data: revenueRanking.map(
                    (item) => item.revenue
                ),

                color: CHART_COLORS.revenue,
                format: "currency"
            }
        ),

        createHorizontalBarChart(
            "customers-profit-chart",
            {
                label: "Profit",

                labels: profitRanking.map(
                    (item) => item.customer
                ),

                data: profitRanking.map(
                    (item) => item.profit
                ),

                color: CHART_COLORS.profit,
                format: "currency"
            }
        ),

        createDoughnutChart(
            "customers-distribution-chart",
            {
                labels: [
                    "New Customers",
                    "Returning Customers"
                ],

                data: [
                    data.new_customers ?? 0,
                    data.returning_customers ?? 0
                ],

                colors: [
                    CHART_COLORS.revenue,
                    CHART_COLORS.profit
                ]
            }
        )
    ];

    charts
        .filter(Boolean)
        .forEach((chart) => {
            customersDashboardCharts.push(chart);
        });
}


/* -- CUSTOMERS DASHBOARD RENDERING --*/

async function renderCustomersDashboard(
    startDate,
    endDate
) {
    const trendPeriods =
        getTrendComparisonPeriods(
            startDate,
            endDate
        );

    if (!trendPeriods) {
        return;
    }

    const currentRequest =
        getCustomersData(
            formatDateForInput(startDate),
            formatDateForInput(endDate)
        );

    let previousRequest = null;

    if (trendPeriods.enabled) {
        previousRequest =
            getCustomersData(
                formatDateForInput(
                    trendPeriods.previousPeriod.startDate
                ),
                formatDateForInput(
                    trendPeriods.previousPeriod.endDate
                )
            );
    }

    const [
        currentData,
        previousData
    ] = await Promise.all([
        currentRequest,
        previousRequest
    ]);

    const current =
        currentData?.data ??
        currentData ??
        {};

    const comparisonPrevious =
        previousData?.data ??
        previousData ??
        {};

    updateCustomersDashboardKpis(
        current,
        comparisonPrevious,
        trendPeriods.enabled
    );

    renderCustomersDashboardCharts(
        current
    );

    updateDashboardTrendLabels(
        "customers",
        [
            "new",
            "returning",
            "one-time",
            "recurrence"
        ],
        trendPeriods.enabled
            ? "vs previous period"
            : "vs previous 12 months"
    );
}

/* -- CUSTOMERS FILTERS --*/

async function applyCustomersDateFilter() {
    const startInput =
        document.getElementById(
            "customers-start-date"
        );

    const endInput =
        document.getElementById(
            "customers-end-date"
        );

    if (
        !startInput ||
        !endInput ||
        !startInput.value ||
        !endInput.value
    ) {
        return;
    }

    const startDate =
        parseDataDate(
            startInput.value
        );

    const endDate =
        parseDataDate(
            endInput.value
        );

    if (
        !startDate ||
        !endDate
    ) {
        return;
    }

    if (startDate > endDate) {
        endInput.value =
            formatDateForInput(
                startDate
            );

        return;
    }

    try {
        await renderCustomersDashboard(
            startDate,
            endDate
        );

    } catch (error) {
        console.error(
            "Error al cargar Customers:",
            error
        );
    }
}


/* -- CUSTOMERS DATE FILTER CONFIGURATION --*/

function configureCustomersDateFilter() {
    const startInput =
        document.getElementById(
            "customers-start-date"
        );

    const endInput =
        document.getElementById(
            "customers-end-date"
        );

    if (
        !startInput ||
        !endInput
    ) {
        return;
    }

    const lastAvailableMonth =
        getLastAvailableMonthRange();

    if (!lastAvailableMonth) {
        return;
    }

    configureDateInputRange(
        startInput,
        endInput,
        lastAvailableMonth.startDate,
        lastAvailableMonth.endDate
    );

    startInput.addEventListener(
        "change",
        applyCustomersDateFilter
    );

    endInput.addEventListener(
        "change",
        applyCustomersDateFilter
    );
}


/* -- CUSTOMERS INITIALIZATION --*/

async function initCustomersDashboard() {
    configureCustomersDateFilter();

    await applyCustomersDateFilter();
}


/* -- MARKETING CHART MANAGEMENT --*/

function destroyMarketingDashboardCharts() {
    marketingDashboardCharts.forEach((chart) => {
        chart.destroy();
    });

    marketingDashboardCharts = [];
}


/* -- MARKETING CHANNEL --*/

function getSelectedMarketingChannel() {
    const channelSelect =
        document.getElementById(
            "marketing-channel"
        );

    return (
        channelSelect?.value ??
        "ALL"
    );
}



/* -- MARKETING COMPARISONS --*/

function compareMarketingMetrics(
    currentMetrics,
    previousMetrics
) {
    return {
        revenue: compareMetricValues(
            currentMetrics.revenue,
            previousMetrics.revenue
        ),

        profit: compareMetricValues(
            currentMetrics.profit,
            previousMetrics.profit
        ),

        margin: comparePointValues(
            currentMetrics.margin,
            previousMetrics.margin
        ),

        spend: compareMetricValues(
            currentMetrics.marketing_cost,
            previousMetrics.marketing_cost
        ),

        roas:
            currentMetrics.roas === 0 ||
            previousMetrics.roas === 0
                ? {
                    change: null,
                    direction: "neutral"
                }
                : comparePointValues(
                    currentMetrics.roas,
                    previousMetrics.roas
                ),

        netProfit: compareMetricValues(
            currentMetrics.net_profit,
            previousMetrics.net_profit
        )
    };
}


/* -- MARKETING KPI UPDATE --*/

function updateMarketingDashboardKpis(
    currentMetrics,
    previousMetrics,
    channel,
    trendEnabled
) {
    updateElementText(
        "marketing-revenue-value",
        formatDashboardCurrency(
            currentMetrics.revenue
        )
    );

    updateElementText(
        "marketing-profit-value",
        formatDashboardCurrency(
            currentMetrics.profit
        )
    );

    updateElementText(
        "marketing-margin-value",
        formatDashboardPercentage(
            currentMetrics.margin
        )
    );

    updateElementText(
        "marketing-spend-value",
        channel === "Tienda" ||
        currentMetrics.marketing_cost <= 0
            ? "No aplica"
            : formatDashboardCurrency(
                currentMetrics.marketing_cost
            )
    );

    updateElementText(
        "marketing-roas-value",
        channel === "Tienda" ||
        currentMetrics.roas === 0
            ? "No aplica"
            : formatDashboardRoas(
                currentMetrics.roas
            )
    );

    updateElementText(
        "marketing-net-profit-value",
        formatDashboardCurrency(
            currentMetrics.net_profit
        )
    );

    if (!trendEnabled) {
        clearDashboardTrends(
            "marketing",
            [
                "revenue",
                "profit",
                "margin",
                "spend",
                "roas",
                "net-profit"
            ]
        );

        return;
    }

    const comparisons =
        compareMarketingMetrics(
            currentMetrics,
            previousMetrics
        );

    updateDashboardTrend(
        "marketing",
        "revenue",
        comparisons.revenue
    );

    updateDashboardTrend(
        "marketing",
        "profit",
        comparisons.profit
    );

    updateDashboardTrend(
        "marketing",
        "margin",
        comparisons.margin,
        " pp"
    );

    const spendComparison = {
        ...comparisons.spend,

        direction:
            comparisons.spend.direction ===
            "positive"
                ? "negative"
                : comparisons.spend.direction ===
                    "negative"
                    ? "positive"
                    : "neutral"
    };

    updateDashboardTrend(
        "marketing",
        "spend",
        spendComparison
    );

    updateDashboardTrend(
        "marketing",
        "roas",
        comparisons.roas,
        "x"
    );

    updateDashboardTrend(
        "marketing",
        "net-profit",
        comparisons.netProfit
    );
}


/* -- MARKETING CHART DATA --*/

function aggregateMarketingTrendData(
    trends
) {
    const channelMap = new Map();

    trends.forEach((item) => {
        const channel =
            item.channel;

        if (!channelMap.has(channel)) {
            channelMap.set(
                channel,
                {
                    channel,
                    revenue: 0,
                    profit: 0,
                    marketing_cost: 0
                }
            );
        }

        const result =
            channelMap.get(channel);

        result.revenue +=
            Number(
                item.revenue ?? 0
            );

        result.profit +=
            Number(
                item.profit ?? 0
            );

        result.marketing_cost +=
            Number(
                item.marketing_cost ?? 0
            );
    });

    return Array.from(
        channelMap.values()
    ).map((item) => {
        const roas =
            item.marketing_cost > 0
                ? item.revenue /
                    item.marketing_cost
                : 0;

        return {
            ...item,
            roas
        };
    });
}


/* -- MARKETING CHARTS --*/

function renderMarketingDashboardCharts(
    trends
) {
    destroyMarketingDashboardCharts();

    const channelResults =
        aggregateMarketingTrendData(
            trends
        );

    const revenueResults =
        [...channelResults].sort(
            (first, second) => {
                return (
                    second.revenue -
                    first.revenue
                );
            }
        );

    const profitResults =
        [...channelResults].sort(
            (first, second) => {
                return (
                    second.profit -
                    first.profit
                );
            }
        );

    const spendResults =
        [...channelResults]
            .filter((item) => {
                return (
                    item.marketing_cost > 0
                );
            })
            .sort((first, second) => {
                return (
                    second.marketing_cost -
                    first.marketing_cost
                );
            });

    const roasResults =
        [...channelResults]
            .filter((item) => {
                return item.roas > 0;
            })
            .sort((first, second) => {
                return (
                    second.roas -
                    first.roas
                );
            });

    const charts = [
        createVerticalBarChart(
            "marketing-revenue-chart",
            {
                label: "Revenue",

                labels: revenueResults.map(
                    (item) =>
                        item.channel
                ),

                data: revenueResults.map(
                    (item) =>
                        item.revenue
                ),

                color:
                    CHART_COLORS.revenue,

                format: "currency"
            }
        ),

        createVerticalBarChart(
            "marketing-profit-chart",
            {
                label: "Profit",

                labels: profitResults.map(
                    (item) =>
                        item.channel
                ),

                data: profitResults.map(
                    (item) =>
                        item.profit
                ),

                color:
                    CHART_COLORS.profit,

                format: "currency"
            }
        ),

        createVerticalBarChart(
            "marketing-spend-chart",
            {
                label: "Ad Spend",

                labels: spendResults.map(
                    (item) =>
                        item.channel
                ),

                data: spendResults.map(
                    (item) =>
                        item.marketing_cost
                ),

                color:
                    CHART_COLORS.accent,

                format: "currency"
            }
        ),

        createVerticalBarChart(
            "marketing-roas-chart",
            {
                label: "ROAS",

                labels: roasResults.map(
                    (item) =>
                        item.channel
                ),

                data: roasResults.map(
                    (item) =>
                        item.roas
                ),

                color:
                    CHART_COLORS.revenue,

                format: "roas"
            }
        )
    ];

    charts
        .filter(Boolean)
        .forEach((chart) => {
            marketingDashboardCharts.push(
                chart
            );
        });
}


/* -- MARKETING DASHBOARD RENDERING --*/

async function renderMarketingDashboard(
    currentPeriod,
    channel
) {
    const startDate =
        parseDataDate(
            currentPeriod.startDate
        );

    const endDate =
        parseDataDate(
            currentPeriod.endDate
        );

    if (
        !startDate ||
        !endDate
    ) {
        return;
    }

    const trendPeriods =
        getTrendComparisonPeriods(
            startDate,
            endDate
        );

    if (!trendPeriods) {
        return;
    }

    const currentRequest =
        getMarketingData(
            formatDateForInput(startDate),
            formatDateForInput(endDate),
            channel
        );

    let previousRequest = null;

    if (trendPeriods.enabled) {
        previousRequest =
            getMarketingData(
                formatDateForInput(
                    trendPeriods.previousPeriod.startDate
                ),
                formatDateForInput(
                    trendPeriods.previousPeriod.endDate
                ),
                channel
            );
    }

    const [
        currentMetrics,
        previousMetrics
    ] = await Promise.all([
        currentRequest,
        previousRequest
    ]);

    updateMarketingDashboardKpis(
        currentMetrics,
        previousMetrics,
        channel,
        trendPeriods.enabled
    );

    renderMarketingDashboardCharts(
        currentMetrics.trends ?? []
    );

    updateDashboardTrendLabels(
        "marketing",
        [
            "revenue",
            "profit",
            "margin",
            "spend",
            "roas",
            "net-profit"
        ],
        trendPeriods.enabled
            ? "vs previous period"
            : "vs previous 12 months"
    );
}


/* -- MARKETING DATE FILTER --*/

function getMarketingDatePeriods() {
    const startDateInput =
        document.getElementById(
            "marketing-start-date"
        );

    const endDateInput =
        document.getElementById(
            "marketing-end-date"
        );

    if (
        !startDateInput ||
        !endDateInput ||
        !startDateInput.value ||
        !endDateInput.value
    ) {
        return null;
    }

    const startDate =
        parseDataDate(
            startDateInput.value
        );

    const endDate =
        parseDataDate(
            endDateInput.value
        );

    if (
        !startDate ||
        !endDate
    ) {
        return null;
    }

    if (startDate > endDate) {
        return null;
    }

    return {
        startDate,
        endDate
    };
}


/* -- MARKETING FILTERS --*/

async function applyMarketingFilters() {
    const periods =
        getMarketingDatePeriods();

    if (!periods) {
        return;
    }

    const channel =
        getSelectedMarketingChannel();

    try {
        await renderMarketingDashboard(
            periods,
            channel
        );

    } catch (error) {
        console.error(
            "Error al cargar Marketing:",
            error
        );
    }
}


/* -- MARKETING CHANNEL INITIALIZATION --*/

function initializeMarketingChannels() {
    const channelSelect =
        document.getElementById(
            "marketing-channel"
        );

    if (!channelSelect) {
        return;
    }

    const channels = [
        {
            value: "ALL",
            label: "All Channels"
        },
        {
            value: "Tienda",
            label: "Tienda"
        },
        {
            value: "Instagram",
            label: "Instagram"
        },
        {
            value: "Mercado Libre",
            label: "Mercado Libre"
        },
        {
            value: "Página Web",
            label: "Página Web"
        },
        {
            value: "Facebook",
            label: "Facebook/Messenger"
        }
    ];

    channelSelect.innerHTML = "";

    channels.forEach(
        ({ value, label }) => {
            const option =
                document.createElement(
                    "option"
                );

            option.value = value;
            option.textContent = label;

            channelSelect.appendChild(
                option
            );
        }
    );

    channelSelect.value = "ALL";
}


/* -- MARKETING INITIALIZATION --*/

async function initMarketingDashboard() {
    const startDateInput =
        document.getElementById(
            "marketing-start-date"
        );

    const endDateInput =
        document.getElementById(
            "marketing-end-date"
        );

    const channelSelect =
        document.getElementById(
            "marketing-channel"
        );

    if (
        !startDateInput ||
        !endDateInput
    ) {
        return;
    }

    const lastAvailableMonth =
        getLastAvailableMonthRange();

    if (!lastAvailableMonth) {
        return;
    }

    configureDateInputRange(
        startDateInput,
        endDateInput,
        lastAvailableMonth.startDate,
        lastAvailableMonth.endDate
    );

    if (channelSelect) {
        await initializeMarketingChannels();

        channelSelect.addEventListener(
            "change",
            applyMarketingFilters
        );
    }

    startDateInput.addEventListener(
        "change",
        applyMarketingFilters
    );

    endDateInput.addEventListener(
        "change",
        applyMarketingFilters
    );

    await applyMarketingFilters();
}