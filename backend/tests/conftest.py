"""
Test configuration and fixtures
"""
import pytest
import asyncio
from typing import AsyncGenerator, Generator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from httpx import AsyncClient
from fastapi import FastAPI

from app.database import Base
from app.main import app
from app.utils.deps import get_db
from app.utils.security import hash_password, create_access_token
from app.models.user import User, UserRole


# Test database URL (SQLite for testing)
TEST_DATABASE_URL = "sqlite+aiosqlite:///./test.db"


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create event loop for async tests"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
async def test_engine():
    """Create test database engine"""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        echo=False,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest.fixture(scope="function")
async def test_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """Create test database session"""
    async_session = sessionmaker(
        test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    async with async_session() as session:
        yield session


@pytest.fixture(scope="function")
async def test_app(test_session) -> FastAPI:
    """Create test FastAPI app with test database"""
    async def override_get_db():
        yield test_session

    app.dependency_overrides[get_db] = override_get_db
    yield app
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
async def client(test_app) -> AsyncGenerator[AsyncClient, None]:
    """Create async test client"""
    async with AsyncClient(app=test_app, base_url="http://test") as ac:
        yield ac


@pytest.fixture(scope="function")
async def admin_user(test_session) -> User:
    """Create admin user fixture"""
    user = User(
        username="admin",
        password_hash=hash_password("admin123"),
        role=UserRole.ADMIN,
        first_name="Admin",
        last_name="User",
        is_active=True,
    )
    test_session.add(user)
    await test_session.commit()
    await test_session.refresh(user)
    return user


@pytest.fixture(scope="function")
async def agent_user(test_session) -> User:
    """Create agent user fixture"""
    user = User(
        username="agent1",
        password_hash=hash_password("agent123"),
        role=UserRole.AGENT,
        first_name="Agent",
        last_name="One",
        is_active=True,
    )
    test_session.add(user)
    await test_session.commit()
    await test_session.refresh(user)
    return user


@pytest.fixture(scope="function")
def admin_token(admin_user) -> str:
    """Create admin JWT token"""
    return create_access_token({"sub": admin_user.username, "role": admin_user.role.value})


@pytest.fixture(scope="function")
def agent_token(agent_user) -> str:
    """Create agent JWT token"""
    return create_access_token({"sub": agent_user.username, "role": agent_user.role.value})
