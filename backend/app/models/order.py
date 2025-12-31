"""
Order Model - VPN purchases
"""
from sqlalchemy import Column, Integer, String, Numeric, DateTime, Enum, ForeignKey, func
from sqlalchemy.orm import relationship
import enum

from app.database import Base


class OrderStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    DISABLED = "DISABLED"
    DELETED = "DELETED"


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    plan_id = Column(Integer, ForeignKey("plans.id"), nullable=False)

    # Pricing snapshot (price at time of purchase)
    amount = Column(Numeric(12, 2), nullable=False)

    # Marzban info
    marzban_username = Column(String(100), unique=True, nullable=False, index=True)
    alias = Column(String(200), nullable=True)  # User's display name

    # Status
    status = Column(Enum(OrderStatus), default=OrderStatus.ACTIVE, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="orders")
    plan = relationship("Plan", back_populates="orders")
    marzban_user = relationship("MarzbanUser", back_populates="order", uselist=False)

    def __repr__(self):
        return f"<Order {self.id} ({self.marzban_username} - {self.status})>"
