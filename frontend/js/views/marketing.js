"use strict";


/* -- MARKETING VIEW --*/

function renderMarketing() {
    const trendMarkup = (metricName) => `
        <span
            id="marketing-${metricName}-trend"
            class="kpi-card__change kpi-card__change--neutral"
        >
            <img
                id="marketing-${metricName}-trend-icon"
                src="./frontend/assets/icons/trends/minus.svg"
                alt=""
                class="kpi-card__trend-icon"
            >

            <span id="marketing-${metricName}-change">—</span>
        </span>
    `;

    return `
        <header class="dashboard-header">
            <div class="dashboard-header__info">
                <h1 class="dashboard-header__title">Marketing Dashboard</h1>
                <p class="dashboard-header__subtitle">Channel performance, advertising efficiency and profitability</p>
            </div>

            <div class="dashboard-header__filters">
                <div class="dropdown-filter">
                    <label for="marketing-channel" class="dropdown-filter__label">Channel</label>
                    <select id="marketing-channel" name="marketing-channel" class="dropdown-filter__select">
                        <option value="all">All Channels</option>
                    </select>
                </div>

                <div class="date-filter">
                    <div class="date-filter__field">
                        <label for="marketing-start-date">From</label>
                        <input type="date" id="marketing-start-date" name="marketing-start-date">
                    </div>

                    <div class="date-filter__field">
                        <label for="marketing-end-date">To</label>
                        <input type="date" id="marketing-end-date" name="marketing-end-date">
                    </div>
                </div>
            </div>
        </header>

        <section class="dashboard-content">
            <section class="kpi-grid kpi-grid--six" aria-label="Marketing KPIs">
                ${[
                    ["revenue", "Revenue", "dollar-sign.svg"],
                    ["profit", "Profit", "dollar-sign.svg"],
                    ["margin", "Margin %", "percent.svg"],
                    ["spend", "Ad Spend", "dollar-sign.svg"],
                    ["roas", "ROAS", "trending-up.svg"],
                    ["net-profit", "Net Profit", "dollar-sign.svg"]
                ].map(([key, title, icon]) => `
                    <article class="kpi-card">
                        <div class="kpi-card__header">
                            <div class="kpi-card__icon" aria-hidden="true">
                                <img src="./frontend/assets/icons/cards/${icon}" alt="" class="kpi-card__icon-image">
                            </div>
                            <h2 class="kpi-card__title">${title}</h2>
                        </div>

                        <p id="marketing-${key}-value" class="kpi-card__value">—</p>

                        <div class="kpi-card__comparison">
                            ${trendMarkup(key)}
                            <span class="kpi-card__comparison-label">vs previous period</span>
                        </div>
                    </article>
                `).join("")}
            </section>

            <section class="chart-grid chart-grid--two-columns chart-grid--marketing" aria-label="Marketing visualizations">
                ${[
                    ["revenue", "Revenue by Channel", "Revenue comparison across marketing channels"],
                    ["profit", "Profit by Channel", "Profit comparison across marketing channels"],
                    ["spend", "Ad Spend by Channel", "Advertising investment by marketing channel"],
                    ["roas", "ROAS by Channel", "Advertising return by marketing channel"]
                ].map(([key, title, subtitle]) => `
                    <article class="chart-card">
                        <header class="chart-card__header">
                            <div>
                                <h2 class="chart-card__title">${title}</h2>
                                <p class="chart-card__subtitle">${subtitle}</p>
                            </div>
                        </header>

                        <div class="chart-card__body">
                            <canvas id="marketing-${key}-chart" aria-label="${title}" role="img"></canvas>
                        </div>
                    </article>
                `).join("")}
            </section>
        </section>
    `;
}
