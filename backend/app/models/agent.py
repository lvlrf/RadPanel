"""
Agent Model - Agent profile with credit management
"""
from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime, Enum, ForeignKey, func
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.user import UserStatus


class Agent(Base):
    __tablename__ = "agents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)

    # Profile
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=True)
    shop_name = Column(String(200), nullable=True)
    province = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    address_details = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)

    # Financial
    credit_confirmed = Column(Numeric(15, 2), default=0.00)
    credit_pending = Column(Numeric(15, 2), default=0.00)
    negative_credit_since = Column(DateTime(timezone=True), nullable=True)

    # Status
    status = Column(Enum(UserStatus), default=UserStatus.ACTIVE)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="agent")

    @property
    def total_credit(self):
        """Calculate total credit (confirmed + pending)"""
        return float(self.credit_confirmed or 0) + float(self.credit_pending or 0)

    @property
    def is_negative(self):
        """Check if agent has negative credit"""
        return self.total_credit < 0

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    def __repr__(self):
        return f"<Agent {self.full_name} (Credit: {self.total_credit})>"
