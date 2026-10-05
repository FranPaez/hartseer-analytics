from datetime import datetime, timezone
from typing import Any

from fastapi.responses import JSONResponse

from app.core.config import settings


def build_response_meta(meta: dict | None = None) -> dict:
    """Build metadata while preserving the existing UTC timestamp format."""
    response_meta = {
        "api_version": settings.API_VERSION,
        "timestamp": datetime.now(timezone.utc).replace(tzinfo=None).isoformat(),
    }
    if meta:
        response_meta.update(meta)
    return response_meta


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
        "meta": build_response_meta(meta),
    }

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
        "meta": build_response_meta(meta),
    }

    if details:
        response["error"]["details"] = details

    return JSONResponse(
        status_code=status_code,
        content=response,
    )
