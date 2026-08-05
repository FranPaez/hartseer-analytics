from pydantic import BaseModel

from app.schemas.common import MetaSchema


class CustomersDataSchema(BaseModel):
    """Customers dashboard data."""

    new_customers: int
    returning_customers: int
    total_orders: int
    recurrence_rate: float


class CustomersResponseSchema(BaseModel):
    """Customers dashboard response."""

    success: bool
    data: CustomersDataSchema
    meta: MetaSchema