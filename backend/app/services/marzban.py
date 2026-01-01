"""
Marzban API Client
Handles all communication with Marzban panel
"""
import httpx
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from app.config import settings


class MarzbanClient:
    """Async client for Marzban API"""

    def __init__(self):
        self.base_url = settings.MARZBAN_URL.rstrip("/")
        self.username = settings.MARZBAN_USERNAME
        self.password = settings.MARZBAN_PASSWORD
        self.token: Optional[str] = None
        self.token_expires: Optional[datetime] = None

        # Configure proxy if set
        proxies = None
        if settings.HTTP_PROXY:
            proxies = {
                "http://": settings.HTTP_PROXY,
                "https://": settings.HTTPS_PROXY or settings.HTTP_PROXY
            }

        self.client = httpx.AsyncClient(
            timeout=30.0,
            proxies=proxies,
            verify=True  # Set to False if using self-signed certs
        )

    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()

    async def authenticate(self) -> str:
        """Get or refresh authentication token"""
        # Return cached token if still valid
        if self.token and self.token_expires and self.token_expires > datetime.utcnow():
            return self.token

        # Get new token
        response = await self.client.post(
            f"{self.base_url}/api/admin/token",
            data={
                "username": self.username,
                "password": self.password
            }
        )

        if response.status_code != 200:
            raise Exception(f"Marzban authentication failed: {response.text}")

        data = response.json()
        self.token = data["access_token"]
        # Token expires in 1 hour, refresh at 50 minutes
        self.token_expires = datetime.utcnow() + timedelta(minutes=50)

        return self.token

    async def _request(
        self,
        method: str,
        endpoint: str,
        json: Optional[Dict] = None,
        params: Optional[Dict] = None
    ) -> httpx.Response:
        """Make authenticated request to Marzban API"""
        token = await self.authenticate()

        headers = {"Authorization": f"Bearer {token}"}

        response = await self.client.request(
            method,
            f"{self.base_url}{endpoint}",
            headers=headers,
            json=json,
            params=params
        )

        return response

    async def check_username_exists(self, username: str) -> bool:
        """Check if username already exists in Marzban"""
        response = await self._request("GET", f"/api/user/{username}")
        return response.status_code == 200

    async def create_user(
        self,
        username: str,
        days: int,
        data_limit_gb: int,
        note: str = "",
        on_hold: bool = False
    ) -> Dict[str, Any]:
        """
        Create a new user in Marzban

        Args:
            username: Unique username
            days: Number of days until expiry
            data_limit_gb: Data limit in gigabytes
            note: Note to store in Marzban
            on_hold: Whether to create in "on hold" status

        Returns:
            User data including subscription_url
        """
        # Calculate expiry timestamp
        expire_timestamp = None
        if not on_hold:
            expire_timestamp = int((datetime.utcnow() + timedelta(days=days)).timestamp())

        # Convert GB to bytes
        data_limit_bytes = data_limit_gb * 1024 * 1024 * 1024

        payload = {
            "username": username,
            "proxies": {},  # Use all available proxies
            "inbounds": {},  # Use default inbounds
            "expire": expire_timestamp,
            "data_limit": data_limit_bytes,
            "data_limit_reset_strategy": "no_reset",
            "status": "on_hold" if on_hold else "active",
            "note": note
        }

        response = await self._request("POST", "/api/user", json=payload)

        if response.status_code == 200:
            return response.json()
        elif response.status_code == 409:
            raise Exception(f"Username '{username}' already exists")
        else:
            raise Exception(f"Failed to create Marzban user: {response.text}")

    async def get_user(self, username: str) -> Optional[Dict[str, Any]]:
        """Get user info from Marzban"""
        response = await self._request("GET", f"/api/user/{username}")

        if response.status_code == 200:
            return response.json()
        elif response.status_code == 404:
            return None
        else:
            raise Exception(f"Failed to get Marzban user: {response.text}")

    async def update_user(
        self,
        username: str,
        **kwargs
    ) -> Dict[str, Any]:
        """Update user in Marzban"""
        # Get current user data
        current = await self.get_user(username)
        if not current:
            raise Exception(f"User '{username}' not found")

        # Prepare update payload
        payload = {}

        if "status" in kwargs:
            payload["status"] = kwargs["status"]

        if "expire" in kwargs:
            payload["expire"] = kwargs["expire"]

        if "data_limit" in kwargs:
            payload["data_limit"] = kwargs["data_limit"]

        if "note" in kwargs:
            payload["note"] = kwargs["note"]

        response = await self._request("PUT", f"/api/user/{username}", json=payload)

        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"Failed to update Marzban user: {response.text}")

    async def disable_user(self, username: str) -> bool:
        """Disable a user in Marzban"""
        try:
            await self.update_user(username, status="disabled")
            return True
        except Exception:
            return False

    async def enable_user(self, username: str) -> bool:
        """Enable a user in Marzban"""
        try:
            await self.update_user(username, status="active")
            return True
        except Exception:
            return False

    async def delete_user(self, username: str) -> bool:
        """Delete a user from Marzban"""
        response = await self._request("DELETE", f"/api/user/{username}")
        return response.status_code == 200

    async def get_subscription_url(self, username: str) -> Optional[str]:
        """Get subscription URL for a user"""
        user = await self.get_user(username)
        if user:
            return user.get("subscription_url")
        return None

    async def get_user_usage(self, username: str) -> Optional[Dict[str, Any]]:
        """Get user's data usage"""
        user = await self.get_user(username)
        if user:
            return {
                "used_traffic": user.get("used_traffic", 0),  # bytes
                "data_limit": user.get("data_limit", 0),  # bytes
                "used_gb": user.get("used_traffic", 0) / (1024 * 1024 * 1024),
                "limit_gb": user.get("data_limit", 0) / (1024 * 1024 * 1024),
            }
        return None


# Singleton instance
marzban_client = MarzbanClient()


async def get_marzban_client() -> MarzbanClient:
    """Dependency to get Marzban client"""
    return marzban_client
