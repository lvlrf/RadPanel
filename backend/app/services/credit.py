"""
Credit Service - Business logic for credit management
"""
from decimal import Decimal
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User, UserRole
from app.models.agent import Agent
from app.models.end_user import EndUser
from app.models.transaction import Transaction, TransactionType, ReferenceType


async def get_user_credit_info(user: User, db: AsyncSession) -> dict:
    """Get credit info for a user (agent or end-user)"""
    if user.role == UserRole.AGENT:
        result = await db.execute(
            select(Agent).where(Agent.user_id == user.id)
        )
        agent = result.scalar_one_or_none()
        if agent:
            return {
                "credit_confirmed": float(agent.credit_confirmed),
                "credit_pending": float(agent.credit_pending),
                "total_credit": agent.total_credit,
                "profile": agent
            }
    elif user.role == UserRole.END_USER:
        result = await db.execute(
            select(EndUser).where(EndUser.user_id == user.id)
        )
        end_user = result.scalar_one_or_none()
        if end_user:
            return {
                "credit_confirmed": float(end_user.credit_confirmed),
                "credit_pending": float(end_user.credit_pending),
                "total_credit": end_user.total_credit,
                "profile": end_user
            }

    return None


async def add_pending_credit(
    user: User,
    amount: Decimal,
    payment_id: int,
    db: AsyncSession
) -> Transaction:
    """Add pending credit when payment is uploaded"""
    credit_info = await get_user_credit_info(user, db)
    if not credit_info:
        raise ValueError("User profile not found")

    profile = credit_info["profile"]
    balance_before = credit_info["total_credit"]

    # Add to pending credit
    profile.credit_pending = Decimal(str(profile.credit_pending)) + amount
    balance_after = profile.total_credit

    # Create transaction
    transaction = Transaction(
        user_id=user.id,
        type=TransactionType.CHARGE_PENDING,
        amount=amount,
        balance_before=Decimal(str(balance_before)),
        balance_after=Decimal(str(balance_after)),
        reference_type=ReferenceType.PAYMENT,
        reference_id=payment_id,
        notes="Receipt uploaded - awaiting approval"
    )
    db.add(transaction)

    return transaction


async def approve_payment(
    user: User,
    amount: Decimal,
    payment_id: int,
    admin: User,
    notes: str,
    db: AsyncSession
) -> Transaction:
    """Approve payment - move from pending to confirmed"""
    credit_info = await get_user_credit_info(user, db)
    if not credit_info:
        raise ValueError("User profile not found")

    profile = credit_info["profile"]
    balance_before = credit_info["total_credit"]

    # Move from pending to confirmed
    profile.credit_pending = Decimal(str(profile.credit_pending)) - amount
    profile.credit_confirmed = Decimal(str(profile.credit_confirmed)) + amount

    # Clear negative credit timestamp if positive now
    if hasattr(profile, 'negative_credit_since') and profile.total_credit >= 0:
        profile.negative_credit_since = None

    balance_after = profile.total_credit

    # Create transaction
    transaction = Transaction(
        user_id=user.id,
        type=TransactionType.CHARGE_APPROVED,
        amount=amount,
        balance_before=Decimal(str(balance_before)),
        balance_after=Decimal(str(balance_after)),
        reference_type=ReferenceType.PAYMENT,
        reference_id=payment_id,
        notes=notes or "Payment approved",
        created_by=admin.id
    )
    db.add(transaction)

    return transaction


async def reject_payment(
    user: User,
    amount: Decimal,
    payment_id: int,
    admin: User,
    notes: str,
    db: AsyncSession
) -> Transaction:
    """Reject payment - remove pending credit (may go negative)"""
    credit_info = await get_user_credit_info(user, db)
    if not credit_info:
        raise ValueError("User profile not found")

    profile = credit_info["profile"]
    balance_before = credit_info["total_credit"]

    # Remove from pending credit
    profile.credit_pending = Decimal(str(profile.credit_pending)) - amount
    balance_after = profile.total_credit

    # Track when went negative
    if hasattr(profile, 'negative_credit_since'):
        if balance_after < 0 and profile.negative_credit_since is None:
            profile.negative_credit_since = datetime.utcnow()

    # Create transaction
    transaction = Transaction(
        user_id=user.id,
        type=TransactionType.CHARGE_REJECTED,
        amount=-amount,  # Negative because it's removed
        balance_before=Decimal(str(balance_before)),
        balance_after=Decimal(str(balance_after)),
        reference_type=ReferenceType.PAYMENT,
        reference_id=payment_id,
        notes=notes,
        created_by=admin.id
    )
    db.add(transaction)

    return transaction


async def deduct_credit(
    user: User,
    amount: Decimal,
    order_id: int,
    db: AsyncSession
) -> Transaction:
    """
    Deduct credit for an order.
    Deducts from confirmed first, then pending.
    """
    credit_info = await get_user_credit_info(user, db)
    if not credit_info:
        raise ValueError("User profile not found")

    profile = credit_info["profile"]
    total = credit_info["total_credit"]

    if total < float(amount):
        raise ValueError("Insufficient credit")

    balance_before = total
    confirmed = Decimal(str(profile.credit_confirmed))
    pending = Decimal(str(profile.credit_pending))

    # Deduct from confirmed first
    if confirmed >= amount:
        profile.credit_confirmed = confirmed - amount
    else:
        # Use all confirmed, rest from pending
        remaining = amount - confirmed
        profile.credit_confirmed = Decimal(0)
        profile.credit_pending = pending - remaining

    balance_after = profile.total_credit

    # Track if went negative
    if hasattr(profile, 'negative_credit_since'):
        if balance_after < 0 and profile.negative_credit_since is None:
            profile.negative_credit_since = datetime.utcnow()

    # Create transaction
    transaction = Transaction(
        user_id=user.id,
        type=TransactionType.ORDER_CREATED,
        amount=-amount,  # Negative because it's deducted
        balance_before=Decimal(str(balance_before)),
        balance_after=Decimal(str(balance_after)),
        reference_type=ReferenceType.ORDER,
        reference_id=order_id,
        notes="Order created"
    )
    db.add(transaction)

    return transaction


async def refund_credit(
    user: User,
    amount: Decimal,
    order_id: int,
    notes: str,
    db: AsyncSession
) -> Transaction:
    """Refund credit for deleted/disabled order"""
    credit_info = await get_user_credit_info(user, db)
    if not credit_info:
        raise ValueError("User profile not found")

    profile = credit_info["profile"]
    balance_before = credit_info["total_credit"]

    # Add back to confirmed credit
    profile.credit_confirmed = Decimal(str(profile.credit_confirmed)) + amount

    # Clear negative timestamp if positive now
    if hasattr(profile, 'negative_credit_since') and profile.total_credit >= 0:
        profile.negative_credit_since = None

    balance_after = profile.total_credit

    # Create transaction
    transaction = Transaction(
        user_id=user.id,
        type=TransactionType.ORDER_REFUND,
        amount=amount,  # Positive because it's added back
        balance_before=Decimal(str(balance_before)),
        balance_after=Decimal(str(balance_after)),
        reference_type=ReferenceType.ORDER,
        reference_id=order_id,
        notes=notes
    )
    db.add(transaction)

    return transaction
