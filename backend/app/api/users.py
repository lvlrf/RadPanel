"""
User Profile API (for all authenticated users)
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel

from app.database import get_db
from app.utils.deps import get_current_user
from app.models.user import User, UserRole
from app.models.agent import Agent
from app.models.end_user import EndUser
from app.schemas.auth import UserResponse

router = APIRouter()


class ProfileResponse(BaseModel):
    user: UserResponse
    # Agent-specific fields
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    shop_name: Optional[str] = None
    credit_confirmed: Optional[Decimal] = None
    credit_pending: Optional[Decimal] = None
    total_credit: Optional[float] = None


class ProfileUpdate(BaseModel):
    phone: Optional[str] = None
    # For agents
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    shop_name: Optional[str] = None


@router.get("/me/profile", response_model=ProfileResponse)
async def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's full profile including role-specific data"""

    user_response = UserResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        role=current_user.role,
        status=current_user.status.value
    )

    profile = ProfileResponse(user=user_response)

    if current_user.role == UserRole.AGENT:
        result = await db.execute(
            select(Agent).where(Agent.user_id == current_user.id)
        )
        agent = result.scalar_one_or_none()
        if agent:
            profile.first_name = agent.first_name
            profile.last_name = agent.last_name
            profile.phone = agent.phone
            profile.shop_name = agent.shop_name
            profile.credit_confirmed = agent.credit_confirmed
            profile.credit_pending = agent.credit_pending
            profile.total_credit = agent.total_credit

    elif current_user.role == UserRole.END_USER:
        result = await db.execute(
            select(EndUser).where(EndUser.user_id == current_user.id)
        )
        end_user = result.scalar_one_or_none()
        if end_user:
            profile.phone = end_user.phone
            profile.credit_confirmed = end_user.credit_confirmed
            profile.credit_pending = end_user.credit_pending
            profile.total_credit = end_user.total_credit

    return profile


@router.put("/me/profile", response_model=ProfileResponse)
async def update_my_profile(
    request: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update current user's profile"""

    if current_user.role == UserRole.AGENT:
        result = await db.execute(
            select(Agent).where(Agent.user_id == current_user.id)
        )
        agent = result.scalar_one_or_none()
        if agent:
            if request.phone is not None:
                agent.phone = request.phone
            if request.first_name is not None:
                agent.first_name = request.first_name
            if request.last_name is not None:
                agent.last_name = request.last_name
            if request.shop_name is not None:
                agent.shop_name = request.shop_name

    elif current_user.role == UserRole.END_USER:
        result = await db.execute(
            select(EndUser).where(EndUser.user_id == current_user.id)
        )
        end_user = result.scalar_one_or_none()
        if end_user and request.phone is not None:
            end_user.phone = request.phone

    await db.commit()

    # Return updated profile
    return await get_my_profile(current_user, db)


class WalletResponse(BaseModel):
    credit_confirmed: Decimal
    credit_pending: Decimal
    total_credit: float
    is_negative: bool
    can_create_users: bool


@router.get("/me/wallet", response_model=WalletResponse)
async def get_my_wallet(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's wallet/credit info (for agents and end-users)"""

    if current_user.role == UserRole.AGENT:
        result = await db.execute(
            select(Agent).where(Agent.user_id == current_user.id)
        )
        agent = result.scalar_one_or_none()
        if not agent:
            raise HTTPException(status_code=404, detail="Agent profile not found")

        return WalletResponse(
            credit_confirmed=agent.credit_confirmed,
            credit_pending=agent.credit_pending,
            total_credit=agent.total_credit,
            is_negative=agent.is_negative,
            can_create_users=not agent.is_negative
        )

    elif current_user.role == UserRole.END_USER:
        result = await db.execute(
            select(EndUser).where(EndUser.user_id == current_user.id)
        )
        end_user = result.scalar_one_or_none()
        if not end_user:
            raise HTTPException(status_code=404, detail="End user profile not found")

        total = end_user.total_credit
        return WalletResponse(
            credit_confirmed=end_user.credit_confirmed,
            credit_pending=end_user.credit_pending,
            total_credit=total,
            is_negative=total < 0,
            can_create_users=total >= 0
        )

    else:
        # Admin doesn't have a wallet
        return WalletResponse(
            credit_confirmed=Decimal(0),
            credit_pending=Decimal(0),
            total_credit=0,
            is_negative=False,
            can_create_users=True
        )
