from pydantic import BaseModel


class MetaSchema(BaseModel):
    """Metadata included in every API response."""

    api_version: str
    timestamp: str


class ErrorDetailSchema(BaseModel):
    """Standard error response."""

    code: str
    message: str
    details: dict | None = None