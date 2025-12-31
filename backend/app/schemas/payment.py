"""
Payment Schemas
"""
from pydantic import BaseModel, Field
from typing import Optional
from decimal import Decimal
from datetime import datetime


class PaymentCreate(BaseModel):
    amount: Decimal = Field(..., gt=0)
    payment_method_id: int


class PaymentApprove(BaseModel):
    admin_notes: Optional[str] = None


class PaymentReject(BaseModel):
    admin_notes: str = Field(..., min_length=1)


class PaymentResponse(BaseModel):
    id: int
    user_id: int
    username: str
    amount: Decimal
    payment_method_id: int
    payment_method_alias: str
    receipt_url: Optional[str]
    status: str
    admin_notes: Optional[str]
    processed_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class PaymentListResponse(BaseModel):
    payments: list[PaymentResponse]
    total: int
    page: int
    page_size: int
