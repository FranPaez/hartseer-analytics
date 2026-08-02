from pydantic import BaseModel

from app.schemas.common import MetaSchema


class HealthDataSchema(BaseModel):
    """Health check response data."""

    status: str
    database: str


class HealthResponseSchema(BaseModel):
    """Complete health check response."""

    success: bool
    data: HealthDataSchema
    meta: MetaSchema