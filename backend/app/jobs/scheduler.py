"""
Background Jobs - Scheduled tasks
"""
from datetime import datetime, timedelta
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy import select, and_
from sqlalchemy.orm import joinedload
import logging

from app.database import AsyncSessionLocal
from app.models.agent import Agent
from app.models.user import User, UserStatus
from app.models.order import Order, OrderStatus
from app.services.marzban import marzban_client

logger = logging.getLogger(__name__)

# Create scheduler
scheduler = AsyncIOScheduler()


async def check_negative_credit():
    """
    Check agents with negative credit and enforce 24-hour rules:
    - If negative < 24h: Block user creation (handled by API)
    - If negative >= 24h: Disable all their Marzban users
    """
    logger.info("Running negative credit check...")

    async with AsyncSessionLocal() as db:
        try:
            # Find agents with negative credit for more than 24 hours
            cutoff_time = datetime.utcnow() - timedelta(hours=24)

            result = await db.execute(
                select(Agent)
                .options(joinedload(Agent.user))
                .where(
                    and_(
                        Agent.negative_credit_since.isnot(None),
                        Agent.negative_credit_since < cutoff_time,
                        Agent.status == UserStatus.ACTIVE
                    )
                )
            )
            agents = result.scalars().all()

            for agent in agents:
                logger.warning(
                    f"Agent {agent.user.username} has negative credit for >24h. "
                    f"Disabling their users..."
                )

                # Get all active orders for this agent
                orders_result = await db.execute(
                    select(Order)
                    .where(
                        and_(
                            Order.user_id == agent.user_id,
                            Order.status == OrderStatus.ACTIVE
                        )
                    )
                )
                orders = orders_result.scalars().all()

                disabled_count = 0
                for order in orders:
                    try:
                        # Disable in Marzban
                        await marzban_client.disable_user(order.marzban_username)

                        # Update order status
                        order.status = OrderStatus.DISABLED

                        disabled_count += 1
                        logger.info(f"Disabled Marzban user: {order.marzban_username}")

                    except Exception as e:
                        logger.error(
                            f"Failed to disable user {order.marzban_username}: {e}"
                        )

                await db.commit()

                logger.info(
                    f"Disabled {disabled_count} users for agent {agent.user.username}"
                )

                # TODO: Send notification to agent (email/telegram)

        except Exception as e:
            logger.error(f"Error in negative credit check: {e}")
            await db.rollback()


async def sync_marzban_users():
    """
    Sync user data from Marzban (usage, status, etc.)
    Runs every hour to keep local data up to date.
    """
    logger.info("Running Marzban sync...")

    async with AsyncSessionLocal() as db:
        try:
            from app.models.marzban_user import MarzbanUser, MarzbanUserStatus

            # Get all active Marzban users
            result = await db.execute(
                select(MarzbanUser)
                .where(MarzbanUser.status == MarzbanUserStatus.ACTIVE)
            )
            marzban_users = result.scalars().all()

            synced_count = 0
            for mu in marzban_users:
                try:
                    # Get user data from Marzban
                    user_data = await marzban_client.get_user(mu.username)

                    if user_data:
                        # Update usage
                        used_bytes = user_data.get("used_traffic", 0)
                        mu.data_used_gb = int(used_bytes / (1024 * 1024 * 1024))

                        # Update status
                        marzban_status = user_data.get("status", "active")
                        if marzban_status == "disabled":
                            mu.status = MarzbanUserStatus.DISABLED
                        elif marzban_status == "expired":
                            mu.status = MarzbanUserStatus.EXPIRED
                        elif marzban_status == "limited":
                            mu.status = MarzbanUserStatus.LIMITED

                        mu.last_synced_at = datetime.utcnow()
                        synced_count += 1

                    else:
                        # User not found in Marzban
                        mu.status = MarzbanUserStatus.DISABLED
                        logger.warning(f"User {mu.username} not found in Marzban")

                except Exception as e:
                    logger.error(f"Failed to sync user {mu.username}: {e}")

            await db.commit()
            logger.info(f"Synced {synced_count} Marzban users")

        except Exception as e:
            logger.error(f"Error in Marzban sync: {e}")
            await db.rollback()


async def cleanup_old_uploads():
    """
    Clean up orphaned upload files older than 30 days.
    """
    import os
    from app.config import settings

    logger.info("Running upload cleanup...")

    try:
        cutoff_time = datetime.utcnow() - timedelta(days=30)
        upload_dir = settings.UPLOAD_DIR

        if not os.path.exists(upload_dir):
            return

        cleaned = 0
        for filename in os.listdir(upload_dir):
            filepath = os.path.join(upload_dir, filename)

            if os.path.isfile(filepath):
                file_mtime = datetime.fromtimestamp(os.path.getmtime(filepath))

                if file_mtime < cutoff_time:
                    os.remove(filepath)
                    cleaned += 1
                    logger.debug(f"Deleted old file: {filename}")

        logger.info(f"Cleaned up {cleaned} old files")

    except Exception as e:
        logger.error(f"Error in upload cleanup: {e}")


def start_scheduler():
    """Start the background job scheduler"""

    # Check negative credit every hour
    scheduler.add_job(
        check_negative_credit,
        trigger=IntervalTrigger(hours=1),
        id="check_negative_credit",
        name="Check agents with negative credit",
        replace_existing=True
    )

    # Sync Marzban users every 2 hours
    scheduler.add_job(
        sync_marzban_users,
        trigger=IntervalTrigger(hours=2),
        id="sync_marzban_users",
        name="Sync data from Marzban",
        replace_existing=True
    )

    # Cleanup old uploads daily at 4 AM
    scheduler.add_job(
        cleanup_old_uploads,
        trigger=IntervalTrigger(days=1),
        id="cleanup_old_uploads",
        name="Clean up old upload files",
        replace_existing=True
    )

    scheduler.start()
    logger.info("Background scheduler started")


def stop_scheduler():
    """Stop the background job scheduler"""
    scheduler.shutdown()
    logger.info("Background scheduler stopped")
