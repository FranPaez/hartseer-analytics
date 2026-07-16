"use strict";


/* -- PRODUCTS VIEW --*/

function renderProducts() {
    return `
        <header class="dashboard-header">
            <div class="dashboard-header__info">
                <h1 class="dashboard-header__title">
                    Products Dashboard
                </h1>

                <p class="dashboard-header__subtitle">
                    Product performance by category, brand and product
                </p>
            </div>

            <div class="dashboard-header__filters">
                <div class="dropdown-filter">
                    <label
                        for="product-dimension"
                        class="dropdown-filter__label"
                    >
                        Group by
                    </label>

                    <select
                        id="product-dimension"
                        name="product-dimension"
                        class="dropdown-filter__select"
                    >
                        <option value="category">Category</option>
                        <option value="brand">Brand</option>
                        <option value="product">Product</option>
                    </select>
                </div>

                <div class="date-filter">
                    <div class="date-filter__field">
                        <label for="products-start-date">From</label>

                        <input
                            type="date"
                            id="products-start-date"
                            name="products-start-date"
                        >
                    </div>

                    <div class="date-filter__field">
                        <label for="products-end-date">To</label>

                        <input
                            type="date"
                            id="products-end-date"
                            name="products-end-date"
                        >
                    </div>
                </div>
            </div>
        </header>

        <section class="dashboard-content">
            <section
                class="kpi-grid kpi-grid--three"
                aria-label="Products KPIs"
            >
                <article class="kpi-card">
                    <div class="kpi-card__header">
                        <div class="kpi-card__icon" aria-hidden="true">
                            <img
                                src="./frontend/assets/icons/cards/dollar-sign.svg"
                                alt=""
                                class="kpi-card__icon-image"
                            >
                        </div>

                        <h2
                            id="products-kpi-title-1"
                            class="kpi-card__title"
                        >
                            Top Revenue Category
                        </h2>
                    </div>

                    <p
                        id="products-kpi-value-1"
                        class="kpi-card__value"
                    >
                        —
                    </p>

                    <div class="kpi-card__comparison">
                        <span
                            id="products-kpi-metric-1"
                            class="kpi-card__metric"
                        >
                            —
                        </span>

                        <span
                            id="products-kpi-label-1"
                            class="kpi-card__comparison-label"
                        >
                            highest category revenue
                        </span>
                    </div>
                </article>

                <article class="kpi-card">
                    <div class="kpi-card__header">
                        <div class="kpi-card__icon" aria-hidden="true">
                            <img
                                src="./frontend/assets/icons/cards/dollar-sign.svg"
                                alt=""
                                class="kpi-card__icon-image"
                            >
                        </div>

                        <h2
                            id="products-kpi-title-2"
                            class="kpi-card__title"
                        >
                            Top Profit Category
                        </h2>
                    </div>

                    <p
                        id="products-kpi-value-2"
                        class="kpi-card__value"
                    >
                        —
                    </p>

                    <div class="kpi-card__comparison">
                        <span
                            id="products-kpi-metric-2"
                            class="kpi-card__metric"
                        >
                            —
                        </span>

                        <span
                            id="products-kpi-label-2"
                            class="kpi-card__comparison-label"
                        >
                            highest category profit
                        </span>
                    </div>
                </article>

                <article class="kpi-card">
                    <div class="kpi-card__header">
                        <div class="kpi-card__icon" aria-hidden="true">
                            <img
                                src="./frontend/assets/icons/cards/trending-up.svg"
                                alt=""
                                class="kpi-card__icon-image"
                            >
                        </div>

                        <h2
                            id="products-kpi-title-3"
                            class="kpi-card__title"
                        >
                            Top Margin Category
                        </h2>
                    </div>

                    <p
                        id="products-kpi-value-3"
                        class="kpi-card__value"
                    >
                        —
                    </p>

                    <div class="kpi-card__comparison">
                        <span
                            id="products-kpi-metric-3"
                            class="kpi-card__metric"
                        >
                            —
                        </span>

                        <span
                            id="products-kpi-label-3"
                            class="kpi-card__comparison-label"
                        >
                            highest category margin
                        </span>
                    </div>
                </article>
            </section>

            <section
                class="chart-grid chart-grid--three-columns"
                aria-label="Products visualizations"
            >
                ${[1,2,3].map((number) => `
                    <article class="chart-card">
                        <header class="chart-card__header">
                            <div>
                                <h2
                                    id="products-chart-title-${number}"
                                    class="chart-card__title"
                                >
                                    —
                                </h2>

                                <p
                                    id="products-chart-subtitle-${number}"
                                    class="chart-card__subtitle"
                                >
                                    —
                                </p>
                            </div>
                        </header>

                        <div class="chart-card__body">
                            <canvas
                                id="products-chart-${number}"
                                aria-label="Product visualization ${number}"
                                role="img"
                            ></canvas>
                        </div>
                    </article>
                `).join("")}
            </section>
        </section>
    `;
}
