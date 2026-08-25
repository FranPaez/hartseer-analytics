from pydantic import BaseModel

from app.schemas.common import MetaSchema


class MarketingTrendSchema(BaseModel):
    """Marketing trend data."""

    period: str
    channel: str
    revenue: float
    profit: float
    marketing_cost: float
    roas: float


class MarketingDataSchema(BaseModel):
    """Marketing dashboard data."""

    revenue: float
    profit: float
    margin: float
    marketing_cost: float
    roas: float
    net_profit: float
    trends: list[MarketingTrendSchema]


class MarketingResponseSchema(BaseModel):
    """Marketing dashboard response."""

    success: bool
    data: MarketingDataSchema
    meta: MetaSchema