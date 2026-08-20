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

function getPreviousPeriodRange(
    startDate,
    endDate
) {
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

    const previousEndDate =
        new Date(startDate);

    previousEndDate.setDate(
        previousEndDate.getDate() - 1
    );

    const previousStartDate =
        new Date(previousEndDate);

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

    if (
        change !== null &&
        change > 0
    ) {
        direction = "positive";
    }

    if (
        change !== null &&
        change < 0
    ) {
        direction = "negative";
    }

    return {
        currentValue,
        previousValue,
        change,
        direction
    };
}