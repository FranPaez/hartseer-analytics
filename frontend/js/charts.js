"use strict";


/* -- SHARED CHART CONFIGURATION --*/

const CHART_COLORS = {
    text: "#a7adbb",
    grid: "rgba(167, 173, 187, 0.09)",
    surface: "#161a23",
    revenue: "#3b82f6",
    profit: "#6c63ff",
    accent: "#8b5cf6"
};

const COMMON_CHART_OPTIONS = {
    responsive: true,
    maintainAspectRatio: false
};


/* -- SHARED DOM UTILITIES --*/

function getChartCanvas(canvasId) {
    const canvas = document.getElementById(
        canvasId
    );

    if (!canvas) {
        console.error(
            `No se encontró el canvas con id: ${canvasId}`
        );

        return null;
    }

    return canvas;
}

function updateElementText(
    elementId,
    value
) {
    const element = document.getElementById(
        elementId
    );

    if (!element) {
        return;
    }

    element.textContent = value;
}


/* -- CHART VALUE FORMATTERS --*/

function formatChartValue(
    value,
    format = "integer"
) {
    if (
        value === null ||
        value === undefined
    ) {
        return "No aplica";
    }

    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
        return "No aplica";
    }

    switch (format) {
        case "currency":
            return new Intl.NumberFormat(
                "en-US",
                {
                    style: "currency",
                    currency: "USD",
                    maximumFractionDigits: 0
                }
            ).format(numericValue);

        case "percentage":
            return `${numericValue.toFixed(2)}%`;

        case "roas":
            return `${numericValue.toFixed(2)}x`;

        default:
            return new Intl.NumberFormat(
                "en-US",
                {
                    maximumFractionDigits: 0
                }
            ).format(numericValue);
    }
}

function formatCompactNumber(value) {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
        return "0";
    }

    const absoluteValue = Math.abs(
        numericValue
    );

    if (absoluteValue >= 1_000_000_000) {
        return `${(
            numericValue /
            1_000_000_000
        ).toFixed(1)}B`;
    }

    if (absoluteValue >= 1_000_000) {
        return `${(
            numericValue /
            1_000_000
        ).toFixed(1)}M`;
    }

    if (absoluteValue >= 1_000) {
        return `${(
            numericValue /
            1_000
        ).toFixed(1)}K`;
    }

    return new Intl.NumberFormat(
        "en-US",
        {
            maximumFractionDigits: 0
        }
    ).format(numericValue);
}

function formatChartTick(
    value,
    format = "integer"
) {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
        return "";
    }

    switch (format) {
        case "currency":
            return `$${formatCompactNumber(
                numericValue
            )}`;

        case "percentage":
            return `${numericValue}%`;

        case "roas":
            return `${numericValue}x`;

        default:
            return formatCompactNumber(
                numericValue
            );
    }
}


/* -- SHARED CHART OPTIONS --*/

function createTooltipOptions(
    chartConfig
) {
    return {
        displayColors: false,

        callbacks: {
            label(context) {
                return formatChartValue(
                    context.raw,
                    chartConfig.format
                );
            }
        }
    };
}

function createLinearScale(
    chartConfig
) {
    return {
        beginAtZero: true,

        ticks: {
            color: CHART_COLORS.text,

            callback(value) {
                return formatChartTick(
                    value,
                    chartConfig.format
                );
            }
        },

        grid: {
            color: CHART_COLORS.grid
        },

        border: {
            display: false
        }
    };
}

function createCategoryScale({
    displayGrid = false,
    autoSkip = false,
    maxTicksLimit = undefined,
    maxRotation = 0,
    minRotation = 0
} = {}) {
    return {
        ticks: {
            color: CHART_COLORS.text,
            autoSkip,
            maxTicksLimit,
            maxRotation,
            minRotation
        },

        grid: {
            display: displayGrid
        },

        border: {
            color: CHART_COLORS.grid
        }
    };
}


/* -- LINE CHART --*/

function createLineChart(
    canvasId,
    chartConfig
) {
    const canvas = getChartCanvas(
        canvasId
    );

    if (!canvas) {
        return null;
    }

    return new Chart(
        canvas,
        {
            type: "line",

            data: {
                labels:
                    chartConfig.labels ?? [],

                datasets: [
                    {
                        label:
                            chartConfig.label ??
                            "",

                        data:
                            chartConfig.data ?? [],

                        borderColor:
                            chartConfig.color,

                        backgroundColor:
                            chartConfig.color,

                        borderWidth: 1.75,
                        pointRadius: 2.5,
                        pointHoverRadius: 4.5,
                        tension: 0.35,
                        fill: false
                    }
                ]
            },

            options: {
                ...COMMON_CHART_OPTIONS,

                interaction: {
                    mode: "index",
                    intersect: false
                },

                plugins: {
                    legend: {
                        display: false
                    },

                    tooltip:
                        createTooltipOptions(
                            chartConfig
                        )
                },

                scales: {
    x: createCategoryScale({
        displayGrid: false,
        autoSkip: true,
        maxTicksLimit: 12,
        maxRotation: 45,
        minRotation: 0
    }),

    y: createLinearScale(
        chartConfig
    )
}
            }
        }
    );
}


/* -- HORIZONTAL BAR CHART --*/

function createHorizontalBarChart(
    canvasId,
    chartConfig
) {
    const canvas = getChartCanvas(
        canvasId
    );

    if (!canvas) {
        return null;
    }

    return new Chart(
        canvas,
        {
            type: "bar",

            data: {
                labels:
                    chartConfig.labels ?? [],

                datasets: [
                    {
                        label:
                            chartConfig.label ??
                            "",

                        data:
                            chartConfig.data ?? [],

                        backgroundColor:
                            chartConfig.color,

                        borderColor:
                            chartConfig.color,

                        borderWidth: 1,
                        borderRadius: 5,
                        barThickness: 18
                    }
                ]
            },

            options: {
                ...COMMON_CHART_OPTIONS,

                indexAxis: "y",

                interaction: {
                    mode: "nearest",
                    intersect: false
                },

                plugins: {
                    legend: {
                        display: false
                    },

                    tooltip:
                        createTooltipOptions(
                            chartConfig
                        )
                },

                scales: {
                    x: createLinearScale(
                        chartConfig
                    ),

                    y: createCategoryScale({
                        displayGrid: false,
                        autoSkip: false
                    })
                }
            }
        }
    );
}


/* -- VERTICAL BAR CHART --*/

function createVerticalBarChart(
    canvasId,
    chartConfig
) {
    const canvas = getChartCanvas(
        canvasId
    );

    if (!canvas) {
        return null;
    }

    return new Chart(
        canvas,
        {
            type: "bar",

            data: {
                labels:
                    chartConfig.labels ?? [],

                datasets: [
                    {
                        label:
                            chartConfig.label ??
                            "",

                        data:
                            chartConfig.data ?? [],

                        backgroundColor:
                            chartConfig.color,

                        borderColor:
                            chartConfig.color,

                        borderWidth: 1,
                        borderRadius: 5
                    }
                ]
            },

            options: {
                ...COMMON_CHART_OPTIONS,

                interaction: {
                    mode: "nearest",
                    intersect: false
                },

                plugins: {
                    legend: {
                        display: false
                    },

                    tooltip:
                        createTooltipOptions(
                            chartConfig
                        )
                },

                scales: {
                    x: createCategoryScale({
                        displayGrid: false,
                        autoSkip: false,
                        maxRotation: 45,
                        minRotation: 0
                    }),

                    y: createLinearScale(
                        chartConfig
                    )
                }
            }
        }
    );
}


/* -- DOUGHNUT CHART --*/

function createDoughnutChart(
    canvasId,
    chartConfig
) {
    const canvas = getChartCanvas(
        canvasId
    );

    if (!canvas) {
        return null;
    }

    return new Chart(
        canvas,
        {
            type: "doughnut",

            data: {
                labels:
                    chartConfig.labels ?? [],

                datasets: [
                    {
                        data:
                            chartConfig.data ?? [],

                        backgroundColor:
                            chartConfig.colors ?? [],

                        borderColor:
                            CHART_COLORS.surface,

                        borderWidth: 4,
                        hoverOffset: 8
                    }
                ]
            },

            options: {
                ...COMMON_CHART_OPTIONS,

                cutout: "68%",

                plugins: {
                    legend: {
                        position: "bottom",

                        labels: {
                            color:
                                CHART_COLORS.text,

                            padding: 20,
                            usePointStyle: true,
                            pointStyle: "circle"
                        }
                    },

                    tooltip: {
                        displayColors: false,

                        callbacks: {
                            label(context) {
                                const values =
                                    context.dataset
                                        .data;

                                const total =
                                    values.reduce(
                                        (
                                            sum,
                                            value
                                        ) => {
                                            return (
                                                sum +
                                                Number(
                                                    value
                                                )
                                            );
                                        },
                                        0
                                    );

                                const value = Number(
                                    context.raw
                                );

                                const percentage =
                                    total > 0
                                        ? (
                                            (
                                                value /
                                                total
                                            ) *
                                            100
                                        ).toFixed(1)
                                        : "0.0";

                                return (
                                    `${context.label}: ` +
                                    `${formatChartValue(
                                        value,
                                        "integer"
                                    )} ` +
                                    `(${percentage}%)`
                                );
                            }
                        }
                    }
                }
            }
        }
    );
}