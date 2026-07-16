"use strict";


/* -- DASHBOARD STATE --*/

let executiveCharts = [];
let productsDashboardCharts = [];
let customersDashboardCharts = [];
let marketingDashboardCharts = [];


/* -- VALUE FORMATTERS --*/

function formatDashboardCurrency(value) {
    if (
        value === null ||
        value === undefined
    ) {
        return "No aplica";
    }

    return new Intl.NumberFormat(
        "en-US",
        {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0
        }
    ).format(value);
}

function formatDashboardInteger(value) {
    if (
        value === null ||
        value === undefined
    ) {
        return "No aplica";
    }

    return new Intl.NumberFormat(
        "en-US",
        {
            maximumFractionDigits: 0
        }
    ).format(value);
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

function getDatasetDateRange(records) {
    const dates = records
        .map((record) => {
            return parseDataDate(
                record.purchase_date
            );
        })
        .filter(Boolean)
        .sort((firstDate, secondDate) => {
            return firstDate - secondDate;
        });

    if (dates.length === 0) {
        return null;
    }

    return {
        startDate: dates[0],
        endDate: dates[dates.length - 1]
    };
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

function normalizePeriodEnd(date) {
    const normalizedDate = new Date(date);

    normalizedDate.setHours(
        23,
        59,
        59,
        999
    );

    return normalizedDate;
}

function configureMonthlyDateFilter(
    records,
    startInputId,
    endInputId,
    changeHandler
) {
    const startInput = document.getElementById(
        startInputId
    );

    const endInput = document.getElementById(
        endInputId
    );

    if (!startInput || !endInput) {
        return null;
    }

    const datasetRange = getDatasetDateRange(
        records
    );

    const periods = getDefaultComparisonPeriods(
        records
    );

    if (!datasetRange || !periods) {
        return null;
    }

    const minimumDate = formatDateForInput(
        datasetRange.startDate
    );

    const maximumDate = formatDateForInput(
        datasetRange.endDate
    );

    startInput.value = formatDateForInput(
        periods.current.startDate
    );

    endInput.value = formatDateForInput(
        periods.current.endDate
    );

    synchronizeDateInputLimits(
        startInput,
        endInput,
        minimumDate,
        maximumDate
    );

    startInput.addEventListener(
        "change",
        () => {
            synchronizeDateInputLimits(
                startInput,
                endInput,
                minimumDate,
                maximumDate
            );

            changeHandler();
        }
    );

    endInput.addEventListener(
        "change",
        () => {
            synchronizeDateInputLimits(
                startInput,
                endInput,
                minimumDate,
                maximumDate
            );

            changeHandler();
        }
    );

    return {
        currentRecords: filterRecordsByDate(
            records,
            periods.current.startDate,
            periods.current.endDate
        ),

        previousRecords: filterRecordsByDate(
            records,
            periods.previous.startDate,
            periods.previous.endDate
        ),

        currentPeriod: periods.current,
        previousPeriod: periods.previous
    };
}

function getSelectedDatePeriods(
    records,
    startInputId,
    endInputId
) {
    const startInput = document.getElementById(
        startInputId
    );

    const endInput = document.getElementById(
        endInputId
    );

    if (!startInput || !endInput) {
        return null;
    }

    const datasetRange = getDatasetDateRange(
        records
    );

    if (!datasetRange) {
        return null;
    }

    let startDate = parseDataDate(
        startInput.value
    );

    let endDate = parseDataDate(
        endInput.value
    );

    if (!startDate || !endDate) {
        return null;
    }

    startDate = clampDateToRange(
        startDate,
        datasetRange.startDate,
        datasetRange.endDate
    );

    endDate = clampDateToRange(
        endDate,
        datasetRange.startDate,
        datasetRange.endDate
    );

    if (!startDate || !endDate) {
        return null;
    }

    if (startDate > endDate) {
        endDate = new Date(startDate);
    }

    startInput.value = formatDateForInput(
        startDate
    );

    endInput.value = formatDateForInput(
        endDate
    );

    synchronizeDateInputLimits(
        startInput,
        endInput,
        formatDateForInput(
            datasetRange.startDate
        ),
        formatDateForInput(
            datasetRange.endDate
        )
    );

    const previousPeriod =
        getPreviousPeriodRange(
            startDate,
            endDate
        );

    if (!previousPeriod) {
        return null;
    }

    return {
        currentRecords: filterRecordsByDate(
            records,
            startDate,
            endDate
        ),

        previousRecords: filterRecordsByDate(
            records,
            previousPeriod.startDate,
            previousPeriod.endDate
        ),

        currentPeriod: {
            startDate,
            endDate
        },

        previousPeriod
    };
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

function renderExecutiveCharts(records) {
    destroyExecutiveCharts();

    const monthlyData = aggregateByMonth(
        records
    );

    const labels = monthlyData.map((item) => {
        return formatMonthLabel(item.month);
    });

    const revenueData = monthlyData.map((item) => {
        return item.revenue;
    });

    const profitData = monthlyData.map((item) => {
        return item.profit;
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
        executiveCharts.push(revenueChart);
    }

    if (profitChart) {
        executiveCharts.push(profitChart);
    }
}


/* -- EXECUTIVE KPI VALUES --*/

function updateExecutiveKpiValues(metrics) {
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

function updateExecutiveTrends(comparisons) {
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


/* -- DEFAULT EXECUTIVE COMPARISON --*/

function getExecutiveDefaultComparison(records) {
    const periods = getDefaultComparisonPeriods(
        records
    );

    if (!periods) {
        return null;
    }

    const currentRecords = filterRecordsByDate(
        records,
        periods.current.startDate,
        periods.current.endDate
    );

    const previousRecords = filterRecordsByDate(
        records,
        periods.previous.startDate,
        periods.previous.endDate
    );

    return compareCoreMetrics(
        currentRecords,
        previousRecords
    );
}


/* -- EXECUTIVE DASHBOARD RENDERING --*/

function renderExecutiveDashboard(
    currentRecords,
    previousRecords = null
) {
    const metrics = calculateCoreMetrics(
        currentRecords
    );

    updateExecutiveKpiValues(metrics);
    renderExecutiveCharts(currentRecords);

    const comparison = previousRecords
        ? compareCoreMetrics(
            currentRecords,
            previousRecords
        )
        : getExecutiveDefaultComparison(
            getSalesData()
        );

    if (!comparison) {
        return;
    }

    updateExecutiveTrends(
        comparison.comparisons
    );
}


/* -- EXECUTIVE DATE FILTER --*/

function applyExecutiveDateFilter() {
    const periods = getSelectedDatePeriods(
        getSalesData(),
        "executive-start-date",
        "executive-end-date"
    );

    if (!periods) {
        return;
    }

    renderExecutiveDashboard(
        periods.currentRecords,
        periods.previousRecords
    );
}

function configureExecutiveDateFilter(records) {
    const startInput = document.getElementById(
        "executive-start-date"
    );

    const endInput = document.getElementById(
        "executive-end-date"
    );

    const datasetRange = getDatasetDateRange(
        records
    );

    if (
        !startInput ||
        !endInput ||
        !datasetRange
    ) {
        return;
    }

    const minimumDate = formatDateForInput(
        datasetRange.startDate
    );

    const maximumDate = formatDateForInput(
        datasetRange.endDate
    );

    startInput.min = minimumDate;
    startInput.max = maximumDate;

    endInput.min = minimumDate;
    endInput.max = maximumDate;

    startInput.value = minimumDate;
    endInput.value = maximumDate;

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

function initExecutiveDashboard() {
    const salesRecords = getSalesData();

    renderExecutiveDashboard(
        salesRecords
    );

    configureExecutiveDateFilter(
        salesRecords
    );
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


/* -- PRODUCTS DATA PREPARATION --*/

function getProductsDimensionData(
    records,
    dimension
) {
    const dimensionConfig =
        PRODUCT_DIMENSIONS[dimension] ??
        PRODUCT_DIMENSIONS.category;

    const analysisRecords =
        dimension === "brand"
            ? records.filter((record) => {
                return (
                    record.brand_name !==
                    "No aplica"
                );
            })
            : records;

    return {
        dimensionConfig,

        results: aggregateByDimension(
            analysisRecords,
            dimensionConfig.field
        )
    };
}


/* -- PRODUCTS KPI UPDATE --*/

function updateProductsKpiCards(
    results,
    dimension,
    dimensionConfig
) {
    const topRevenue =
        sortMetricResults(
            results,
            "revenue"
        )[0] ?? null;

    const topProfit =
        sortMetricResults(
            results,
            "profit"
        )[0] ?? null;

    const thirdMetricName =
        dimension === "product"
            ? "unitsSold"
            : "margin";

    const thirdResult =
        sortMetricResults(
            results,
            thirdMetricName
        )[0] ?? null;

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
                        thirdResult?.unitsSold ?? 0
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


/* -- PRODUCTS CHARTS --*/

function renderProductsDashboardCharts(
    results,
    dimension,
    dimensionConfig
) {
    destroyProductsDashboardCharts();

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
            ? "unitsSold"
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

function renderProductsDashboard(records) {
    const dimensionSelect = document.getElementById(
        "product-dimension"
    );

    const dimension =
        dimensionSelect?.value ??
        "category";

    const {
        dimensionConfig,
        results
    } = getProductsDimensionData(
        records,
        dimension
    );

    updateProductsKpiCards(
        results,
        dimension,
        dimensionConfig
    );

    renderProductsDashboardCharts(
        results,
        dimension,
        dimensionConfig
    );
}


/* -- PRODUCTS FILTERS --*/

function applyProductsFilters() {
    const periods = getSelectedDatePeriods(
        getSalesData(),
        "products-start-date",
        "products-end-date"
    );

    if (!periods) {
        return;
    }

    renderProductsDashboard(
        periods.currentRecords
    );
}


/* -- PRODUCTS INITIALIZATION --*/

function initProductsDashboard() {
    const salesRecords = getSalesData();

    const defaultData =
        configureMonthlyDateFilter(
            salesRecords,
            "products-start-date",
            "products-end-date",
            applyProductsFilters
        );

    const dimensionSelect = document.getElementById(
        "product-dimension"
    );

    if (dimensionSelect) {
        dimensionSelect.addEventListener(
            "change",
            applyProductsFilters
        );
    }

    renderProductsDashboard(
        defaultData?.currentRecords ??
        salesRecords
    );
}


/* -- CUSTOMERS CHART MANAGEMENT --*/

function destroyCustomersDashboardCharts() {
    customersDashboardCharts.forEach((chart) => {
        chart.destroy();
    });

    customersDashboardCharts = [];
}


/* -- CUSTOMERS METRICS --*/

function calculateCustomerDashboardMetrics(
    periodRecords,
    allRecords,
    period
) {
    const customerResults =
        aggregateCustomers(periodRecords);

    const topRevenue =
        [...customerResults].sort(
            (first, second) => {
                return (
                    second.revenue -
                    first.revenue
                );
            }
        )[0] ?? null;

    const topProfit =
        [...customerResults].sort(
            (first, second) => {
                return (
                    second.profit -
                    first.profit
                );
            }
        )[0] ?? null;

    return {
        newCustomers: calculateNewCustomers(
            allRecords,
            period.startDate,
            normalizePeriodEnd(
                period.endDate
            )
        ),

        returningCustomers:
            calculateReturningCustomers(
                periodRecords
            ),

        oneTimeCustomers:
            calculateOneTimeCustomers(
                periodRecords
            ),

        recurrenceRate:
            calculateRecurrenceRate(
                periodRecords
            ),

        topRevenue,
        topProfit,
        customerResults
    };
}


/* -- CUSTOMERS KPI UPDATE --*/

function updateCustomersDashboardKpis(
    currentMetrics,
    previousMetrics
) {
    updateElementText(
        "customers-new-value",
        formatDashboardInteger(
            currentMetrics.newCustomers
        )
    );

    updateElementText(
        "customers-returning-value",
        formatDashboardInteger(
            currentMetrics.returningCustomers
        )
    );

    updateElementText(
        "customers-one-time-value",
        formatDashboardInteger(
            currentMetrics.oneTimeCustomers
        )
    );

    updateElementText(
        "customers-top-revenue-name",
        currentMetrics.topRevenue
            ?.customerName ??
            "No data"
    );

    updateElementText(
        "customers-top-revenue-metric",
        formatDashboardCurrency(
            currentMetrics.topRevenue
                ?.revenue ?? 0
        )
    );

    updateElementText(
        "customers-top-profit-name",
        currentMetrics.topProfit
            ?.customerName ??
            "No data"
    );

    updateElementText(
        "customers-top-profit-metric",
        formatDashboardCurrency(
            currentMetrics.topProfit
                ?.profit ?? 0
        )
    );

    updateElementText(
        "customers-recurrence-value",
        formatDashboardPercentage(
            currentMetrics.recurrenceRate
        )
    );

    updateDashboardTrend(
        "customers",
        "new",
        compareMetricValues(
            currentMetrics.newCustomers,
            previousMetrics.newCustomers
        )
    );

    updateDashboardTrend(
        "customers",
        "returning",
        compareMetricValues(
            currentMetrics.returningCustomers,
            previousMetrics.returningCustomers
        )
    );

    updateDashboardTrend(
        "customers",
        "one-time",
        compareMetricValues(
            currentMetrics.oneTimeCustomers,
            previousMetrics.oneTimeCustomers
        )
    );

    updateDashboardTrend(
        "customers",
        "recurrence",
        comparePointValues(
            currentMetrics.recurrenceRate,
            previousMetrics.recurrenceRate
        ),
        " pp"
    );
}


/* -- CUSTOMERS CHARTS --*/

function renderCustomersDashboardCharts(metrics) {
    destroyCustomersDashboardCharts();

    const revenueRanking =
        [...metrics.customerResults]
            .sort((first, second) => {
                return (
                    second.revenue -
                    first.revenue
                );
            })
            .slice(0, 5);

    const profitRanking =
        [...metrics.customerResults]
            .sort((first, second) => {
                return (
                    second.profit -
                    first.profit
                );
            })
            .slice(0, 5);

    const charts = [
        createHorizontalBarChart(
            "customers-revenue-chart",
            {
                label: "Revenue",

                labels: revenueRanking.map(
                    (item) => item.customerName
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
                    (item) => item.customerName
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
                    "One-time Customers",
                    "Returning Customers"
                ],

                data: [
                    metrics.oneTimeCustomers,
                    metrics.returningCustomers
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

function renderCustomersDashboard(
    currentRecords,
    previousRecords,
    currentPeriod,
    previousPeriod
) {
    const allSalesRecords = getSalesData();

    const currentMetrics =
        calculateCustomerDashboardMetrics(
            currentRecords,
            allSalesRecords,
            currentPeriod
        );

    const previousMetrics =
        calculateCustomerDashboardMetrics(
            previousRecords,
            allSalesRecords,
            previousPeriod
        );

    updateCustomersDashboardKpis(
        currentMetrics,
        previousMetrics
    );

    renderCustomersDashboardCharts(
        currentMetrics
    );
}


/* -- CUSTOMERS FILTERS --*/

function applyCustomersDateFilter() {
    const periods = getSelectedDatePeriods(
        getSalesData(),
        "customers-start-date",
        "customers-end-date"
    );

    if (!periods) {
        return;
    }

    renderCustomersDashboard(
        periods.currentRecords,
        periods.previousRecords,
        periods.currentPeriod,
        periods.previousPeriod
    );
}


/* -- CUSTOMERS INITIALIZATION --*/

function initCustomersDashboard() {
    const salesRecords = getSalesData();

    const defaultData =
        configureMonthlyDateFilter(
            salesRecords,
            "customers-start-date",
            "customers-end-date",
            applyCustomersDateFilter
        );

    if (!defaultData) {
        return;
    }

    renderCustomersDashboard(
        defaultData.currentRecords,
        defaultData.previousRecords,
        defaultData.currentPeriod,
        defaultData.previousPeriod
    );
}


/* -- MARKETING CHART MANAGEMENT --*/

function destroyMarketingDashboardCharts() {
    marketingDashboardCharts.forEach((chart) => {
        chart.destroy();
    });

    marketingDashboardCharts = [];
}


/* -- MARKETING CHANNEL HELPERS --*/

function slugifyDashboardValue(value) {
    return String(value)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

function populateMarketingChannels(records) {
    const channelSelect = document.getElementById(
        "marketing-channel"
    );

    if (!channelSelect) {
        return;
    }

    const channels = Array.from(
        getUniqueValues(
            records,
            "channel_name"
        )
    ).sort((first, second) => {
        return String(first).localeCompare(
            String(second)
        );
    });

    channelSelect.innerHTML = `
        <option value="all">
            All Channels
        </option>
    `;

    channels.forEach((channel) => {
        const option = document.createElement(
            "option"
        );

        option.value =
            slugifyDashboardValue(channel);

        option.textContent = channel;

        option.dataset.channelName = channel;

        channelSelect.appendChild(option);
    });
}

function getSelectedMarketingChannelName() {
    const channelSelect = document.getElementById(
        "marketing-channel"
    );

    if (
        !channelSelect ||
        channelSelect.value === "all"
    ) {
        return null;
    }

    const selectedOption =
        channelSelect.options[
            channelSelect.selectedIndex
        ];

    return (
        selectedOption?.dataset.channelName ??
        null
    );
}

function filterMarketingCostsByChannel(
    costRecords,
    channelName
) {
    if (!channelName) {
        return [...costRecords];
    }

    return costRecords.filter((record) => {
        return (
            record.channel_name ===
            channelName
        );
    });
}


/* -- MARKETING PERIOD DATA --*/

function getMarketingPeriodRecords(
    salesRecords,
    costRecords,
    period,
    channelName = null
) {
    let filteredSales = filterRecordsByDate(
        salesRecords,
        period.startDate,
        period.endDate
    );

    let filteredCosts =
        filterMarketingCostsByDate(
            costRecords,
            period.startDate,
            period.endDate
        );

    if (channelName) {
        filteredSales = filterRecordsByField(
            filteredSales,
            "channel_name",
            channelName
        );

        filteredCosts =
            filterMarketingCostsByChannel(
                filteredCosts,
                channelName
            );
    }

    return {
        sales: filteredSales,
        costs: filteredCosts
    };
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
            currentMetrics.adSpend,
            previousMetrics.adSpend
        ),

        roas:
            currentMetrics.roas === null ||
            previousMetrics.roas === null
                ? {
                    change: null,
                    direction: "neutral"
                }
                : comparePointValues(
                    currentMetrics.roas,
                    previousMetrics.roas
                ),

        netProfit: compareMetricValues(
            currentMetrics.netProfit,
            previousMetrics.netProfit
        )
    };
}


/* -- MARKETING KPI UPDATE --*/

function updateMarketingDashboardKpis(
    currentMetrics,
    previousMetrics
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
        currentMetrics.adSpend > 0
            ? formatDashboardCurrency(
                currentMetrics.adSpend
            )
            : "No aplica"
    );

    updateElementText(
        "marketing-roas-value",
        formatDashboardRoas(
            currentMetrics.roas
        )
    );

    updateElementText(
        "marketing-net-profit-value",
        formatDashboardCurrency(
            currentMetrics.netProfit
        )
    );

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


/* -- MARKETING CHARTS --*/

function renderMarketingDashboardCharts(
    salesRecords,
    costRecords
) {
    destroyMarketingDashboardCharts();

    const channelResults =
        aggregateMarketingByChannel(
            salesRecords,
            costRecords
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
                return item.adSpend > 0;
            })
            .sort((first, second) => {
                return (
                    second.adSpend -
                    first.adSpend
                );
            });

    const roasResults =
        [...channelResults]
            .filter((item) => {
                return item.roas !== null;
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
                    (item) => item.channel
                ),

                data: revenueResults.map(
                    (item) => item.revenue
                ),

                color: CHART_COLORS.revenue,
                format: "currency"
            }
        ),

        createVerticalBarChart(
            "marketing-profit-chart",
            {
                label: "Profit",

                labels: profitResults.map(
                    (item) => item.channel
                ),

                data: profitResults.map(
                    (item) => item.profit
                ),

                color: CHART_COLORS.profit,
                format: "currency"
            }
        ),

        createVerticalBarChart(
            "marketing-spend-chart",
            {
                label: "Ad Spend",

                labels: spendResults.map(
                    (item) => item.channel
                ),

                data: spendResults.map(
                    (item) => item.adSpend
                ),

                color: CHART_COLORS.accent,
                format: "currency"
            }
        ),

        createVerticalBarChart(
            "marketing-roas-chart",
            {
                label: "ROAS",

                labels: roasResults.map(
                    (item) => item.channel
                ),

                data: roasResults.map(
                    (item) => item.roas
                ),

                color: CHART_COLORS.revenue,
                format: "roas"
            }
        )
    ];

    charts
        .filter(Boolean)
        .forEach((chart) => {
            marketingDashboardCharts.push(chart);
        });
}


/* -- MARKETING DASHBOARD RENDERING --*/

function renderMarketingDashboard(
    currentPeriod,
    previousPeriod,
    allCurrentPeriod
) {
    const currentMetrics =
        calculateMarketingMetrics(
            currentPeriod.sales,
            currentPeriod.costs
        );

    const previousMetrics =
        calculateMarketingMetrics(
            previousPeriod.sales,
            previousPeriod.costs
        );

    updateMarketingDashboardKpis(
        currentMetrics,
        previousMetrics
    );

    renderMarketingDashboardCharts(
        allCurrentPeriod.sales,
        allCurrentPeriod.costs
    );
}


/* -- MARKETING FILTERS --*/

function applyMarketingFilters() {
    const salesRecords = getSalesData();

    const costRecords =
        getMarketingCostsData();

    const selectedDates =
        getSelectedDatePeriods(
            salesRecords,
            "marketing-start-date",
            "marketing-end-date"
        );

    if (!selectedDates) {
        return;
    }

    const channelName =
        getSelectedMarketingChannelName();

    const currentPeriod =
        getMarketingPeriodRecords(
            salesRecords,
            costRecords,
            selectedDates.currentPeriod,
            channelName
        );

    const previousPeriod =
        getMarketingPeriodRecords(
            salesRecords,
            costRecords,
            selectedDates.previousPeriod,
            channelName
        );

    const allCurrentPeriod =
        getMarketingPeriodRecords(
            salesRecords,
            costRecords,
            selectedDates.currentPeriod
        );

    renderMarketingDashboard(
        currentPeriod,
        previousPeriod,
        allCurrentPeriod
    );
}


/* -- MARKETING INITIALIZATION --*/

function initMarketingDashboard() {
    const salesRecords = getSalesData();

    populateMarketingChannels(
        salesRecords
    );

    const defaultData =
        configureMonthlyDateFilter(
            salesRecords,
            "marketing-start-date",
            "marketing-end-date",
            applyMarketingFilters
        );

    const channelSelect = document.getElementById(
        "marketing-channel"
    );

    if (channelSelect) {
        channelSelect.addEventListener(
            "change",
            applyMarketingFilters
        );
    }

    if (!defaultData) {
        return;
    }

    applyMarketingFilters();
}