"""
Payment Model - Payment submissions with receipt
"""
from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime, Enum, ForeignKey, func
from sqlalchemy.orm import relationship
import enum

from app.database import Base


class PaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    amount = Column(Numeric(12, 2), nullable=False)
    payment_method_id = Column(Integer, ForeignKey("payment_methods.id"), nullable=False)
    receipt_url = Column(String(500), nullable=True)  # Path to uploaded file
    status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING, index=True)

    # Admin review
    admin_notes = Column(Text, nullable=True)
    processed_at = Column(DateTime(timezone=True), nullable=True)
    processed_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # Relationships
    user = relationship("User", back_populates="payments", foreign_keys=[user_id])
    payment_method = relationship("PaymentMethod", back_populates="payments")
    processor = relationship("User", foreign_keys=[processed_by])

    def __repr__(self):
        return f"<Payment {self.id} ({self.amount} - {self.status})>"
