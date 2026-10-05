"use strict";


/* -- API CONFIGURATION --*/

const API_BASE_URL = "https://hartseer-analytics-production.up.railway.app/api/v1";


/* -- API ENDPOINTS --*/

const API_ENDPOINTS = {
    executive: `${API_BASE_URL}/executive`,
    products: `${API_BASE_URL}/products`,
    customers: `${API_BASE_URL}/customers`,
    marketing: `${API_BASE_URL}/marketing`
};

/* -- API REQUEST CACHE --*/

const pendingRequests = new Map();
const API_REQUEST_TIMEOUT_MS = 60_000;
const API_MAX_ATTEMPTS = 3;
const API_RETRY_DELAY_MS = 1_000;
const API_TRANSIENT_STATUSES = new Set([502, 503, 504]);

async function fetchApiResponse(url, signal) {
    for (let attempt = 1; attempt <= API_MAX_ATTEMPTS; attempt += 1) {
        try {
            const response = await fetch(url, { signal });

            if (response.ok) {
                return response;
            }

            const error = new Error(
                `No se pudo obtener la información de la API: ${response.status}`
            );
            error.status = response.status;
            throw error;
        } catch (error) {
            const retryable = (
                error.name === "TypeError" ||
                API_TRANSIENT_STATUSES.has(error.status)
            );

            if (signal.aborted || !retryable || attempt === API_MAX_ATTEMPTS) {
                throw error;
            }

            await new Promise((resolve) => setTimeout(resolve, API_RETRY_DELAY_MS));
        }
    }
}

/* -- API REQUEST --*/


async function fetchApiData(
    endpoint,
    params = {}
) {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(
        ([key, value]) => {
            if (
                value !== null &&
                value !== undefined &&
                value !== ""
            ) {
                queryParams.append(
                    key,
                    value
                );
            }
        }
    );

    const queryString =
        queryParams.toString();

    const url =
        queryString.length > 0
            ? `${endpoint}?${queryString}`
            : endpoint;

    if (pendingRequests.has(url)) {
        return pendingRequests.get(url);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(
        () => controller.abort(),
        API_REQUEST_TIMEOUT_MS
    );

    const request = fetchApiResponse(url, controller.signal)
        .then((response) => response.json())
        .then((result) => {
            if (
                !result ||
                result.success !== true ||
                !result.data
            ) {
                throw new Error(
                    `La respuesta de la API no tiene el formato esperado: ${endpoint}`
                );
            }

            return result.data;
        })
        .finally(() => {
            clearTimeout(timeoutId);
            pendingRequests.delete(url);
        });

    pendingRequests.set(url, request);

    return request;
}


/* -- EXECUTIVE --*/

async function getExecutiveData(
    startDate,
    endDate
) {
    return fetchApiData(
        API_ENDPOINTS.executive,
        {
            start_date: startDate,
            end_date: endDate
        }
    );
}


/* -- PRODUCTS --*/

async function getProductsData(
    startDate,
    endDate,
    groupBy
) {
    return fetchApiData(
        API_ENDPOINTS.products,
        {
            start_date: startDate,
            end_date: endDate,
            group_by: groupBy
        }
    );
}


/* -- CUSTOMERS --*/

async function getCustomersData(
    startDate,
    endDate
) {
    return fetchApiData(
        API_ENDPOINTS.customers,
        {
            start_date: startDate,
            end_date: endDate
        }
    );
}


/* -- MARKETING --*/

async function getMarketingData(
    startDate,
    endDate,
    channel = "ALL"
) {
    return fetchApiData(
        API_ENDPOINTS.marketing,
        {
            start_date: startDate,
            end_date: endDate,
            channel
        }
    );
}