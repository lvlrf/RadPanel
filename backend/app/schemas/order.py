"""
Order Schemas
"""
from pydantic import BaseModel, Field
from typing import Optional
from decimal import Decimal
from datetime import datetime


class OrderCreate(BaseModel):
    plan_id: int
    username: str = Field(..., min_length=3, max_length=50)
    alias: Optional[str] = Field(None, max_length=200)
    on_hold: bool = False


class OrderResponse(BaseModel):
    id: int
    user_id: int
    plan_id: int
    plan_name: str
    amount: Decimal
    marzban_username: str
    alias: Optional[str]
    subscription_url: Optional[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class OrderDetailResponse(OrderResponse):
    expire_date: Optional[datetime]
    data_limit_gb: Optional[int]
    data_used_gb: Optional[int]


class OrderListResponse(BaseModel):
    orders: list[OrderResponse]
    total: int
    page: int
    page_size: int
