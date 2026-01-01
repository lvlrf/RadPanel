"""
Plan Management API
- Public: View active plans
- Admin: CRUD all plans
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.utils.deps import get_admin_user, get_current_user
from app.models.user import User, UserRole
from app.models.plan import Plan, PlanStatus
from app.schemas.plan import (
    PlanCreate,
    PlanUpdate,
    PlanResponse,
    PlanListResponse
)
from app.schemas.auth import MessageResponse

router = APIRouter()


def plan_to_response(plan: Plan) -> PlanResponse:
    return PlanResponse(
        id=plan.id,
        name=plan.name,
        days=plan.days,
        data_limit_gb=plan.data_limit_gb,
        price_public=plan.price_public,
        price_agent=plan.price_agent,
        status=plan.status.value,
        created_at=plan.created_at
    )


@router.get("/plans", response_model=PlanListResponse)
async def list_plans(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List plans.
    - Non-admin users: only active plans
    - Admin: all plans
    """
    query = select(Plan)

    # Non-admins only see active plans
    if current_user.role != UserRole.ADMIN:
        query = query.where(Plan.status == PlanStatus.ACTIVE)

    query = query.order_by(Plan.price_public.asc())

    result = await db.execute(query)
    plans = result.scalars().all()

    return PlanListResponse(
        plans=[plan_to_response(p) for p in plans],
        total=len(plans)
    )


@router.get("/plans/{plan_id}", response_model=PlanResponse)
async def get_plan(
    plan_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get plan by ID"""
    result = await db.execute(select(Plan).where(Plan.id == plan_id))
    plan = result.scalar_one_or_none()

    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plan not found"
        )

    # Non-admins can only see active plans
    if current_user.role != UserRole.ADMIN and plan.status != PlanStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plan not found"
        )

    return plan_to_response(plan)


@router.post("/admin/plans", response_model=PlanResponse)
async def create_plan(
    request: PlanCreate,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new plan (Admin only)"""
    plan = Plan(
        name=request.name,
        days=request.days,
        data_limit_gb=request.data_limit_gb,
        price_public=request.price_public,
        price_agent=request.price_agent,
        status=PlanStatus.ACTIVE
    )
    db.add(plan)
    await db.commit()
    await db.refresh(plan)

    return plan_to_response(plan)


@router.put("/admin/plans/{plan_id}", response_model=PlanResponse)
async def update_plan(
    plan_id: int,
    request: PlanUpdate,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a plan (Admin only)"""
    result = await db.execute(select(Plan).where(Plan.id == plan_id))
    plan = result.scalar_one_or_none()

    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plan not found"
        )

    update_data = request.model_dump(exclude_unset=True)

    # Handle status separately
    if "status" in update_data:
        status_value = update_data.pop("status")
        if status_value in [s.value for s in PlanStatus]:
            plan.status = PlanStatus(status_value)

    for field, value in update_data.items():
        setattr(plan, field, value)

    await db.commit()
    await db.refresh(plan)

    return plan_to_response(plan)


@router.delete("/admin/plans/{plan_id}", response_model=MessageResponse)
async def delete_plan(
    plan_id: int,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Deactivate a plan (Admin only). Does not delete, just sets to INACTIVE."""
    result = await db.execute(select(Plan).where(Plan.id == plan_id))
    plan = result.scalar_one_or_none()

    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plan not found"
        )

    plan.status = PlanStatus.INACTIVE
    await db.commit()

    return MessageResponse(message="Plan deactivated successfully")
