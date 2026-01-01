"""
Payments API
- Upload receipts
- View payment history
- Admin: Approve/Reject payments
"""
import os
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import joinedload
from decimal import Decimal

from app.database import get_db
from app.config import settings
from app.utils.deps import get_admin_user, get_current_user
from app.models.user import User, UserRole
from app.models.payment import Payment, PaymentStatus
from app.models.payment_method import PaymentMethod
from app.schemas.payment import (
    PaymentCreate,
    PaymentApprove,
    PaymentReject,
    PaymentResponse,
    PaymentListResponse
)
from app.schemas.auth import MessageResponse
from app.services.credit import add_pending_credit, approve_payment, reject_payment

router = APIRouter()


def payment_to_response(payment: Payment) -> PaymentResponse:
    return PaymentResponse(
        id=payment.id,
        user_id=payment.user_id,
        username=payment.user.username,
        amount=payment.amount,
        payment_method_id=payment.payment_method_id,
        payment_method_alias=payment.payment_method.alias if payment.payment_method else "",
        receipt_url=payment.receipt_url,
        status=payment.status.value,
        admin_notes=payment.admin_notes,
        processed_at=payment.processed_at,
        created_at=payment.created_at
    )


@router.post("/payments/upload", response_model=PaymentResponse)
async def upload_payment(
    amount: Decimal = Form(..., gt=0),
    payment_method_id: int = Form(...),
    receipt: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload a payment receipt.
    Immediately adds the amount as "pending credit" (اعتبار امانی).
    """
    # Verify payment method exists and is active
    result = await db.execute(
        select(PaymentMethod).where(PaymentMethod.id == payment_method_id)
    )
    pm = result.scalar_one_or_none()
    if not pm or pm.status.value != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or inactive payment method"
        )

    # Validate file
    if receipt.content_type not in ["image/jpeg", "image/png", "image/webp", "application/pdf"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only JPEG, PNG, WebP, and PDF are allowed."
        )

    if receipt.size > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size is {settings.MAX_UPLOAD_SIZE // 1024 // 1024}MB"
        )

    # Save file
    ext = os.path.splitext(receipt.filename)[1] or ".jpg"
    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(settings.UPLOAD_DIR, filename)

    with open(filepath, "wb") as f:
        content = await receipt.read()
        f.write(content)

    # Create payment record
    payment = Payment(
        user_id=current_user.id,
        amount=amount,
        payment_method_id=payment_method_id,
        receipt_url=f"/uploads/{filename}",
        status=PaymentStatus.PENDING
    )
    db.add(payment)
    await db.flush()

    # Add pending credit
    await add_pending_credit(current_user, amount, payment.id, db)

    await db.commit()

    # Reload with relationships
    result = await db.execute(
        select(Payment)
        .options(joinedload(Payment.user), joinedload(Payment.payment_method))
        .where(Payment.id == payment.id)
    )
    payment = result.scalar_one()

    return payment_to_response(payment)


@router.get("/payments/my", response_model=PaymentListResponse)
async def get_my_payments(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's payment history"""
    query = (
        select(Payment)
        .options(joinedload(Payment.user), joinedload(Payment.payment_method))
        .where(Payment.user_id == current_user.id)
        .order_by(Payment.created_at.desc())
    )

    # Count
    count_result = await db.execute(
        select(func.count(Payment.id)).where(Payment.user_id == current_user.id)
    )
    total = count_result.scalar()

    # Paginate
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    payments = result.scalars().all()

    return PaymentListResponse(
        payments=[payment_to_response(p) for p in payments],
        total=total,
        page=page,
        page_size=page_size
    )


# ============= Admin Endpoints =============

@router.get("/admin/payments", response_model=PaymentListResponse)
async def list_payments(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: str = Query(None, alias="status"),
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """List all payments (Admin only)"""
    query = (
        select(Payment)
        .options(joinedload(Payment.user), joinedload(Payment.payment_method))
    )

    if status_filter:
        query = query.where(Payment.status == PaymentStatus(status_filter))

    query = query.order_by(Payment.created_at.desc())

    # Count
    count_query = select(func.count(Payment.id))
    if status_filter:
        count_query = count_query.where(Payment.status == PaymentStatus(status_filter))
    count_result = await db.execute(count_query)
    total = count_result.scalar()

    # Paginate
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    payments = result.scalars().all()

    return PaymentListResponse(
        payments=[payment_to_response(p) for p in payments],
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/admin/payments/pending", response_model=PaymentListResponse)
async def list_pending_payments(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """List pending payments for approval (Admin only)"""
    return await list_payments(page, page_size, "PENDING", admin, db)


@router.put("/admin/payments/{payment_id}/approve", response_model=PaymentResponse)
async def approve_payment_endpoint(
    payment_id: int,
    request: PaymentApprove,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Approve a pending payment (Admin only)"""
    result = await db.execute(
        select(Payment)
        .options(joinedload(Payment.user), joinedload(Payment.payment_method))
        .where(Payment.id == payment_id)
    )
    payment = result.scalar_one_or_none()

    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )

    if payment.status != PaymentStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Payment is already {payment.status.value}"
        )

    # Update payment status
    payment.status = PaymentStatus.APPROVED
    payment.admin_notes = request.admin_notes
    payment.processed_at = datetime.utcnow()
    payment.processed_by = admin.id

    # Move pending to confirmed credit
    await approve_payment(
        payment.user,
        payment.amount,
        payment.id,
        admin,
        request.admin_notes,
        db
    )

    await db.commit()
    await db.refresh(payment)

    return payment_to_response(payment)


@router.put("/admin/payments/{payment_id}/reject", response_model=PaymentResponse)
async def reject_payment_endpoint(
    payment_id: int,
    request: PaymentReject,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Reject a pending payment (Admin only)"""
    result = await db.execute(
        select(Payment)
        .options(joinedload(Payment.user), joinedload(Payment.payment_method))
        .where(Payment.id == payment_id)
    )
    payment = result.scalar_one_or_none()

    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )

    if payment.status != PaymentStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Payment is already {payment.status.value}"
        )

    # Update payment status
    payment.status = PaymentStatus.REJECTED
    payment.admin_notes = request.admin_notes
    payment.processed_at = datetime.utcnow()
    payment.processed_by = admin.id

    # Remove pending credit
    await reject_payment(
        payment.user,
        payment.amount,
        payment.id,
        admin,
        request.admin_notes,
        db
    )

    await db.commit()
    await db.refresh(payment)

    return payment_to_response(payment)
