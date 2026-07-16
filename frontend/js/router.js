"use strict";


/* -- ROUTE CONFIGURATION --*/

const DEFAULT_ROUTE = "executive";

const routes = {
    executive: {
        render: renderExecutive,
        afterRender: initExecutiveDashboard
    },

    products: {
        render: renderProducts,
        afterRender: initProductsDashboard
    },

    customers: {
        render: renderCustomers,
        afterRender: initCustomersDashboard
    },

    marketing: {
        render: renderMarketing,
        afterRender: initMarketingDashboard
    }
};


/* -- ROUTE HELPERS --*/

function getCurrentRoute() {
    const hash = window.location.hash;
    const route = hash.replace("#/", "").trim();

    if (!Object.hasOwn(routes, route)) {
        return DEFAULT_ROUTE;
    }

    return route;
}

function updateActiveNavigation(route) {
    const navigationLinks = document.querySelectorAll(
        ".sidebar__nav-link[data-route]"
    );

    navigationLinks.forEach((link) => {
        const isActive = link.dataset.route === route;

        link.classList.toggle(
            "sidebar__nav-link--active",
            isActive
        );

        if (isActive) {
            link.setAttribute("aria-current", "page");
        } else {
            link.removeAttribute("aria-current");
        }
    });
}


/* -- VIEW RENDERING --*/

function renderCurrentView(route) {
    const dashboardRoot = document.getElementById(
        "dashboard-root"
    );

    if (!dashboardRoot) {
        console.error(
            "No se encontró el contenedor #dashboard-root."
        );
        return;
    }

    const routeConfig = routes[route];

    dashboardRoot.classList.remove(
        "main-content--entering"
    );

    void dashboardRoot.offsetWidth;

    dashboardRoot.innerHTML = routeConfig.render();

    dashboardRoot.classList.add(
        "main-content--entering"
    );

    if (typeof routeConfig.afterRender === "function") {
        routeConfig.afterRender();
    }

    window.scrollTo(0, 0);
}


/* -- ROUTER --*/

function handleRouteChange() {
    const route = getCurrentRoute();
    const expectedHash = `#/${route}`;

    if (window.location.hash !== expectedHash) {
        window.location.hash = expectedHash;
        return;
    }

    updateActiveNavigation(route);
    renderCurrentView(route);

}

function initRouter() {
    window.addEventListener(
        "hashchange",
        handleRouteChange
    );

    handleRouteChange();
}
