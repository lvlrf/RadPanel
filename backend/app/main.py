"""
RAD Panel - Main Application Entry Point
VPN Sales Management System on top of Marzban
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os

from app.config import settings
from app.database import engine, Base
from app.api import auth, agents, plans, payments, payment_methods, orders, marzban, reports, users
from app.jobs.scheduler import start_scheduler, stop_scheduler
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    # Create upload directory
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    # Create tables (in production, use Alembic migrations)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Start background jobs
    start_scheduler()

    yield

    # Shutdown
    stop_scheduler()
    await engine.dispose()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="VPN Sales Management System - Built on Marzban",
    lifespan=lifespan,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files (uploads)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# API Routes
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(agents.router, prefix="/api/admin/agents", tags=["Agents"])
app.include_router(plans.router, prefix="/api", tags=["Plans"])
app.include_router(payments.router, prefix="/api", tags=["Payments"])
app.include_router(payment_methods.router, prefix="/api", tags=["Payment Methods"])
app.include_router(orders.router, prefix="/api/orders", tags=["Orders"])
app.include_router(marzban.router, prefix="/api/marzban", tags=["Marzban"])
app.include_router(reports.router, prefix="/api/admin/reports", tags=["Reports"])


@app.get("/")
async def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
