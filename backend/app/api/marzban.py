"""
Marzban API Endpoints
Wrapper endpoints for Marzban operations
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional

from app.utils.deps import get_current_user, get_agent_user
from app.models.user import User
from app.services.marzban import get_marzban_client, MarzbanClient

router = APIRouter()


class UsernameCheckResponse(BaseModel):
    username: str
    available: bool


class MarzbanUserInfo(BaseModel):
    username: str
    status: str
    expire: Optional[int]
    data_limit_gb: float
    used_gb: float
    subscription_url: Optional[str]


@router.get("/check-username/{username}", response_model=UsernameCheckResponse)
async def check_username(
    username: str,
    current_user: User = Depends(get_current_user),
    marzban: MarzbanClient = Depends(get_marzban_client)
):
    """Check if a username is available in Marzban"""
    try:
        exists = await marzban.check_username_exists(username)
        return UsernameCheckResponse(
            username=username,
            available=not exists
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Could not connect to Marzban: {str(e)}"
        )


@router.get("/user/{username}", response_model=MarzbanUserInfo)
async def get_marzban_user(
    username: str,
    current_user: User = Depends(get_agent_user),
    marzban: MarzbanClient = Depends(get_marzban_client)
):
    """Get Marzban user info (Agent/Admin only)"""
    try:
        user = await marzban.get_user(username)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found in Marzban"
            )

        usage = await marzban.get_user_usage(username)

        return MarzbanUserInfo(
            username=user["username"],
            status=user.get("status", "unknown"),
            expire=user.get("expire"),
            data_limit_gb=usage["limit_gb"] if usage else 0,
            used_gb=usage["used_gb"] if usage else 0,
            subscription_url=user.get("subscription_url")
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Could not connect to Marzban: {str(e)}"
        )


@router.post("/sync/{username}")
async def sync_marzban_user(
    username: str,
    current_user: User = Depends(get_agent_user),
    marzban: MarzbanClient = Depends(get_marzban_client)
):
    """Sync user data from Marzban (Agent/Admin only)"""
    try:
        user = await marzban.get_user(username)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found in Marzban"
            )

        # Return synced data
        usage = await marzban.get_user_usage(username)
        return {
            "username": user["username"],
            "status": user.get("status"),
            "expire": user.get("expire"),
            "used_gb": usage["used_gb"] if usage else 0,
            "limit_gb": usage["limit_gb"] if usage else 0,
            "synced": True
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Could not connect to Marzban: {str(e)}"
        )


@router.get("/health")
async def marzban_health(
    marzban: MarzbanClient = Depends(get_marzban_client)
):
    """Check Marzban connection health"""
    try:
        await marzban.authenticate()
        return {"status": "connected", "url": marzban.base_url}
    except Exception as e:
        return {
            "status": "disconnected",
            "url": marzban.base_url,
            "error": str(e)
        }
