"use strict";


/* -- CUSTOMERS VIEW --*/

function renderCustomers() {
    const trendMarkup = (metricName) => `
        <span
            id="customers-${metricName}-trend"
            class="kpi-card__change kpi-card__change--neutral"
        >
            <img
                id="customers-${metricName}-trend-icon"
                src="./frontend/assets/icons/trends/minus.svg"
                alt=""
                class="kpi-card__trend-icon"
            >

            <span id="customers-${metricName}-change">—</span>
        </span>
    `;

    return `
        <header class="dashboard-header">
            <div class="dashboard-header__info">
                <h1 class="dashboard-header__title">Customers Dashboard</h1>

                <p class="dashboard-header__subtitle">
                    Customer behavior, value and recurrence analysis
                </p>
            </div>

            <div class="dashboard-header__filters">
                <div class="date-filter">
                    <div class="date-filter__field">
                        <label for="customers-start-date">From</label>
                        <input type="date" id="customers-start-date" name="customers-start-date">
                    </div>

                    <div class="date-filter__field">
                        <label for="customers-end-date">To</label>
                        <input type="date" id="customers-end-date" name="customers-end-date">
                    </div>
                </div>
            </div>
        </header>

        <section class="dashboard-content">
            <section class="kpi-grid kpi-grid--six" aria-label="Customer KPIs">
                <article class="kpi-card">
                    <div class="kpi-card__header">
                        <div class="kpi-card__icon" aria-hidden="true">
                            <img src="./frontend/assets/icons/cards/user-round-plus.svg" alt="" class="kpi-card__icon-image">
                        </div>
                        <h2 class="kpi-card__title">New Customers</h2>
                    </div>
                    <p id="customers-new-value" class="kpi-card__value">—</p>
                    <div class="kpi-card__comparison">
                        ${trendMarkup("new")}
                        <span class="kpi-card__comparison-label">vs previous period</span>
                    </div>
                </article>

                <article class="kpi-card">
                    <div class="kpi-card__header">
                        <div class="kpi-card__icon" aria-hidden="true">
                            <img src="./frontend/assets/icons/cards/user-star.svg" alt="" class="kpi-card__icon-image">
                        </div>
                        <h2 class="kpi-card__title">Returning Customers</h2>
                    </div>
                    <p id="customers-returning-value" class="kpi-card__value">—</p>
                    <div class="kpi-card__comparison">
                        ${trendMarkup("returning")}
                        <span class="kpi-card__comparison-label">vs previous period</span>
                    </div>
                </article>

                <article class="kpi-card">
                    <div class="kpi-card__header">
                        <div class="kpi-card__icon" aria-hidden="true">
                            <img src="./frontend/assets/icons/cards/user-minus.svg" alt="" class="kpi-card__icon-image">
                        </div>
                        <h2 class="kpi-card__title">One-time Customers</h2>
                    </div>
                    <p id="customers-one-time-value" class="kpi-card__value">—</p>
                    <div class="kpi-card__comparison">
                        ${trendMarkup("one-time")}
                        <span class="kpi-card__comparison-label">vs previous period</span>
                    </div>
                </article>

                <article class="kpi-card">
                    <div class="kpi-card__header">
                        <div class="kpi-card__icon" aria-hidden="true">
                            <img src="./frontend/assets/icons/cards/dollar-sign.svg" alt="" class="kpi-card__icon-image">
                        </div>
                        <h2 class="kpi-card__title">Top Revenue Customer</h2>
                    </div>
                    <p id="customers-top-revenue-name" class="kpi-card__value">—</p>
                    <div class="kpi-card__comparison">
                        <span id="customers-top-revenue-metric" class="kpi-card__metric">—</span>
                        <span class="kpi-card__comparison-label">highest revenue</span>
                    </div>
                </article>

                <article class="kpi-card">
                    <div class="kpi-card__header">
                        <div class="kpi-card__icon" aria-hidden="true">
                            <img src="./frontend/assets/icons/cards/dollar-sign.svg" alt="" class="kpi-card__icon-image">
                        </div>
                        <h2 class="kpi-card__title">Top Profit Customer</h2>
                    </div>
                    <p id="customers-top-profit-name" class="kpi-card__value">—</p>
                    <div class="kpi-card__comparison">
                        <span id="customers-top-profit-metric" class="kpi-card__metric">—</span>
                        <span class="kpi-card__comparison-label">highest profit</span>
                    </div>
                </article>

                <article class="kpi-card">
                    <div class="kpi-card__header">
                        <div class="kpi-card__icon" aria-hidden="true">
                            <img src="./frontend/assets/icons/cards/percent.svg" alt="" class="kpi-card__icon-image">
                        </div>
                        <h2 class="kpi-card__title">Recurrence Rate</h2>
                    </div>
                    <p id="customers-recurrence-value" class="kpi-card__value">—</p>
                    <div class="kpi-card__comparison">
                        ${trendMarkup("recurrence")}
                        <span class="kpi-card__comparison-label">vs previous period</span>
                    </div>
                </article>
            </section>

            <section class="chart-grid chart-grid--three-columns" aria-label="Customer visualizations">
                <article class="chart-card">
                    <header class="chart-card__header"><div><h2 class="chart-card__title">Top Customers by Revenue</h2><p class="chart-card__subtitle">Customers ranked by generated revenue</p></div></header>
                    <div class="chart-card__body"><canvas id="customers-revenue-chart" aria-label="Top customers by revenue" role="img"></canvas></div>
                </article>

                <article class="chart-card">
                    <header class="chart-card__header"><div><h2 class="chart-card__title">Top Customers by Profit</h2><p class="chart-card__subtitle">Customers ranked by generated profit</p></div></header>
                    <div class="chart-card__body"><canvas id="customers-profit-chart" aria-label="Top customers by profit" role="img"></canvas></div>
                </article>

                <article class="chart-card">
                    <header class="chart-card__header"><div><h2 class="chart-card__title">New vs Returning Customers</h2><p class="chart-card__subtitle">Customer distribution during the selected period</p></div></header>
                    <div class="chart-card__body"><canvas id="customers-distribution-chart" aria-label="Customer distribution" role="img"></canvas></div>
                </article>
            </section>
        </section>
    `;
}
