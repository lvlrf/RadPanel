# Detailed Specifications - RAD Panel

**Version**: 1.0.0 MVP  
**Last Updated**: 2025-01-01

---

## Overview

This document provides detailed specifications for all features in RAD Panel MVP.

---

## 1. Authentication & Authorization

### 1.1 Login

**Endpoint**: `POST /api/auth/login`

**Input**:
```json
{
  "username": "string (required, 3-50 chars)",
  "password": "string (required, 8+ chars)"
}
```

**Output (Success)**:
```json
{
  "access_token": "jwt_token_string",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "agent1",
    "role": "AGENT",
    "email": "agent1@example.com"
  }
}
```

**Validation**:
- Username: alphanumeric + underscore, 3-50 chars
- Password: minimum 8 characters
- Rate limit: 5 attempts per 15 minutes per IP

**Security**:
- Password verified with bcrypt
- JWT token with 7-day expiry
- httpOnly cookie set with token

---

### 1.2 Registration (End-users only)

**Endpoint**: `POST /api/auth/register`

**Input**:
```json
{
  "username": "string (required, unique)",
  "password": "string (required, 8+ chars)",
  "email": "string (optional)",
  "phone": "string (optional, Persian format)"
}
```

**Validation**:
- Username uniqueness checked
- Password strength: minimum 8 chars
- Phone format: 09XXXXXXXXX (Iran)
- Email format validation if provided

**Process**:
1. Validate inputs
2. Check username availability
3. Hash password with bcrypt
4. Create user record (role: END_USER)
5. Create end_user profile
6. Auto-login and return token

---

## 2. Agent Management (Admin)

### 2.1 Create Agent

**Endpoint**: `POST /api/admin/agents`

**Input**:
```json
{
  "username": "string (required, unique)",
  "password": "string (required)",
  "email": "string (optional)",
  "first_name": "string (required)",
  "last_name": "string (required)",
  "phone": "string (required)",
  "shop_name": "string (optional)",
  "province": "string (optional)",
  "city": "string (optional)",
  "address_details": "string (optional)",
  "notes": "string (optional)"
}
```

**Process**:
1. Create user account (role: AGENT)
2. Create agent profile
3. Initialize credits to 0
4. Send credentials (email/SMS if configured)

**Output**:
```json
{
  "id": 1,
  "user_id": 5,
  "username": "agent1",
  "first_name": "John",
  "last_name": "Doe",
  "credit_confirmed": 0,
  "credit_pending": 0,
  "total_credit": 0,
  "status": "ACTIVE"
}
```

---

### 2.2 Manual Credit Adjustment

**Endpoint**: `POST /api/admin/agents/{agent_id}/credit`

**Input**:
```json
{
  "amount": "number (can be positive or negative)",
  "notes": "string (required, explanation)"
}
```

**Process**:
1. Verify admin permissions
2. Update `credit_confirmed` by amount
3. Create transaction record (type: CHARGE_MANUAL)
4. Log action with admin ID and notes

**Example**:
```json
{
  "amount": 500000,
  "notes": "بابت جبران خطای سیستم"
}
```

---

## 3. Plan Management (Admin)

### 3.1 Create Plan

**Endpoint**: `POST /api/admin/plans`

**Input**:
```json
{
  "name": "string (required, 3-100 chars)",
  "days": "integer (required, 1-365)",
  "data_limit_gb": "integer (required, 1-1000)",
  "price_public": "number (required, > 0)",
  "price_agent": "number (required, > 0)",
  "status": "ACTIVE | INACTIVE (default: ACTIVE)"
}
```

**Validation**:
- `price_agent` must be < `price_public`
- `days` must be between 1-365
- `data_limit_gb` must be between 1-1000

**Output**:
```json
{
  "id": 1,
  "name": "پلن استاندارد",
  "days": 30,
  "data_limit_gb": 50,
  "price_public": 80000,
  "price_agent": 65000,
  "status": "ACTIVE",
  "created_at": "2025-01-01T10:00:00Z"
}
```

---

## 4. Payment Processing

### 4.1 Upload Payment Receipt

**Endpoint**: `POST /api/payments/upload`

**Input** (multipart/form-data):
```
file: image file (required, max 10MB, jpg/png/pdf)
amount: number (required, > 0)
payment_method_id: integer (required, must be active method)
notes: string (optional)
```

**Process**:
1. Validate file (type, size)
2. Save file to /uploads/{user_id}/{timestamp}_{filename}
3. Create payment record (status: PENDING)
4. Add amount to `credit_pending`
5. Create transaction (type: CHARGE_PENDING)
6. Return payment ID

**Output**:
```json
{
  "payment_id": 123,
  "amount": 1000000,
  "status": "PENDING",
  "receipt_url": "/uploads/5/20250101_123456_receipt.jpg",
  "created_at": "2025-01-01T10:00:00Z",
  "message": "رسید شما دریافت شد و در انتظار تایید است"
}
```

---

### 4.2 Approve Payment (Admin)

**Endpoint**: `PUT /api/admin/payments/{payment_id}/approve`

**Input**:
```json
{
  "notes": "string (optional)"
}
```

**Process**:
1. Verify payment is PENDING
2. Move amount from `credit_pending` to `credit_confirmed`
3. Update payment status to APPROVED
4. Create transaction (type: CHARGE_APPROVED)
5. Log approval with admin ID

---

### 4.3 Reject Payment (Admin)

**Endpoint**: `PUT /api/admin/payments/{payment_id}/reject`

**Input**:
```json
{
  "notes": "string (required, rejection reason)"
}
```

**Process**:
1. Verify payment is PENDING
2. Subtract amount from `credit_pending` (may cause negative balance)
3. Update payment status to REJECTED
4. Create transaction (type: CHARGE_REJECTED)
5. Log rejection with admin ID and reason

---

## 5. Order Management

### 5.1 Create Order (VPN User)

**Endpoint**: `POST /api/orders`

**Input**:
```json
{
  "plan_id": "integer (required)",
  "username": "string (required, unique in Marzban)",
  "alias": "string (optional, display name)",
  "on_hold": "boolean (default: false)"
}
```

**Process**:
1. Verify plan exists and is active
2. Check username uniqueness in Marzban
3. Calculate price (agent or public rate)
4. Verify user has sufficient credit (confirmed + pending)
5. Create user in Marzban via API
6. Deduct credit (from confirmed first, then pending)
7. Create order record
8. Create marzban_user record
9. Create transaction (type: ORDER_CREATED)
10. Return subscription URL

**Output**:
```json
{
  "order_id": 456,
  "username": "vpn_user_001",
  "subscription_url": "https://marzban.com/sub/abc123...",
  "plan": {
    "name": "پلن استاندارد",
    "days": 30,
    "data_limit_gb": 50
  },
  "amount_paid": 65000,
  "expire_date": "2025-02-01T10:00:00Z",
  "status": "ACTIVE"
}
```

**Marzban Note Format**:
```
RAD Panel User
Created by: agent1
Created at: 2025-01-01 10:00:00
Plan: پلن استاندارد
Price: 65,000 IRR
Agent Note: [custom notes if any]
Last Modified: 2025-01-01 10:00:00
```

---

### 5.2 Delete Order (with Refund)

**Endpoint**: `DELETE /api/orders/{order_id}`

**Process**:
1. Verify order belongs to user
2. Check if < 24 hours since creation
3. If yes:
   a. Calculate refund (days + data remaining)
   b. Add refund to `credit_confirmed`
   c. Create transaction (type: ORDER_REFUND)
4. Delete user from Marzban
5. Update order status to DELETED
6. Set deleted_at timestamp

**Refund Calculation**:
```python
if (now - created_at) < 24_hours:
    days_remaining = (expire_date - now).days
    days_total = plan.days
    days_pct = days_remaining / days_total
    
    data_remaining_gb = data_limit_gb - data_used_gb
    data_pct = data_remaining_gb / data_limit_gb
    
    refund_pct = min(days_pct, data_pct)  # Conservative
    refund_amount = order.amount * refund_pct
    
    return refund_amount
else:
    return 0  # No refund after 24h
```

---

## 6. Payment Methods

### 6.1 Card-to-Card

**Config JSON**:
```json
{
  "type": "CARD",
  "card_number": "1234567812345678",
  "account_holder": "John Doe",
  "bank": "Bank Melli"
}
```

**Display Logic**:
- When user requests deposit, show random active card
- Track daily usage against limits
- Rotate to prevent overload

---

### 6.2 Crypto

**Config JSON**:
```json
{
  "type": "CRYPTO",
  "coin": "USDT",
  "network": "TRC20",
  "wallet_address": "TXyz123...",
  "bonus_percentage": 10
}
```

**Bonus Calculation**:
```python
if payment_method.type == "CRYPTO":
    bonus_pct = payment_method.config["bonus_percentage"]
    total_credit = amount * (1 + bonus_pct / 100)
else:
    total_credit = amount
```

---

## 7. Background Jobs

### 7.1 Negative Credit Enforcement

**Schedule**: Every hour (cron: `0 * * * *`)

**Process**:
```python
for agent in get_agents_with_negative_credit():
    hours_negative = (now - agent.negative_credit_since).hours
    
    if hours_negative >= 24:
        # Disable all active users
        for order in agent.active_orders:
            await marzban.disable_user(order.marzban_username)
            order.status = "DISABLED"
            create_transaction(
                type="ORDER_DISABLED",
                notes=f"Auto-disabled: {hours_negative}h negative credit"
            )
        
        # Send notification (if configured)
        send_notification(agent, "users_disabled")
```

---

## 8. Reports & Excel Export

### 8.1 Generate Report

**Endpoint**: `POST /api/admin/reports/export`

**Input**:
```json
{
  "date_from": "2025-01-01",
  "date_to": "2025-01-31",
  "agent_ids": [1, 2, 3],
  "statuses": ["APPROVED", "PENDING"],
  "transaction_types": ["CHARGE", "ORDER"]
}
```

**Excel Columns**:
1. تاریخ (Date)
2. ساعت (Time)
3. نماینده (Agent Name)
4. نوع تراکنش (Transaction Type)
5. مبلغ (Amount)
6. وضعیت (Status)
7. روش پرداخت (Payment Method)
8. توضیحات (Notes)

**Output**: Download link to generated .xlsx file

---

## 9. Wallet Display

### 9.1 Wallet Card (Agent View)

**Display**:
```
┌─────────────────────────┐
│ اعتبار کل: 2,500,000 ت │  ← Total (clickable)
│ (کلیک برای جزئیات)     │
└─────────────────────────┘
```

**On Click (Expanded)**:
```
┌──────────────────────────────┐
│ اعتبار تایید شده: 1,500,000│
│ اعتبار امانی: 1,000,000    │
│ ─────────────────────────   │
│ جمع: 2,500,000 تومان        │
│                              │
│ ⚠️ توجه:                    │
│ اعتبار امانی منتظر تایید  │
│ است. در صورت عدم تایید      │
│ ظرف 24 ساعت، امکان ساخت    │
│ کاربر جدید وجود ندارد.      │
└──────────────────────────────┘
```

---

## 10. Error Handling

### Standard Error Response
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message (Persian for users)",
    "details": {
      "field": "Additional context"
    }
  }
}
```

### Common Error Codes
- `AUTH_INVALID_CREDENTIALS`: نام کاربری یا رمز عبور اشتباه است
- `AUTH_TOKEN_EXPIRED`: نشست شما منقضی شده است
- `INSUFFICIENT_CREDIT`: اعتبار کافی نیست
- `USERNAME_EXISTS`: این نام کاربری قبلاً ثبت شده
- `MARZBAN_CONNECTION_ERROR`: خطا در اتصال به پنل مرزبان
- `PAYMENT_NOT_FOUND`: پرداخت یافت نشد
- `INVALID_FILE_TYPE`: فرمت فایل پشتیبانی نمی‌شود

---

## 11. Validation Rules

### Username
- Length: 3-50 characters
- Allowed: a-z, A-Z, 0-9, underscore (_)
- Must start with letter
- Case-insensitive uniqueness

### Password
- Minimum: 8 characters
- Recommended: Letters + numbers
- No maximum length
- Hashed with bcrypt (cost: 12)

### Phone (Iranian)
- Format: 09XXXXXXXXX
- Exactly 11 digits
- Must start with 09

### Amount
- Minimum: 10,000 IRR (10 Toman)
- Maximum: 100,000,000 IRR
- Precision: 2 decimal places

### File Upload
- Max size: 10MB
- Allowed types: jpg, jpeg, png, pdf
- Filename sanitization: remove special chars

---

## 12. Performance Targets

- Page load: < 2 seconds
- API response: < 500ms (95th percentile)
- Database queries: < 100ms
- Concurrent users: 100+
- Uptime: 99%+

---

**Document Status**: ✅ Complete for MVP  
**Last Review**: 2025-01-01  
**Next Update**: After MVP delivery
