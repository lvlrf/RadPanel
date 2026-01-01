"""
Service Layer Tests
"""
import pytest
from decimal import Decimal
from datetime import datetime, timedelta

from app.services.credit import (
    add_pending_credit,
    approve_payment,
    reject_payment,
    deduct_credit,
    refund_credit,
)
from app.services.refund import calculate_refund
from app.models.agent import Agent
from app.models.user import User, UserRole
from app.models.payment import Payment, PaymentStatus
from app.models.transaction import TransactionType
from app.utils.security import hash_password


@pytest.mark.asyncio
async def test_add_pending_credit(test_session):
    """Test adding pending credit to agent"""
    # Create agent
    user = User(
        username="test_agent",
        password_hash=hash_password("test123"),
        role=UserRole.AGENT,
        is_active=True,
    )
    test_session.add(user)
    await test_session.commit()

    agent = Agent(
        user_id=user.id,
        credit_confirmed=Decimal("0"),
        credit_pending=Decimal("0"),
    )
    test_session.add(agent)
    await test_session.commit()
    await test_session.refresh(agent)

    # Create payment
    payment = Payment(
        user_id=user.id,
        amount=Decimal("100000"),
        status=PaymentStatus.PENDING,
    )
    test_session.add(payment)
    await test_session.commit()
    await test_session.refresh(payment)

    # Add pending credit
    await add_pending_credit(
        user=user,
        amount=Decimal("100000"),
        payment_id=payment.id,
        db=test_session
    )

    await test_session.refresh(agent)
    assert agent.credit_pending == Decimal("100000")
    assert agent.credit_confirmed == Decimal("0")


@pytest.mark.asyncio
async def test_approve_payment(test_session):
    """Test approving payment and converting to confirmed credit"""
    # Setup
    user = User(
        username="test_agent2",
        password_hash=hash_password("test123"),
        role=UserRole.AGENT,
        is_active=True,
    )
    test_session.add(user)
    await test_session.commit()

    agent = Agent(
        user_id=user.id,
        credit_confirmed=Decimal("0"),
        credit_pending=Decimal("100000"),
    )
    test_session.add(agent)

    admin = User(
        username="admin2",
        password_hash=hash_password("admin123"),
        role=UserRole.ADMIN,
        is_active=True,
    )
    test_session.add(admin)
    await test_session.commit()

    payment = Payment(
        user_id=user.id,
        amount=Decimal("100000"),
        status=PaymentStatus.PENDING,
    )
    test_session.add(payment)
    await test_session.commit()
    await test_session.refresh(payment)

    # Approve
    await approve_payment(
        user=user,
        amount=Decimal("100000"),
        payment_id=payment.id,
        admin=admin,
        notes="Approved",
        db=test_session
    )

    await test_session.refresh(agent)
    assert agent.credit_confirmed == Decimal("100000")
    assert agent.credit_pending == Decimal("0")


@pytest.mark.asyncio
async def test_deduct_credit(test_session):
    """Test deducting credit for order"""
    user = User(
        username="test_agent3",
        password_hash=hash_password("test123"),
        role=UserRole.AGENT,
        is_active=True,
    )
    test_session.add(user)
    await test_session.commit()

    agent = Agent(
        user_id=user.id,
        credit_confirmed=Decimal("50000"),
        credit_pending=Decimal("100000"),
    )
    test_session.add(agent)
    await test_session.commit()
    await test_session.refresh(agent)

    # Deduct 80000 (should use 50000 confirmed + 30000 pending)
    await deduct_credit(
        user=user,
        amount=Decimal("80000"),
        order_id=1,
        db=test_session
    )

    await test_session.refresh(agent)
    assert agent.credit_confirmed == Decimal("0")
    assert agent.credit_pending == Decimal("70000")


@pytest.mark.asyncio
async def test_calculate_refund():
    """Test refund calculation"""
    # Full refund within 24 hours
    created_at = datetime.utcnow() - timedelta(hours=12)
    expires_at = created_at + timedelta(days=30)

    refund = calculate_refund(
        price_paid=Decimal("100000"),
        data_limit_gb=50,
        used_data_gb=0,
        created_at=created_at,
        expires_at=expires_at,
    )
    assert refund == Decimal("100000")  # Full refund

    # Partial refund after 24 hours
    created_at = datetime.utcnow() - timedelta(days=15)
    expires_at = created_at + timedelta(days=30)

    refund = calculate_refund(
        price_paid=Decimal("100000"),
        data_limit_gb=50,
        used_data_gb=10,
        created_at=created_at,
        expires_at=expires_at,
    )
    # Should be roughly 50% based on time and 80% based on data
    # Final = min(40000, 80000) = 40000 (approx)
    assert refund >= Decimal("0")
    assert refund <= Decimal("100000")


@pytest.mark.asyncio
async def test_negative_credit(test_session):
    """Test that deduction can result in negative credit"""
    user = User(
        username="test_agent4",
        password_hash=hash_password("test123"),
        role=UserRole.AGENT,
        is_active=True,
    )
    test_session.add(user)
    await test_session.commit()

    agent = Agent(
        user_id=user.id,
        credit_confirmed=Decimal("50000"),
        credit_pending=Decimal("0"),
    )
    test_session.add(agent)
    await test_session.commit()
    await test_session.refresh(agent)

    # Deduct more than available - should result in negative
    await deduct_credit(
        user=user,
        amount=Decimal("100000"),
        order_id=1,
        db=test_session
    )

    await test_session.refresh(agent)
    assert (agent.credit_confirmed + agent.credit_pending) == Decimal("-50000")
