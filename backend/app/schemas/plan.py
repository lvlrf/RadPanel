"""
Plan Schemas
"""
from pydantic import BaseModel, Field
from typing import Optional
from decimal import Decimal
from datetime import datetime


class PlanCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    days: int = Field(..., ge=1)
    data_limit_gb: int = Field(..., ge=1)
    price_public: Decimal = Field(..., ge=0)
    price_agent: Decimal = Field(..., ge=0)


class PlanUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    days: Optional[int] = Field(None, ge=1)
    data_limit_gb: Optional[int] = Field(None, ge=1)
    price_public: Optional[Decimal] = Field(None, ge=0)
    price_agent: Optional[Decimal] = Field(None, ge=0)
    status: Optional[str] = None


class PlanResponse(BaseModel):
    id: int
    name: str
    days: int
    data_limit_gb: int
    price_public: Decimal
    price_agent: Decimal
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class PlanListResponse(BaseModel):
    plans: list[PlanResponse]
    total: int
