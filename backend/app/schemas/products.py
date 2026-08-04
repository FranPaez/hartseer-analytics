from pydantic import BaseModel

from app.schemas.common import MetaSchema


class ProductsMetricSchema(BaseModel):
    """Products dashboard top financial metric."""

    dimension: str
    revenue: float
    profit: float
    margin: float


class ProductsTopSalesSchema(BaseModel):
    """Products dashboard top sales metric."""

    product: str
    units_sold: int


class ProductsFinancialSchema(BaseModel):
    """Products dashboard financial chart."""

    dimension: str
    revenue: float
    profit: float
    margin: float


class ProductsDataSchema(BaseModel):
    """Products dashboard data."""

    top_revenue: ProductsMetricSchema
    top_profit: ProductsMetricSchema
    top_margin: ProductsMetricSchema

    top_sales: ProductsTopSalesSchema

    financial: list[ProductsFinancialSchema]


class ProductsResponseSchema(BaseModel):
    """Products dashboard response."""

    success: bool
    data: ProductsDataSchema
    meta: MetaSchema