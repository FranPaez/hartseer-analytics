from pydantic import BaseModel

from app.schemas.common import MetaSchema


class ExecutiveTrendSchema(BaseModel):
    """Executive dashboard trend data."""

    period: str
    revenue: float
    profit: float


class ExecutiveDataSchema(BaseModel):
    """Executive dashboard KPI data."""

    revenue: float
    profit: float
    margin: float
    orders: int
    customers: int
    aov: float
    trends: list[ExecutiveTrendSchema]


class ExecutiveResponseSchema(BaseModel):
    """Executive dashboard response."""

    success: bool
    data: ExecutiveDataSchema
    meta: MetaSchema