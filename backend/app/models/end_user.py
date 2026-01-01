"""
EndUser Model - End user profile
"""
from sqlalchemy import Column, Integer, String, Boolean, Numeric, DateTime, Enum, ForeignKey, func
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.user import UserStatus


class EndUser(Base):
    __tablename__ = "end_users"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)

    # Profile
    phone = Column(String(20), nullable=True, index=True)
    verified = Column(Boolean, default=False)

    # Financial
    credit_confirmed = Column(Numeric(15, 2), default=0.00)
    credit_pending = Column(Numeric(15, 2), default=0.00)

    # Status
    status = Column(Enum(UserStatus), default=UserStatus.ACTIVE)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="end_user")

    @property
    def total_credit(self):
        """Calculate total credit (confirmed + pending)"""
        return float(self.credit_confirmed or 0) + float(self.credit_pending or 0)

    def __repr__(self):
        return f"<EndUser {self.user_id}>"
