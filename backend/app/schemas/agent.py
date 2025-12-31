"""
Agent Schemas
"""
from pydantic import BaseModel, Field
from typing import Optional
from decimal import Decimal
from datetime import datetime


class AgentCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)
    email: Optional[str] = None
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    shop_name: Optional[str] = Field(None, max_length=200)
    province: Optional[str] = Field(None, max_length=100)
    city: Optional[str] = Field(None, max_length=100)
    address_details: Optional[str] = None
    notes: Optional[str] = None


class AgentUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    shop_name: Optional[str] = Field(None, max_length=200)
    province: Optional[str] = Field(None, max_length=100)
    city: Optional[str] = Field(None, max_length=100)
    address_details: Optional[str] = None
    notes: Optional[str] = None


class CreditAdjustment(BaseModel):
    amount: Decimal = Field(..., description="Positive to add, negative to deduct")
    notes: Optional[str] = None


class AgentResponse(BaseModel):
    id: int
    user_id: int
    username: str
    email: Optional[str]
    first_name: str
    last_name: str
    phone: Optional[str]
    shop_name: Optional[str]
    province: Optional[str]
    city: Optional[str]
    credit_confirmed: Decimal
    credit_pending: Decimal
    total_credit: float
    is_negative: bool
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class AgentListResponse(BaseModel):
    agents: list[AgentResponse]
    total: int
    page: int
    page_size: int
