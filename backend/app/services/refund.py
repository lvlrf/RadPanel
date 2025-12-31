"""
Refund Calculator
Calculates refund amount for deleted/disabled users
"""
from decimal import Decimal
from datetime import datetime, timedelta
from typing import Optional
from app.models.order import Order
from app.models.marzban_user import MarzbanUser


def calculate_refund(
    order: Order,
    marzban_user: MarzbanUser,
    used_gb: float = 0
) -> Optional[Decimal]:
    """
    Calculate refund amount for an order.

    Rules:
    - Only if order is < 24 hours old
    - Pro-rated based on unused days AND unused data
    - Returns the lesser of the two (conservative approach)

    Args:
        order: The order to refund
        marzban_user: Marzban user data
        used_gb: Current used data in GB

    Returns:
        Refund amount or None if not eligible
    """
    # Check if within 24 hours
    now = datetime.utcnow()
    order_age = now - order.created_at

    if order_age > timedelta(hours=24):
        # Not eligible for refund after 24 hours
        return None

    original_price = Decimal(str(order.amount))

    # If on_hold (never started), full refund
    if marzban_user.status.value == "on_hold":
        return original_price

    # Calculate time-based refund
    total_days = marzban_user.data_limit_gb  # Assuming plan has days info
    if marzban_user.expire_date:
        days_remaining = (marzban_user.expire_date - now).days
        if days_remaining < 0:
            days_remaining = 0

        # Get total days from plan (order.plan.days)
        total_days = 30  # Default, should come from plan

        time_refund_ratio = Decimal(str(days_remaining / total_days))
    else:
        time_refund_ratio = Decimal("1.0")

    # Calculate data-based refund
    total_gb = marzban_user.data_limit_gb or 1
    used_gb_val = used_gb or marzban_user.data_used_gb or 0
    remaining_gb = max(0, total_gb - used_gb_val)

    data_refund_ratio = Decimal(str(remaining_gb / total_gb))

    # Use the lesser ratio (conservative approach)
    refund_ratio = min(time_refund_ratio, data_refund_ratio)

    # Calculate refund amount
    refund_amount = original_price * refund_ratio

    # Round to 2 decimal places
    refund_amount = refund_amount.quantize(Decimal("0.01"))

    return refund_amount
