"""
MarzbanUser Model - Synced data from Marzban
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, ForeignKey, func
from sqlalchemy.orm import relationship
import enum

from app.database import Base


class MarzbanUserStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    DISABLED = "DISABLED"
    EXPIRED = "EXPIRED"
    LIMITED = "LIMITED"


class MarzbanUser(Base):
    __tablename__ = "marzban_users"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), unique=True, nullable=False)

    # Marzban data
    username = Column(String(100), unique=True, nullable=False, index=True)
    subscription_url = Column(Text, nullable=True)
    expire_date = Column(DateTime(timezone=True), nullable=True)
    data_limit_gb = Column(Integer, nullable=True)
    data_used_gb = Column(Integer, default=0)

    # Sync tracking
    status = Column(Enum(MarzbanUserStatus), default=MarzbanUserStatus.ACTIVE, index=True)
    last_synced_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    order = relationship("Order", back_populates="marzban_user")

    @property
    def data_remaining_gb(self):
        """Calculate remaining data"""
        if self.data_limit_gb is None:
            return None
        return max(0, self.data_limit_gb - (self.data_used_gb or 0))

    def __repr__(self):
        return f"<MarzbanUser {self.username} ({self.status})>"
