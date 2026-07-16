"use strict";


/* -- APPLICATION INITIALIZATION --*/

async function initApp() {
    try {
        await loadApplicationData();

        initRouter();
    } catch (error) {
        console.error(
            "No fue posible inicializar Hartseer:",
            error
        );
    }
}

initApp();