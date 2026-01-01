"""
Payment Method Schemas
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from decimal import Decimal
from datetime import datetime
from app.models.payment_method import PaymentMethodType


class PaymentMethodCreate(BaseModel):
    type: PaymentMethodType
    alias: str = Field(..., min_length=1, max_length=100)
    config: Dict[str, Any]  # Flexible config based on type
    daily_limit_count: Optional[int] = None
    daily_limit_amount: Optional[Decimal] = None
    notes: Optional[str] = None


class PaymentMethodUpdate(BaseModel):
    alias: Optional[str] = Field(None, min_length=1, max_length=100)
    config: Optional[Dict[str, Any]] = None
    status: Optional[str] = None
    daily_limit_count: Optional[int] = None
    daily_limit_amount: Optional[Decimal] = None
    notes: Optional[str] = None


class PaymentMethodResponse(BaseModel):
    id: int
    type: str
    alias: str
    config: Dict[str, Any]
    status: str
    daily_limit_count: Optional[int]
    daily_limit_amount: Optional[Decimal]
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class PaymentMethodPublicResponse(BaseModel):
    """Public response with sensitive data masked"""
    id: int
    type: str
    alias: str
    # Only show relevant fields, mask others
    display_info: Dict[str, str]

    class Config:
        from_attributes = True


class PaymentMethodListResponse(BaseModel):
    payment_methods: list[PaymentMethodResponse]
    total: int
