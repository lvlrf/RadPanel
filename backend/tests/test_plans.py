"""
Plans API Tests
"""
import pytest
from httpx import AsyncClient

from app.models.plan import Plan, PlanStatus


@pytest.mark.asyncio
async def test_create_plan(client: AsyncClient, admin_user, admin_token, test_session):
    """Test plan creation by admin"""
    response = await client.post(
        "/api/admin/plans",
        json={
            "name": "Test Plan",
            "days": 30,
            "data_limit_gb": 50,
            "price_public": 150000,
            "price_agent": 100000,
            "description": "Test plan description",
        },
        cookies={"access_token": admin_token}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Plan"
    assert data["days"] == 30
    assert data["data_limit_gb"] == 50
    assert data["price_public"] == 150000
    assert data["price_agent"] == 100000
    assert data["status"] == "ACTIVE"


@pytest.mark.asyncio
async def test_create_plan_unauthorized(client: AsyncClient, agent_user, agent_token):
    """Test plan creation by non-admin"""
    response = await client.post(
        "/api/admin/plans",
        json={
            "name": "Test Plan",
            "days": 30,
            "data_limit_gb": 50,
            "price_public": 150000,
            "price_agent": 100000,
        },
        cookies={"access_token": agent_token}
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_list_plans(client: AsyncClient, test_session):
    """Test listing plans"""
    # Create a plan first
    plan = Plan(
        name="List Test Plan",
        days=30,
        data_limit_gb=50,
        price_public=150000,
        price_agent=100000,
        status=PlanStatus.ACTIVE,
    )
    test_session.add(plan)
    await test_session.commit()

    response = await client.get("/api/plans")
    assert response.status_code == 200
    data = response.json()
    assert "plans" in data
    assert len(data["plans"]) >= 1


@pytest.mark.asyncio
async def test_get_plan(client: AsyncClient, test_session):
    """Test getting single plan"""
    plan = Plan(
        name="Get Test Plan",
        days=30,
        data_limit_gb=50,
        price_public=150000,
        price_agent=100000,
        status=PlanStatus.ACTIVE,
    )
    test_session.add(plan)
    await test_session.commit()
    await test_session.refresh(plan)

    response = await client.get(f"/api/plans/{plan.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Get Test Plan"


@pytest.mark.asyncio
async def test_update_plan(client: AsyncClient, admin_user, admin_token, test_session):
    """Test plan update"""
    plan = Plan(
        name="Update Test Plan",
        days=30,
        data_limit_gb=50,
        price_public=150000,
        price_agent=100000,
        status=PlanStatus.ACTIVE,
    )
    test_session.add(plan)
    await test_session.commit()
    await test_session.refresh(plan)

    response = await client.put(
        f"/api/admin/plans/{plan.id}",
        json={
            "name": "Updated Plan Name",
            "price_public": 200000,
        },
        cookies={"access_token": admin_token}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Plan Name"
    assert data["price_public"] == 200000


@pytest.mark.asyncio
async def test_delete_plan(client: AsyncClient, admin_user, admin_token, test_session):
    """Test plan deletion"""
    plan = Plan(
        name="Delete Test Plan",
        days=30,
        data_limit_gb=50,
        price_public=150000,
        price_agent=100000,
        status=PlanStatus.ACTIVE,
    )
    test_session.add(plan)
    await test_session.commit()
    await test_session.refresh(plan)

    response = await client.delete(
        f"/api/admin/plans/{plan.id}",
        cookies={"access_token": admin_token}
    )
    assert response.status_code == 200
