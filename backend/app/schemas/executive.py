from pydantic import BaseModel

from app.schemas.common import MetaSchema


class ExecutiveDataSchema(BaseModel):
    """Executive dashboard KPI data."""

    revenue: float
    profit: float
    margin: float
    orders: int
    customers: int
    aov: float


class ExecutiveResponseSchema(BaseModel):
    """Executive dashboard response."""

    success: bool
    data: ExecutiveDataSchema
    meta: MetaSchema