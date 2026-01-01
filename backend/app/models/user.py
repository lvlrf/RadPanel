"""
User Model - Base authentication table
"""
from sqlalchemy import Column, Integer, String, Enum, DateTime, func
from sqlalchemy.orm import relationship
import enum

from app.database import Base


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    AGENT = "AGENT"
    END_USER = "END_USER"


class UserStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    DISABLED = "DISABLED"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=True, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    status = Column(Enum(UserStatus), default=UserStatus.ACTIVE)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    agent = relationship("Agent", back_populates="user", uselist=False)
    end_user = relationship("EndUser", back_populates="user", uselist=False)
    payments = relationship("Payment", back_populates="user", foreign_keys="Payment.user_id")
    orders = relationship("Order", back_populates="user")
    transactions = relationship("Transaction", back_populates="user", foreign_keys="Transaction.user_id")

    def __repr__(self):
        return f"<User {self.username} ({self.role})>"
