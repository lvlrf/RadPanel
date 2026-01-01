"""
Authentication API Tests
"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_user(client: AsyncClient):
    """Test user registration"""
    response = await client.post(
        "/api/auth/register",
        json={
            "username": "newuser",
            "password": "password123",
            "first_name": "New",
            "last_name": "User",
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "newuser"
    assert "password" not in data


@pytest.mark.asyncio
async def test_register_duplicate_username(client: AsyncClient):
    """Test registration with duplicate username"""
    # First registration
    await client.post(
        "/api/auth/register",
        json={
            "username": "duplicate",
            "password": "password123",
        }
    )

    # Second registration with same username
    response = await client.post(
        "/api/auth/register",
        json={
            "username": "duplicate",
            "password": "password456",
        }
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, admin_user):
    """Test successful login"""
    response = await client.post(
        "/api/auth/login",
        data={
            "username": "admin",
            "password": "admin123",
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient, admin_user):
    """Test login with wrong password"""
    response = await client.post(
        "/api/auth/login",
        data={
            "username": "admin",
            "password": "wrongpassword",
        }
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_login_nonexistent_user(client: AsyncClient):
    """Test login with non-existent user"""
    response = await client.post(
        "/api/auth/login",
        data={
            "username": "nonexistent",
            "password": "password123",
        }
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_current_user(client: AsyncClient, admin_user, admin_token):
    """Test getting current user info"""
    response = await client.get(
        "/api/auth/me",
        cookies={"access_token": admin_token}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "admin"
    assert data["role"] == "ADMIN"


@pytest.mark.asyncio
async def test_get_current_user_unauthorized(client: AsyncClient):
    """Test getting current user without authentication"""
    response = await client.get("/api/auth/me")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_change_password(client: AsyncClient, admin_user, admin_token):
    """Test password change"""
    response = await client.post(
        "/api/auth/change-password",
        json={
            "old_password": "admin123",
            "new_password": "newpassword123",
        },
        cookies={"access_token": admin_token}
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_logout(client: AsyncClient, admin_user, admin_token):
    """Test logout"""
    response = await client.post(
        "/api/auth/logout",
        cookies={"access_token": admin_token}
    )
    assert response.status_code == 200
