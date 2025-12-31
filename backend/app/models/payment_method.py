"""
PaymentMethod Model - Payment configuration (Card, SHEBA, Crypto)
"""
from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime, Enum, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
import enum

from app.database import Base
from app.models.user import UserStatus


class PaymentMethodType(str, enum.Enum):
    CARD = "CARD"
    SHEBA = "SHEBA"
    CRYPTO = "CRYPTO"


class PaymentMethod(Base):
    __tablename__ = "payment_methods"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(Enum(PaymentMethodType), nullable=False, index=True)
    alias = Column(String(100), nullable=False)  # Display name

    # Flexible config storage
    # CARD: {"card_number": "1234...", "account_holder": "Name", "bank": "Melli"}
    # SHEBA: {"sheba_number": "IR...", "account_holder": "Name"}
    # CRYPTO: {"coin": "USDT_TRC20", "wallet": "T...", "network": "TRC20", "bonus_pct": 10}
    config = Column(JSONB, nullable=False, default={})

    status = Column(Enum(UserStatus), default=UserStatus.ACTIVE, index=True)
    daily_limit_count = Column(Integer, nullable=True)
    daily_limit_amount = Column(Numeric(12, 2), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    payments = relationship("Payment", back_populates="payment_method")

    def __repr__(self):
        return f"<PaymentMethod {self.alias} ({self.type})>"
