from pydantic import BaseModel


class MarketingSchema(BaseModel):
    """Marketing dashboard response schema."""

    revenue: float
    profit: float
    margin: float
    marketing_cost: float
    roas: float
    net_profit: float