from datetime import datetime
from typing import Any

from fastapi.responses import JSONResponse

from app.core.config import settings


def success_response(
    data: Any,
    meta: dict | None = None,
    status_code: int = 200,
) -> JSONResponse:
    """
    Build a standardized successful API response.
    """

    response = {
        "success": True,
        "data": data,
        "meta": {
            "api_version": settings.API_VERSION,
            "timestamp": datetime.utcnow().isoformat(),
        },
    }

    if meta:
        response["meta"].update(meta)

    return JSONResponse(
        status_code=status_code,
        content=response,
    )


def error_response(
    code: str,
    message: str,
    status_code: int,
    details: dict | None = None,
    meta: dict | None = None,
) -> JSONResponse:
    """
    Build a standardized error API response.
    """

    response = {
        "success": False,
        "error": {
            "code": code,
            "message": message,
        },
        "meta": {
            "api_version": settings.API_VERSION,
            "timestamp": datetime.utcnow().isoformat(),
        },
    }

    if details:
        response["error"]["details"] = details

    if meta:
        response["meta"].update(meta)

    return JSONResponse(
        status_code=status_code,
        content=response,
    )