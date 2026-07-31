from fastapi import FastAPI


app = FastAPI(
    title="Hartseer Analytics API",
    description=(
        "REST API responsible for exposing business analytics data "
        "used by Hartseer Analytics dashboards."
    ),
    version="1.0.0",
    contact={
        "name": "Franco Paez",
    },
    license_info={
        "name": "MIT License",
    },
)