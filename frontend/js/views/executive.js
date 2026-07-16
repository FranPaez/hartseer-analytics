"use strict";


/* -- EXECUTIVE VIEW --*/

function renderExecutive() {
    return `
        <header class="dashboard-header">
            <div class="dashboard-header__info">
                <h1 class="dashboard-header__title">
                    Executive Dashboard
                </h1>

                <p class="dashboard-header__subtitle">
                    Overview of the business performance
                </p>
            </div>

            <div class="dashboard-header__filters">
                <div class="date-filter">
                    <div class="date-filter__field">
                        <label for="executive-start-date">
                            From
                        </label>

                        <input
                            type="date"
                            id="executive-start-date"
                            name="executive-start-date"
                        >
                    </div>

                    <div class="date-filter__field">
                        <label for="executive-end-date">
                            To
                        </label>

                        <input
                            type="date"
                            id="executive-end-date"
                            name="executive-end-date"
                        >
                    </div>
                </div>
            </div>
        </header>

        <section class="dashboard-content">
            <section
                class="kpi-grid kpi-grid--six"
                aria-label="Executive KPIs"
            >
                <article class="kpi-card">
                    <div class="kpi-card__header">
                        <div
                            class="kpi-card__icon"
                            aria-hidden="true"
                        >
                            <img
                                src="./assets/icons/cards/dollar-sign.svg"
                                alt=""
                                class="kpi-card__icon-image"
                            >
                        </div>

                        <h2 class="kpi-card__title">
                            Revenue
                        </h2>
                    </div>

                    <p
                        id="executive-revenue-value"
                        class="kpi-card__value"
                    >
                        —
                    </p>

                    <div class="kpi-card__comparison">
                        <span
                            id="executive-revenue-trend"
                            class="kpi-card__change kpi-card__change--neutral"
                        >
                            <img
                                id="executive-revenue-trend-icon"
                                src="./assets/icons/trends/minus.svg"
                                alt=""
                                class="kpi-card__trend-icon"
                            >

                            <span id="executive-revenue-change">
                                —
                            </span>
                        </span>

                        <span class="kpi-card__comparison-label">
                            vs previous period
                        </span>
                    </div>
                </article>

                <article class="kpi-card">
                    <div class="kpi-card__header">
                        <div
                            class="kpi-card__icon"
                            aria-hidden="true"
                        >
                            <img
                                src="./assets/icons/cards/dollar-sign.svg"
                                alt=""
                                class="kpi-card__icon-image"
                            >
                        </div>

                        <h2 class="kpi-card__title">
                            Profit
                        </h2>
                    </div>

                    <p
                        id="executive-profit-value"
                        class="kpi-card__value"
                    >
                        —
                    </p>

                    <div class="kpi-card__comparison">
                        <span
                            id="executive-profit-trend"
                            class="kpi-card__change kpi-card__change--neutral"
                        >
                            <img
                                id="executive-profit-trend-icon"
                                src="./assets/icons/trends/minus.svg"
                                alt=""
                                class="kpi-card__trend-icon"
                            >

                            <span id="executive-profit-change">
                                —
                            </span>
                        </span>

                        <span class="kpi-card__comparison-label">
                            vs previous period
                        </span>
                    </div>
                </article>

                <article class="kpi-card">
                    <div class="kpi-card__header">
                        <div
                            class="kpi-card__icon"
                            aria-hidden="true"
                        >
                            <img
                                src="./assets/icons/cards/percent.svg"
                                alt=""
                                class="kpi-card__icon-image"
                            >
                        </div>

                        <h2 class="kpi-card__title">
                            Margin %
                        </h2>
                    </div>

                    <p
                        id="executive-margin-value"
                        class="kpi-card__value"
                    >
                        —
                    </p>

                    <div class="kpi-card__comparison">
                        <span
                            id="executive-margin-trend"
                            class="kpi-card__change kpi-card__change--neutral"
                        >
                            <img
                                id="executive-margin-trend-icon"
                                src="./assets/icons/trends/minus.svg"
                                alt=""
                                class="kpi-card__trend-icon"
                            >

                            <span id="executive-margin-change">
                                —
                            </span>
                        </span>

                        <span class="kpi-card__comparison-label">
                            vs previous period
                        </span>
                    </div>
                </article>

                <article class="kpi-card">
                    <div class="kpi-card__header">
                        <div
                            class="kpi-card__icon"
                            aria-hidden="true"
                        >
                            <img
                                src="./assets/icons/cards/shopping-cart.svg"
                                alt=""
                                class="kpi-card__icon-image"
                            >
                        </div>

                        <h2 class="kpi-card__title">
                            Orders
                        </h2>
                    </div>

                    <p
                        id="executive-orders-value"
                        class="kpi-card__value"
                    >
                        —
                    </p>

                    <div class="kpi-card__comparison">
                        <span
                            id="executive-orders-trend"
                            class="kpi-card__change kpi-card__change--neutral"
                        >
                            <img
                                id="executive-orders-trend-icon"
                                src="./assets/icons/trends/minus.svg"
                                alt=""
                                class="kpi-card__trend-icon"
                            >

                            <span id="executive-orders-change">
                                —
                            </span>
                        </span>

                        <span class="kpi-card__comparison-label">
                            vs previous period
                        </span>
                    </div>
                </article>

                <article class="kpi-card">
                    <div class="kpi-card__header">
                        <div
                            class="kpi-card__icon"
                            aria-hidden="true"
                        >
                            <img
                                src="./assets/icons/cards/receipt.svg"
                                alt=""
                                class="kpi-card__icon-image"
                            >
                        </div>

                        <h2 class="kpi-card__title">
                            AOV
                        </h2>
                    </div>

                    <p
                        id="executive-aov-value"
                        class="kpi-card__value"
                    >
                        —
                    </p>

                    <div class="kpi-card__comparison">
                        <span
                            id="executive-aov-trend"
                            class="kpi-card__change kpi-card__change--neutral"
                        >
                            <img
                                id="executive-aov-trend-icon"
                                src="./assets/icons/trends/minus.svg"
                                alt=""
                                class="kpi-card__trend-icon"
                            >

                            <span id="executive-aov-change">
                                —
                            </span>
                        </span>

                        <span class="kpi-card__comparison-label">
                            vs previous period
                        </span>
                    </div>
                </article>

                <article class="kpi-card">
                    <div class="kpi-card__header">
                        <div
                            class="kpi-card__icon"
                            aria-hidden="true"
                        >
                            <img
                                src="./assets/icons/cards/users.svg"
                                alt=""
                                class="kpi-card__icon-image"
                            >
                        </div>

                        <h2 class="kpi-card__title">
                            Customers
                        </h2>
                    </div>

                    <p
                        id="executive-customers-value"
                        class="kpi-card__value"
                    >
                        —
                    </p>

                    <div class="kpi-card__comparison">
                        <span
                            id="executive-customers-trend"
                            class="kpi-card__change kpi-card__change--neutral"
                        >
                            <img
                                id="executive-customers-trend-icon"
                                src="./assets/icons/trends/minus.svg"
                                alt=""
                                class="kpi-card__trend-icon"
                            >

                            <span id="executive-customers-change">
                                —
                            </span>
                        </span>

                        <span class="kpi-card__comparison-label">
                            vs previous period
                        </span>
                    </div>
                </article>
            </section>

            <section
                class="chart-grid chart-grid--two-columns"
                aria-label="Executive visualizations"
            >
                <article class="chart-card">
                    <header class="chart-card__header">
                        <div>
                            <h2 class="chart-card__title">
                                Revenue Trend
                            </h2>

                            <p class="chart-card__subtitle">
                                Revenue evolution over the selected period
                            </p>
                        </div>
                    </header>

                    <div class="chart-card__body">
                        <canvas
                            id="revenue-chart"
                            aria-label="Revenue evolution during the selected period"
                            role="img"
                        ></canvas>
                    </div>
                </article>

                <article class="chart-card">
                    <header class="chart-card__header">
                        <div>
                            <h2 class="chart-card__title">
                                Profit Trend
                            </h2>

                            <p class="chart-card__subtitle">
                                Profit evolution over the selected period
                            </p>
                        </div>
                    </header>

                    <div class="chart-card__body">
                        <canvas
                            id="profit-chart"
                            aria-label="Profit evolution during the selected period"
                            role="img"
                        ></canvas>
                    </div>
                </article>
            </section>
        </section>
    `;
}