"""
Transaction Model - Immutable audit log for all financial operations
"""
from sqlalchemy import Column, Integer, Text, Numeric, DateTime, Enum, ForeignKey, func
from sqlalchemy.orm import relationship
import enum

from app.database import Base


class TransactionType(str, enum.Enum):
    CHARGE_PENDING = "CHARGE_PENDING"      # Receipt uploaded
    CHARGE_APPROVED = "CHARGE_APPROVED"    # Payment approved by admin
    CHARGE_REJECTED = "CHARGE_REJECTED"    # Payment rejected by admin
    CHARGE_MANUAL = "CHARGE_MANUAL"        # Manual credit adjustment
    ORDER_CREATED = "ORDER_CREATED"        # User created, credit deducted
    ORDER_REFUND = "ORDER_REFUND"          # User deleted, credit refunded
    ORDER_DISABLED = "ORDER_DISABLED"      # User disabled (no refund)


class ReferenceType(str, enum.Enum):
    PAYMENT = "PAYMENT"
    ORDER = "ORDER"
    MANUAL = "MANUAL"


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    type = Column(Enum(TransactionType), nullable=False, index=True)
    amount = Column(Numeric(15, 2), nullable=False)  # Can be positive or negative

    # Balance snapshots
    balance_before = Column(Numeric(15, 2), nullable=False)
    balance_after = Column(Numeric(15, 2), nullable=False)

    # Reference to source
    reference_type = Column(Enum(ReferenceType), nullable=True)
    reference_id = Column(Integer, nullable=True)  # payment_id, order_id, etc.

    # Notes
    notes = Column(Text, nullable=True)

    # Audit
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)  # NULL for system, USER_ID for manual

    # Relationships
    user = relationship("User", back_populates="transactions", foreign_keys=[user_id])
    creator = relationship("User", foreign_keys=[created_by])

    def __repr__(self):
        return f"<Transaction {self.id} ({self.type}: {self.amount})>"
