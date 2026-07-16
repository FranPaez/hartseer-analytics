"use strict";


/* -- NUMBER UTILITIES --*/

function toNumber(value) {
    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : 0;
}

function roundNumber(value, decimals = 2) {
    const factor = 10 ** decimals;

    return Math.round(
        (toNumber(value) + Number.EPSILON) * factor
    ) / factor;
}


/* -- DATE UTILITIES --*/

function parseDataDate(value) {
    if (!value) {
        return null;
    }

    const dateOnlyPattern =
        /^(\d{4})-(\d{2})-(\d{2})$/;

    const dateOnlyMatch = String(value).match(
        dateOnlyPattern
    );

    if (dateOnlyMatch) {
        const [, year, month, day] =
            dateOnlyMatch;

        const localDate = new Date(
            Number(year),
            Number(month) - 1,
            Number(day)
        );

        return Number.isNaN(
            localDate.getTime()
        )
            ? null
            : localDate;
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? null
        : date;
}

function formatDateForInput(date) {
    if (!(date instanceof Date)) {
        return "";
    }

    const year = date.getFullYear();

    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getLatestDatasetDate(records) {
    const dates = records
        .map((record) => {
            return parseDataDate(record.purchase_date);
        })
        .filter(Boolean);

    if (dates.length === 0) {
        return null;
    }

    return new Date(
        Math.max(
            ...dates.map((date) => date.getTime())
        )
    );
}

function getMonthRange(referenceDate) {
    if (!(referenceDate instanceof Date)) {
        return null;
    }

    const startDate = new Date(
        referenceDate.getFullYear(),
        referenceDate.getMonth(),
        1
    );

    const endDate = new Date(
        referenceDate.getFullYear(),
        referenceDate.getMonth() + 1,
        0
    );

    return {
        startDate,
        endDate
    };
}

function getPreviousMonthRange(referenceDate) {
    if (!(referenceDate instanceof Date)) {
        return null;
    }

    const previousMonthDate = new Date(
        referenceDate.getFullYear(),
        referenceDate.getMonth() - 1,
        1
    );

    return getMonthRange(previousMonthDate);
}

function getPreviousPeriodRange(startDate, endDate) {
    if (
        !(startDate instanceof Date) ||
        !(endDate instanceof Date)
    ) {
        return null;
    }

    const millisecondsPerDay =
        24 * 60 * 60 * 1000;

    const periodLength =
        Math.floor(
            (
                endDate.getTime() -
                startDate.getTime()
            ) / millisecondsPerDay
        ) + 1;

    const previousEndDate = new Date(startDate);

    previousEndDate.setDate(
        previousEndDate.getDate() - 1
    );

    const previousStartDate = new Date(
        previousEndDate
    );

    previousStartDate.setDate(
        previousStartDate.getDate() -
        periodLength +
        1
    );

    return {
        startDate: previousStartDate,
        endDate: previousEndDate
    };
}

function getDefaultComparisonPeriods(records) {
    const latestDate = getLatestDatasetDate(
        records
    );

    if (!latestDate) {
        return null;
    }

    const currentStartDate = new Date(
        latestDate.getFullYear(),
        latestDate.getMonth(),
        1
    );

    const currentEndDate = new Date(
        latestDate
    );

    const previousStartDate = new Date(
        latestDate.getFullYear(),
        latestDate.getMonth() - 1,
        1
    );

    const previousMonthLastDay = new Date(
        latestDate.getFullYear(),
        latestDate.getMonth(),
        0
    ).getDate();

    const comparableDay = Math.min(
        latestDate.getDate(),
        previousMonthLastDay
    );

    const previousEndDate = new Date(
        latestDate.getFullYear(),
        latestDate.getMonth() - 1,
        comparableDay
    );

    return {
        current: {
            startDate: currentStartDate,
            endDate: currentEndDate
        },

        previous: {
            startDate: previousStartDate,
            endDate: previousEndDate
        }
    };
}


/* -- DATA FILTERS --*/

function filterRecordsByDate(
    records,
    startDate,
    endDate
) {
    if (!startDate || !endDate) {
        return [...records];
    }

    const normalizedStart = new Date(startDate);
    const normalizedEnd = new Date(endDate);

    normalizedStart.setHours(0, 0, 0, 0);
    normalizedEnd.setHours(23, 59, 59, 999);

    return records.filter((record) => {
        const purchaseDate = parseDataDate(
            record.purchase_date
        );

        if (!purchaseDate) {
            return false;
        }

        return (
            purchaseDate >= normalizedStart &&
            purchaseDate <= normalizedEnd
        );
    });
}

function filterRecordsByField(
    records,
    fieldName,
    expectedValue
) {
    if (
        expectedValue === null ||
        expectedValue === undefined ||
        expectedValue === "" ||
        expectedValue === "all"
    ) {
        return [...records];
    }

    return records.filter((record) => {
        return String(record[fieldName]) ===
            String(expectedValue);
    });
}


/* -- COLLECTION UTILITIES --*/

function getUniqueValues(records, fieldName) {
    return new Set(
        records
            .map((record) => record[fieldName])
            .filter((value) => {
                return (
                    value !== null &&
                    value !== undefined
                );
            })
    );
}

function groupRecordsBy(records, fieldName) {
    return records.reduce(
        (groups, record) => {
            const rawKey = record[fieldName];

            const key =
                rawKey === null ||
                rawKey === undefined ||
                rawKey === ""
                    ? "Unknown"
                    : String(rawKey);

            if (!groups.has(key)) {
                groups.set(key, []);
            }

            groups.get(key).push(record);

            return groups;
        },
        new Map()
    );
}


/* -- CORE METRICS --*/

function calculateRevenue(records) {
    return records.reduce(
        (total, record) => {
            return (
                total +
                toNumber(record.line_revenue)
            );
        },
        0
    );
}

function calculateCost(records) {
    return records.reduce(
        (total, record) => {
            const quantity = toNumber(
                record.quantity
            );

            const unitCost = toNumber(
                record.unit_cost
            );

            return total + quantity * unitCost;
        },
        0
    );
}

function calculateProfit(records) {
    const revenue = calculateRevenue(records);
    const cost = calculateCost(records);

    return revenue - cost;
}

function calculateMargin(records) {
    const revenue = calculateRevenue(records);

    if (revenue === 0) {
        return 0;
    }

    const profit = calculateProfit(records);

    return roundNumber(
        (profit / revenue) * 100
    );
}

function calculateOrders(records) {
    return getUniqueValues(
        records,
        "purchase_id"
    ).size;
}

function calculateCustomers(records) {
    return getUniqueValues(
        records,
        "customer_id"
    ).size;
}

function calculateAov(records) {
    const revenue = calculateRevenue(records);
    const orders = calculateOrders(records);

    if (orders === 0) {
        return 0;
    }

    return roundNumber(
        revenue / orders
    );
}

function calculateUnitsSold(records) {
    return records.reduce(
        (total, record) => {
            return total + toNumber(record.quantity);
        },
        0
    );
}

function calculateCoreMetrics(records) {
    const revenue = calculateRevenue(records);
    const cost = calculateCost(records);
    const profit = revenue - cost;
    const orders = calculateOrders(records);
    const customers = calculateCustomers(records);

    return {
        revenue: roundNumber(revenue),
        cost: roundNumber(cost),
        profit: roundNumber(profit),

        margin:
            revenue > 0
                ? roundNumber(
                    (profit / revenue) * 100
                )
                : 0,

        orders,
        customers,

        aov:
            orders > 0
                ? roundNumber(revenue / orders)
                : 0,

        unitsSold: calculateUnitsSold(records)
    };
}


/* -- METRIC COMPARISONS --*/

function calculatePercentageChange(
    currentValue,
    previousValue
) {
    const current = toNumber(currentValue);
    const previous = toNumber(previousValue);

    if (previous === 0) {
        return current === 0
            ? 0
            : null;
    }

    return roundNumber(
        (
            (current - previous) /
            Math.abs(previous)
        ) * 100
    );
}

function compareMetricValues(
    currentValue,
    previousValue
) {
    const change = calculatePercentageChange(
        currentValue,
        previousValue
    );

    let direction = "neutral";

    if (change !== null && change > 0) {
        direction = "positive";
    }

    if (change !== null && change < 0) {
        direction = "negative";
    }

    return {
        currentValue,
        previousValue,
        change,
        direction
    };
}

function compareCoreMetrics(
    currentRecords,
    previousRecords
) {
    const current = calculateCoreMetrics(
        currentRecords
    );

    const previous = calculateCoreMetrics(
        previousRecords
    );

    return {
        current,
        previous,

        comparisons: {
            revenue: compareMetricValues(
                current.revenue,
                previous.revenue
            ),

            profit: compareMetricValues(
                current.profit,
                previous.profit
            ),

            margin: {
                currentValue: current.margin,
                previousValue: previous.margin,

                change: roundNumber(
                    current.margin -
                    previous.margin
                ),

                direction:
                    current.margin > previous.margin
                        ? "positive"
                        : current.margin < previous.margin
                            ? "negative"
                            : "neutral"
            },

            orders: compareMetricValues(
                current.orders,
                previous.orders
            ),

            customers: compareMetricValues(
                current.customers,
                previous.customers
            ),

            aov: compareMetricValues(
                current.aov,
                previous.aov
            )
        }
    };
}


/* -- DIMENSION AGGREGATION --*/

function aggregateByDimension(
    records,
    dimensionField
) {
    const groups = groupRecordsBy(
        records,
        dimensionField
    );

    return Array.from(
        groups.entries()
    ).map(([dimension, groupRecords]) => {
        const metrics = calculateCoreMetrics(
            groupRecords
        );

        return {
            dimension,
            ...metrics
        };
    });
}

function sortMetricResults(
    results,
    metric,
    direction = "desc"
) {
    const multiplier =
        direction === "asc"
            ? 1
            : -1;

    return [...results].sort(
        (first, second) => {
            return (
                toNumber(first[metric]) -
                toNumber(second[metric])
            ) * multiplier;
        }
    );
}

function getTopMetricResult(
    records,
    dimensionField,
    metric
) {
    const results = aggregateByDimension(
        records,
        dimensionField
    );

    const sortedResults = sortMetricResults(
        results,
        metric
    );

    return sortedResults[0] ?? null;
}


/* -- MONTHLY TRENDS --*/

function getMonthKey(date) {
    const year = date.getFullYear();

    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    return `${year}-${month}`;
}

function aggregateByMonth(records) {
    const monthlyGroups = new Map();

    records.forEach((record) => {
        const purchaseDate = parseDataDate(
            record.purchase_date
        );

        if (!purchaseDate) {
            return;
        }

        const monthKey = getMonthKey(
            purchaseDate
        );

        if (!monthlyGroups.has(monthKey)) {
            monthlyGroups.set(monthKey, []);
        }

        monthlyGroups
            .get(monthKey)
            .push(record);
    });

    return Array.from(
        monthlyGroups.entries()
    )
        .sort(([firstMonth], [secondMonth]) => {
            return firstMonth.localeCompare(
                secondMonth
            );
        })
        .map(([month, monthRecords]) => {
            const metrics = calculateCoreMetrics(
                monthRecords
            );

            return {
                month,
                revenue: metrics.revenue,
                profit: metrics.profit
            };
        });
}


/* -- CUSTOMER ANALYTICS --*/

function getCustomerPurchaseMap(records) {
    const customerPurchases = new Map();

    records.forEach((record) => {
        const customerId = record.customer_id;
        const purchaseId = record.purchase_id;

        if (
            customerId === null ||
            customerId === undefined ||
            purchaseId === null ||
            purchaseId === undefined
        ) {
            return;
        }

        if (!customerPurchases.has(customerId)) {
            customerPurchases.set(
                customerId,
                new Set()
            );
        }

        customerPurchases
            .get(customerId)
            .add(purchaseId);
    });

    return customerPurchases;
}

function calculateReturningCustomers(records) {
    const customerPurchases =
        getCustomerPurchaseMap(records);

    return Array.from(
        customerPurchases.values()
    ).filter((purchaseIds) => {
        return purchaseIds.size > 1;
    }).length;
}

function calculateOneTimeCustomers(records) {
    const customerPurchases =
        getCustomerPurchaseMap(records);

    return Array.from(
        customerPurchases.values()
    ).filter((purchaseIds) => {
        return purchaseIds.size === 1;
    }).length;
}

function calculateRecurrenceRate(records) {
    const totalCustomers =
        calculateCustomers(records);

    if (totalCustomers === 0) {
        return 0;
    }

    const returningCustomers =
        calculateReturningCustomers(records);

    return roundNumber(
        (
            returningCustomers /
            totalCustomers
        ) * 100
    );
}

function getCustomerFirstPurchaseDates(records) {
    const firstPurchaseDates = new Map();

    records.forEach((record) => {
        const customerId = record.customer_id;

        const purchaseDate = parseDataDate(
            record.purchase_date
        );

        if (
            customerId === null ||
            customerId === undefined ||
            !purchaseDate
        ) {
            return;
        }

        const currentFirstDate =
            firstPurchaseDates.get(customerId);

        if (
            !currentFirstDate ||
            purchaseDate < currentFirstDate
        ) {
            firstPurchaseDates.set(
                customerId,
                purchaseDate
            );
        }
    });

    return firstPurchaseDates;
}

function calculateNewCustomers(
    allRecords,
    startDate,
    endDate
) {
    const firstPurchaseDates =
        getCustomerFirstPurchaseDates(
            allRecords
        );

    return Array.from(
        firstPurchaseDates.values()
    ).filter((purchaseDate) => {
        return (
            purchaseDate >= startDate &&
            purchaseDate <= endDate
        );
    }).length;
}

function aggregateCustomers(records) {
    return aggregateByDimension(
        records,
        "customer_id"
    ).map((customerMetrics) => {
        const customerRecord = records.find(
            (record) => {
                return String(record.customer_id) ===
                    String(
                        customerMetrics.dimension
                    );
            }
        );

        return {
            customerId:
                customerMetrics.dimension,

            customerName:
                customerRecord?.customer_first_name &&
                customerRecord?.customer_last_name
                    ? `${customerRecord.customer_first_name} ${customerRecord.customer_last_name}`
                    : customerRecord?.customer_first_name ??
                        `Customer ${customerMetrics.dimension}`,

            ...customerMetrics
        };
    });
}


/* -- MARKETING COST METRICS --*/

function filterMarketingCostsByDate(
    costs,
    startDate,
    endDate
) {
    if (!startDate || !endDate) {
        return [...costs];
    }

    const normalizedStart = new Date(startDate);
    const normalizedEnd = new Date(endDate);

    normalizedStart.setHours(0, 0, 0, 0);
    normalizedEnd.setHours(23, 59, 59, 999);

    return costs.filter((costRecord) => {
        const costDate = parseDataDate(
            costRecord.cost_date
        );

        if (!costDate) {
            return false;
        }

        return (
            costDate >= normalizedStart &&
            costDate <= normalizedEnd
        );
    });
}

function calculateAdSpend(costRecords) {
    return roundNumber(
        costRecords.reduce(
            (total, record) => {
                return (
                    total +
                    toNumber(record.ad_spend)
                );
            },
            0
        )
    );
}

function calculateRoas(revenue, adSpend) {
    const investment = toNumber(adSpend);

    if (investment === 0) {
        return null;
    }

    return roundNumber(
        toNumber(revenue) / investment
    );
}

function calculateNetProfit(
    profit,
    adSpend
) {
    return roundNumber(
        toNumber(profit) -
        toNumber(adSpend)
    );
}

function calculateMarketingMetrics(
    salesRecords,
    costRecords
) {
    const salesMetrics =
        calculateCoreMetrics(salesRecords);

    const adSpend =
        calculateAdSpend(costRecords);

    return {
        revenue: salesMetrics.revenue,
        profit: salesMetrics.profit,
        margin: salesMetrics.margin,
        adSpend,

        roas: calculateRoas(
            salesMetrics.revenue,
            adSpend
        ),

        netProfit: calculateNetProfit(
            salesMetrics.profit,
            adSpend
        )
    };
}

function aggregateMarketingByChannel(
    salesRecords,
    costRecords
) {
    const salesByChannel =
        aggregateByDimension(
            salesRecords,
            "channel_name"
        );

    const costsByChannel =
        groupRecordsBy(
            costRecords,
            "channel_name"
        );

    return salesByChannel.map(
        (channelSales) => {
            const channelCosts =
                costsByChannel.get(
                    channelSales.dimension
                ) ?? [];

            const adSpend =
                calculateAdSpend(channelCosts);

            return {
                channel: channelSales.dimension,
                revenue: channelSales.revenue,
                profit: channelSales.profit,
                margin: channelSales.margin,
                adSpend,

                roas: calculateRoas(
                    channelSales.revenue,
                    adSpend
                ),

                netProfit:
                    calculateNetProfit(
                        channelSales.profit,
                        adSpend
                    )
            };
        }
    );
}