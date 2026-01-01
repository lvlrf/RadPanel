"""
Order Management API
Create orders, view orders, manage user subscriptions
"""
from datetime import datetime
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import joinedload

from app.database import get_db
from app.utils.deps import get_current_user, get_admin_user, get_agent_user
from app.models.user import User, UserRole
from app.models.agent import Agent
from app.models.end_user import EndUser
from app.models.plan import Plan, PlanStatus
from app.models.order import Order, OrderStatus
from app.models.marzban_user import MarzbanUser, MarzbanUserStatus
from app.schemas.order import (
    OrderCreate,
    OrderResponse,
    OrderDetailResponse,
    OrderListResponse
)
from app.schemas.auth import MessageResponse
from app.services.marzban import get_marzban_client, MarzbanClient
from app.services.credit import deduct_credit, refund_credit, get_user_credit_info
from app.services.refund import calculate_refund

router = APIRouter()


def order_to_response(order: Order) -> OrderResponse:
    sub_url = None
    if order.marzban_user:
        sub_url = order.marzban_user.subscription_url

    return OrderResponse(
        id=order.id,
        user_id=order.user_id,
        plan_id=order.plan_id,
        plan_name=order.plan.name if order.plan else "",
        amount=order.amount,
        marzban_username=order.marzban_username,
        alias=order.alias,
        subscription_url=sub_url,
        status=order.status.value,
        created_at=order.created_at
    )


def order_to_detail(order: Order) -> OrderDetailResponse:
    sub_url = None
    expire = None
    limit = None
    used = None

    if order.marzban_user:
        sub_url = order.marzban_user.subscription_url
        expire = order.marzban_user.expire_date
        limit = order.marzban_user.data_limit_gb
        used = order.marzban_user.data_used_gb

    return OrderDetailResponse(
        id=order.id,
        user_id=order.user_id,
        plan_id=order.plan_id,
        plan_name=order.plan.name if order.plan else "",
        amount=order.amount,
        marzban_username=order.marzban_username,
        alias=order.alias,
        subscription_url=sub_url,
        status=order.status.value,
        created_at=order.created_at,
        expire_date=expire,
        data_limit_gb=limit,
        data_used_gb=used
    )


@router.post("", response_model=OrderDetailResponse)
async def create_order(
    request: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    marzban: MarzbanClient = Depends(get_marzban_client)
):
    """
    Create a new order and user in Marzban.
    Deducts credit from user's wallet.
    """
    # Get plan
    result = await db.execute(
        select(Plan).where(Plan.id == request.plan_id)
    )
    plan = result.scalar_one_or_none()

    if not plan or plan.status != PlanStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or inactive plan"
        )

    # Determine price based on role
    if current_user.role == UserRole.AGENT:
        price = plan.price_agent
    else:
        price = plan.price_public

    # Check credit
    credit_info = await get_user_credit_info(current_user, db)
    if not credit_info:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User profile not found"
        )

    if credit_info["total_credit"] < float(price):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient credit. Required: {price}, Available: {credit_info['total_credit']}"
        )

    # Check if agent has negative credit (can't create users)
    if current_user.role == UserRole.AGENT:
        result = await db.execute(
            select(Agent).where(Agent.user_id == current_user.id)
        )
        agent = result.scalar_one_or_none()
        if agent and agent.is_negative:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot create users with negative credit. Please recharge your wallet."
            )

    # Check username availability
    username_exists = await marzban.check_username_exists(request.username)
    if username_exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Username '{request.username}' already exists in Marzban"
        )

    # Build note for Marzban
    creator_name = current_user.username
    if current_user.role == UserRole.AGENT and credit_info.get("profile"):
        creator_name = credit_info["profile"].full_name

    note = f"""RAD Panel User
Created by: {creator_name}
Created at: {datetime.utcnow().isoformat()}
Plan: {plan.name}
Price: {price} IRR
"""

    # Create user in Marzban
    try:
        marzban_data = await marzban.create_user(
            username=request.username,
            days=plan.days,
            data_limit_gb=plan.data_limit_gb,
            note=note,
            on_hold=request.on_hold
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Failed to create user in Marzban: {str(e)}"
        )

    # Create order record
    order = Order(
        user_id=current_user.id,
        plan_id=plan.id,
        amount=price,
        marzban_username=request.username,
        alias=request.alias,
        status=OrderStatus.ACTIVE
    )
    db.add(order)
    await db.flush()

    # Create marzban user record
    expire_date = None
    if marzban_data.get("expire"):
        expire_date = datetime.fromtimestamp(marzban_data["expire"])

    marzban_user = MarzbanUser(
        order_id=order.id,
        username=request.username,
        subscription_url=marzban_data.get("subscription_url"),
        expire_date=expire_date,
        data_limit_gb=plan.data_limit_gb,
        status=MarzbanUserStatus.ACTIVE if not request.on_hold else MarzbanUserStatus.DISABLED,
        last_synced_at=datetime.utcnow()
    )
    db.add(marzban_user)

    # Deduct credit
    await deduct_credit(current_user, price, order.id, db)

    await db.commit()

    # Reload with relationships
    result = await db.execute(
        select(Order)
        .options(joinedload(Order.plan), joinedload(Order.marzban_user))
        .where(Order.id == order.id)
    )
    order = result.scalar_one()

    return order_to_detail(order)


@router.get("/my", response_model=OrderListResponse)
async def get_my_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's orders"""
    query = (
        select(Order)
        .options(joinedload(Order.plan), joinedload(Order.marzban_user))
        .where(Order.user_id == current_user.id)
        .order_by(Order.created_at.desc())
    )

    # Count
    count_result = await db.execute(
        select(func.count(Order.id)).where(Order.user_id == current_user.id)
    )
    total = count_result.scalar()

    # Paginate
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    orders = result.scalars().all()

    return OrderListResponse(
        orders=[order_to_response(o) for o in orders],
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/{order_id}", response_model=OrderDetailResponse)
async def get_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get order details"""
    result = await db.execute(
        select(Order)
        .options(joinedload(Order.plan), joinedload(Order.marzban_user))
        .where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    # Check ownership (unless admin)
    if current_user.role != UserRole.ADMIN and order.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    return order_to_detail(order)


@router.delete("/{order_id}", response_model=MessageResponse)
async def delete_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    marzban: MarzbanClient = Depends(get_marzban_client)
):
    """
    Delete an order and its Marzban user.
    Calculates and applies refund if within 24 hours.
    """
    result = await db.execute(
        select(Order)
        .options(joinedload(Order.plan), joinedload(Order.marzban_user))
        .where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    # Check ownership (unless admin)
    if current_user.role != UserRole.ADMIN and order.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    if order.status == OrderStatus.DELETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order is already deleted"
        )

    # Get usage from Marzban
    used_gb = 0
    try:
        usage = await marzban.get_user_usage(order.marzban_username)
        if usage:
            used_gb = usage["used_gb"]
    except Exception:
        pass  # Continue with 0 usage if can't fetch

    # Calculate refund
    refund_amount = None
    if order.marzban_user:
        refund_amount = calculate_refund(order, order.marzban_user, used_gb)

    # Delete from Marzban
    try:
        await marzban.delete_user(order.marzban_username)
    except Exception as e:
        # Log but don't fail - maybe already deleted
        pass

    # Update order status
    order.status = OrderStatus.DELETED
    order.deleted_at = datetime.utcnow()

    if order.marzban_user:
        order.marzban_user.status = MarzbanUserStatus.DISABLED

    # Apply refund if eligible
    refund_message = "No refund (order older than 24 hours)"
    if refund_amount and refund_amount > 0:
        # Get order owner for refund
        result = await db.execute(
            select(User).where(User.id == order.user_id)
        )
        order_owner = result.scalar_one()

        await refund_credit(
            order_owner,
            refund_amount,
            order.id,
            f"Refund for deleted order #{order.id}",
            db
        )
        refund_message = f"Refunded {refund_amount} to wallet"

    await db.commit()

    return MessageResponse(message=f"Order deleted. {refund_message}")


# ============= Admin Endpoints =============

@router.get("", response_model=OrderListResponse)
async def list_all_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: str = Query(None, alias="status"),
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """List all orders (Admin only)"""
    query = (
        select(Order)
        .options(joinedload(Order.plan), joinedload(Order.marzban_user))
    )

    if status_filter:
        query = query.where(Order.status == OrderStatus(status_filter))

    query = query.order_by(Order.created_at.desc())

    # Count
    count_query = select(func.count(Order.id))
    if status_filter:
        count_query = count_query.where(Order.status == OrderStatus(status_filter))
    count_result = await db.execute(count_query)
    total = count_result.scalar()

    # Paginate
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    orders = result.scalars().all()

    return OrderListResponse(
        orders=[order_to_response(o) for o in orders],
        total=total,
        page=page,
        page_size=page_size
    )
