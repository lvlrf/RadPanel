"""
Plan Model - VPN Plans
"""
from sqlalchemy import Column, Integer, String, Numeric, DateTime, Enum, func
from sqlalchemy.orm import relationship
import enum

from app.database import Base


class PlanStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"


class Plan(Base):
    __tablename__ = "plans"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    days = Column(Integer, nullable=False)
    data_limit_gb = Column(Integer, nullable=False)
    price_public = Column(Numeric(12, 2), nullable=False)
    price_agent = Column(Numeric(12, 2), nullable=False)
    status = Column(Enum(PlanStatus), default=PlanStatus.ACTIVE, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    orders = relationship("Order", back_populates="plan")

    def __repr__(self):
        return f"<Plan {self.name} ({self.days}d/{self.data_limit_gb}GB)>"
