"use strict";


/* -- DATA PATHS --*/

const DATA_PATHS = {
    sales: "./frontend/data/sales.json",
    marketingCosts: "/frontend/data/marketing-costs.json"
};


/* -- DATA STORE --*/

const dataStore = {
    sales: [],
    marketingCosts: [],
    isLoaded: false
};


/* -- JSON LOADING --*/

async function loadJsonFile(path) {
    const response = await fetch(path);

    if (!response.ok) {
        throw new Error(
            `No se pudo cargar el archivo: ${path}`
        );
    }

    return response.json();
}


/* -- DATA INITIALIZATION --*/

async function loadApplicationData() {
    if (dataStore.isLoaded) {
        return dataStore;
    }

    const [
        sales,
        marketingCosts
    ] = await Promise.all([
        loadJsonFile(DATA_PATHS.sales),
        loadJsonFile(DATA_PATHS.marketingCosts)
    ]);

    if (!Array.isArray(sales)) {
        throw new TypeError(
            "sales.json debe contener un array."
        );
    }

    if (!Array.isArray(marketingCosts)) {
        throw new TypeError(
            "marketing-costs.json debe contener un array."
        );
    }

    dataStore.sales = sales;
    dataStore.marketingCosts = marketingCosts;
    dataStore.isLoaded = true;

    return dataStore;
}


/* -- DATA ACCESS --*/

function getSalesData() {
    return dataStore.sales;
}

function getMarketingCostsData() {
    return dataStore.marketingCosts;
}

function isApplicationDataLoaded() {
    return dataStore.isLoaded;
}