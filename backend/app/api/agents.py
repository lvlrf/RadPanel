"""
Agent Management API (Admin only)
"""
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import joinedload

from app.database import get_db
from app.utils.deps import get_admin_user
from app.utils.security import hash_password
from app.models.user import User, UserRole, UserStatus
from app.models.agent import Agent
from app.models.transaction import Transaction, TransactionType, ReferenceType
from app.schemas.agent import (
    AgentCreate,
    AgentUpdate,
    CreditAdjustment,
    AgentResponse,
    AgentListResponse
)
from app.schemas.auth import MessageResponse

router = APIRouter()


def agent_to_response(agent: Agent) -> AgentResponse:
    """Convert Agent model to response schema"""
    return AgentResponse(
        id=agent.id,
        user_id=agent.user_id,
        username=agent.user.username,
        email=agent.user.email,
        first_name=agent.first_name,
        last_name=agent.last_name,
        phone=agent.phone,
        shop_name=agent.shop_name,
        province=agent.province,
        city=agent.city,
        credit_confirmed=agent.credit_confirmed,
        credit_pending=agent.credit_pending,
        total_credit=agent.total_credit,
        is_negative=agent.is_negative,
        status=agent.status.value,
        created_at=agent.created_at
    )


@router.post("", response_model=AgentResponse)
async def create_agent(
    request: AgentCreate,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new agent (Admin only)"""
    # Check if username exists
    result = await db.execute(
        select(User).where(User.username == request.username)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )

    # Create user
    user = User(
        username=request.username,
        email=request.email,
        password_hash=hash_password(request.password),
        role=UserRole.AGENT,
        status=UserStatus.ACTIVE
    )
    db.add(user)
    await db.flush()

    # Create agent profile
    agent = Agent(
        user_id=user.id,
        first_name=request.first_name,
        last_name=request.last_name,
        phone=request.phone,
        shop_name=request.shop_name,
        province=request.province,
        city=request.city,
        address_details=request.address_details,
        notes=request.notes
    )
    db.add(agent)
    await db.commit()

    # Refresh with user relationship
    await db.refresh(agent)
    result = await db.execute(
        select(Agent).options(joinedload(Agent.user)).where(Agent.id == agent.id)
    )
    agent = result.scalar_one()

    return agent_to_response(agent)


@router.get("", response_model=AgentListResponse)
async def list_agents(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = None,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """List all agents with pagination (Admin only)"""
    from typing import Optional

    query = select(Agent).options(joinedload(Agent.user))

    # Filters
    if status_filter:
        query = query.where(Agent.status == status_filter)
    if search:
        query = query.join(User).where(
            (User.username.ilike(f"%{search}%")) |
            (Agent.first_name.ilike(f"%{search}%")) |
            (Agent.last_name.ilike(f"%{search}%")) |
            (Agent.shop_name.ilike(f"%{search}%"))
        )

    # Count total
    count_query = select(func.count(Agent.id))
    if status_filter:
        count_query = count_query.where(Agent.status == status_filter)
    result = await db.execute(count_query)
    total = result.scalar()

    # Paginate
    query = query.order_by(Agent.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(query)
    agents = result.scalars().all()

    return AgentListResponse(
        agents=[agent_to_response(a) for a in agents],
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/{agent_id}", response_model=AgentResponse)
async def get_agent(
    agent_id: int,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get agent by ID (Admin only)"""
    result = await db.execute(
        select(Agent).options(joinedload(Agent.user)).where(Agent.id == agent_id)
    )
    agent = result.scalar_one_or_none()

    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )

    return agent_to_response(agent)


@router.put("/{agent_id}", response_model=AgentResponse)
async def update_agent(
    agent_id: int,
    request: AgentUpdate,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Update agent info (Admin only)"""
    result = await db.execute(
        select(Agent).options(joinedload(Agent.user)).where(Agent.id == agent_id)
    )
    agent = result.scalar_one_or_none()

    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )

    # Update fields
    update_data = request.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(agent, field, value)

    await db.commit()
    await db.refresh(agent)

    return agent_to_response(agent)


@router.delete("/{agent_id}", response_model=MessageResponse)
async def delete_agent(
    agent_id: int,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Disable an agent (Admin only). Does not delete, just disables."""
    result = await db.execute(
        select(Agent).options(joinedload(Agent.user)).where(Agent.id == agent_id)
    )
    agent = result.scalar_one_or_none()

    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )

    # Disable both agent and user
    agent.status = UserStatus.DISABLED
    agent.user.status = UserStatus.DISABLED
    await db.commit()

    return MessageResponse(message="Agent disabled successfully")


@router.post("/{agent_id}/credit", response_model=AgentResponse)
async def adjust_credit(
    agent_id: int,
    request: CreditAdjustment,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Manually adjust agent credit (Admin only)"""
    result = await db.execute(
        select(Agent).options(joinedload(Agent.user)).where(Agent.id == agent_id)
    )
    agent = result.scalar_one_or_none()

    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )

    # Calculate balances
    balance_before = agent.total_credit
    new_confirmed = Decimal(agent.credit_confirmed) + request.amount
    agent.credit_confirmed = new_confirmed
    balance_after = agent.total_credit

    # Create transaction log
    transaction = Transaction(
        user_id=agent.user_id,
        type=TransactionType.CHARGE_MANUAL,
        amount=request.amount,
        balance_before=Decimal(str(balance_before)),
        balance_after=Decimal(str(balance_after)),
        reference_type=ReferenceType.MANUAL,
        notes=request.notes or f"Manual adjustment by admin",
        created_by=admin.id
    )
    db.add(transaction)
    await db.commit()
    await db.refresh(agent)

    return agent_to_response(agent)


@router.post("/{agent_id}/enable", response_model=MessageResponse)
async def enable_agent(
    agent_id: int,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Re-enable a disabled agent (Admin only)"""
    result = await db.execute(
        select(Agent).options(joinedload(Agent.user)).where(Agent.id == agent_id)
    )
    agent = result.scalar_one_or_none()

    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )

    agent.status = UserStatus.ACTIVE
    agent.user.status = UserStatus.ACTIVE
    await db.commit()

    return MessageResponse(message="Agent enabled successfully")
