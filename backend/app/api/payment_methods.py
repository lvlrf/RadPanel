"""
Payment Methods API
- Public: Get active payment method (with random rotation for cards)
- Admin: Full CRUD
"""
import random
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.utils.deps import get_admin_user, get_current_user
from app.models.user import User, UserRole, UserStatus
from app.models.payment_method import PaymentMethod, PaymentMethodType
from app.schemas.payment_method import (
    PaymentMethodCreate,
    PaymentMethodUpdate,
    PaymentMethodResponse,
    PaymentMethodPublicResponse,
    PaymentMethodListResponse
)
from app.schemas.auth import MessageResponse

router = APIRouter()


def method_to_response(pm: PaymentMethod) -> PaymentMethodResponse:
    return PaymentMethodResponse(
        id=pm.id,
        type=pm.type.value,
        alias=pm.alias,
        config=pm.config,
        status=pm.status.value,
        daily_limit_count=pm.daily_limit_count,
        daily_limit_amount=pm.daily_limit_amount,
        notes=pm.notes,
        created_at=pm.created_at
    )


def method_to_public(pm: PaymentMethod) -> PaymentMethodPublicResponse:
    """Convert to public response with masked data"""
    display_info = {}

    if pm.type == PaymentMethodType.CARD:
        card_num = pm.config.get("card_number", "")
        if len(card_num) >= 4:
            display_info["card_number"] = card_num  # Show full for payment
        display_info["account_holder"] = pm.config.get("account_holder", "")
        display_info["bank"] = pm.config.get("bank", "")

    elif pm.type == PaymentMethodType.SHEBA:
        display_info["sheba_number"] = pm.config.get("sheba_number", "")
        display_info["account_holder"] = pm.config.get("account_holder", "")

    elif pm.type == PaymentMethodType.CRYPTO:
        display_info["coin"] = pm.config.get("coin", "")
        display_info["wallet"] = pm.config.get("wallet", "")
        display_info["network"] = pm.config.get("network", "")
        bonus = pm.config.get("bonus_pct", 0)
        if bonus:
            display_info["bonus"] = f"{bonus}% اعتبار اضافی"

    return PaymentMethodPublicResponse(
        id=pm.id,
        type=pm.type.value,
        alias=pm.alias,
        display_info=display_info
    )


# ============= Public Endpoints =============

@router.get("/payment-methods", response_model=list[PaymentMethodPublicResponse])
async def get_payment_methods_public(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get available payment methods for making payments.
    For CARD type, returns a random active card (rotation feature).
    """
    # Get all active payment methods
    result = await db.execute(
        select(PaymentMethod).where(PaymentMethod.status == UserStatus.ACTIVE)
    )
    methods = result.scalars().all()

    # Group by type
    cards = [m for m in methods if m.type == PaymentMethodType.CARD]
    shebas = [m for m in methods if m.type == PaymentMethodType.SHEBA]
    cryptos = [m for m in methods if m.type == PaymentMethodType.CRYPTO]

    response = []

    # Random card rotation - pick one random card
    if cards:
        random_card = random.choice(cards)
        response.append(method_to_public(random_card))

    # Add all SHEBA options
    for sheba in shebas:
        response.append(method_to_public(sheba))

    # Add all crypto options
    for crypto in cryptos:
        response.append(method_to_public(crypto))

    return response


# ============= Admin Endpoints =============

@router.get("/admin/payment-methods", response_model=PaymentMethodListResponse)
async def list_payment_methods(
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """List all payment methods (Admin only)"""
    result = await db.execute(
        select(PaymentMethod).order_by(PaymentMethod.type, PaymentMethod.created_at)
    )
    methods = result.scalars().all()

    return PaymentMethodListResponse(
        payment_methods=[method_to_response(m) for m in methods],
        total=len(methods)
    )


@router.post("/admin/payment-methods", response_model=PaymentMethodResponse)
async def create_payment_method(
    request: PaymentMethodCreate,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new payment method (Admin only)"""

    # Validate config based on type
    if request.type == PaymentMethodType.CARD:
        required = ["card_number", "account_holder"]
        for field in required:
            if field not in request.config:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"CARD type requires '{field}' in config"
                )

    elif request.type == PaymentMethodType.SHEBA:
        if "sheba_number" not in request.config:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="SHEBA type requires 'sheba_number' in config"
            )

    elif request.type == PaymentMethodType.CRYPTO:
        required = ["coin", "wallet"]
        for field in required:
            if field not in request.config:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"CRYPTO type requires '{field}' in config"
                )

    pm = PaymentMethod(
        type=request.type,
        alias=request.alias,
        config=request.config,
        daily_limit_count=request.daily_limit_count,
        daily_limit_amount=request.daily_limit_amount,
        notes=request.notes,
        status=UserStatus.ACTIVE
    )
    db.add(pm)
    await db.commit()
    await db.refresh(pm)

    return method_to_response(pm)


@router.get("/admin/payment-methods/{pm_id}", response_model=PaymentMethodResponse)
async def get_payment_method(
    pm_id: int,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get payment method by ID (Admin only)"""
    result = await db.execute(
        select(PaymentMethod).where(PaymentMethod.id == pm_id)
    )
    pm = result.scalar_one_or_none()

    if not pm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment method not found"
        )

    return method_to_response(pm)


@router.put("/admin/payment-methods/{pm_id}", response_model=PaymentMethodResponse)
async def update_payment_method(
    pm_id: int,
    request: PaymentMethodUpdate,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Update payment method (Admin only)"""
    result = await db.execute(
        select(PaymentMethod).where(PaymentMethod.id == pm_id)
    )
    pm = result.scalar_one_or_none()

    if not pm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment method not found"
        )

    update_data = request.model_dump(exclude_unset=True)

    # Handle status separately
    if "status" in update_data:
        status_value = update_data.pop("status")
        if status_value in [s.value for s in UserStatus]:
            pm.status = UserStatus(status_value)

    for field, value in update_data.items():
        setattr(pm, field, value)

    await db.commit()
    await db.refresh(pm)

    return method_to_response(pm)


@router.delete("/admin/payment-methods/{pm_id}", response_model=MessageResponse)
async def delete_payment_method(
    pm_id: int,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Disable a payment method (Admin only)"""
    result = await db.execute(
        select(PaymentMethod).where(PaymentMethod.id == pm_id)
    )
    pm = result.scalar_one_or_none()

    if not pm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment method not found"
        )

    pm.status = UserStatus.DISABLED
    await db.commit()

    return MessageResponse(message="Payment method disabled successfully")
