from pydantic import BaseModel

from app.schemas.common import MetaSchema


class CustomerFinancialSchema(BaseModel):
    """Customer financial performance."""

    customer: str
    revenue: float
    profit: float


class CustomersDataSchema(BaseModel):
    """Customers dashboard data."""

    new_customers: int
    returning_customers: int
    total_orders: int
    recurrence_rate: float

    top_revenue: CustomerFinancialSchema
    top_profit: CustomerFinancialSchema

    revenue_ranking: list[CustomerFinancialSchema]
    profit_ranking: list[CustomerFinancialSchema]


class CustomersResponseSchema(BaseModel):
    """Customers dashboard response."""

    success: bool
    data: CustomersDataSchema
    meta: MetaSchema