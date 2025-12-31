# Task Breakdown - RAD Panel MVP

**Total Estimated Time**: 24-26 hours  
**Complexity Legend**: L (Low: <1h), M (Medium: 1-3h), H (High: 3-6h)

---

## Phase 1: Project Setup & Infrastructure (4 hours)

### TASK-001: Project Structure Setup [L]
**Time**: 30 min  
**Description**: Create directory structure, initialize Git, setup basic configs

**Deliverables**:
- `/backend` - FastAPI application
- `/frontend` - React application
- `/docker` - Docker configs
- `/docs` - All documentation
- `.gitignore`, `README.md`

---

### TASK-002: Database Schema Design & Setup [M]
**Time**: 2 hours  
**Description**: Design PostgreSQL schema, create models, setup Alembic migrations

**Tables**:
```sql
users (id, username, email, password_hash, role, status, created_at)
agents (id, user_id, first_name, last_name, phone, shop_name, credit_confirmed, credit_pending, status)
end_users (id, user_id, phone, verified, status)
plans (id, name, days, data_limit_gb, price_public, price_agent, status)
payment_methods (id, type, alias, config_json, status, daily_limit_count, daily_limit_amount)
payments (id, user_id, amount, method_id, receipt_url, status, admin_notes, created_at)
orders (id, agent_id, plan_id, marzban_username, amount, status, created_at)
marzban_users (id, order_id, username, subscription_url, expire_date, data_limit, created_at)
transactions (id, user_id, type, amount, balance_before, balance_after, reference_id, notes, created_at)
```

**Indexes**:
- users(username), users(email)
- agents(user_id), agents(status)
- payments(user_id, status)
- orders(agent_id, status)
- transactions(user_id, created_at)

**Deliverables**:
- SQLAlchemy models
- Alembic migration files
- Database initialization script

---

### TASK-003: Docker Configuration [L]
**Time**: 1 hour  
**Description**: Setup Docker Compose for development and production

**Services**:
- PostgreSQL 15
- Backend (FastAPI)
- Frontend (React)
- Nginx (reverse proxy + SSL)

**Deliverables**:
- `docker-compose.yml`
- `docker-compose.prod.yml`
- Dockerfiles for backend/frontend
- `.env.example`

---

### TASK-004: Nginx + SSL Configuration [L]
**Time**: 30 min  
**Description**: Configure Nginx reverse proxy with Let's Encrypt

**Deliverables**:
- `nginx.conf`
- SSL certificate auto-renewal script
- HTTP → HTTPS redirect

---

## Phase 2: Backend Core (8 hours)

### TASK-005: Authentication System [M]
**Time**: 2 hours  
**Description**: JWT-based auth with bcrypt password hashing

**Endpoints**:
```
POST /api/auth/login
POST /api/auth/register (for end-users only)
POST /api/auth/logout
GET  /api/auth/me
POST /api/auth/change-password
```

**Features**:
- JWT token generation (7-day expiry)
- httpOnly cookies
- Password hashing (bcrypt, cost 12)
- Role-based middleware

**Deliverables**:
- `auth.py` - Auth logic
- `security.py` - Password utils, JWT utils
- `middleware.py` - Role check middleware

---

### TASK-006: User Management API [M]
**Time**: 2 hours  
**Description**: CRUD for users, agents, end-users

**Endpoints**:
```
# Admin only
POST   /api/admin/agents
GET    /api/admin/agents
GET    /api/admin/agents/{id}
PUT    /api/admin/agents/{id}
DELETE /api/admin/agents/{id}
POST   /api/admin/agents/{id}/credit (manual adjustment)

# Agents & End-users
GET    /api/users/me
PUT    /api/users/me
```

**Deliverables**:
- `users.py` - User CRUD
- `agents.py` - Agent management
- Pydantic schemas for validation

---

### TASK-007: Plan Management API [M]
**Time**: 1.5 hours  
**Description**: CRUD for VPN plans (admin only)

**Endpoints**:
```
POST   /api/admin/plans
GET    /api/plans (public - active only)
GET    /api/admin/plans (admin - all)
GET    /api/plans/{id}
PUT    /api/admin/plans/{id}
DELETE /api/admin/plans/{id}
```

**Deliverables**:
- `plans.py` - Plan CRUD
- Price calculation logic
- Active/inactive filtering

---

### TASK-008: Payment Method Management [M]
**Time**: 1.5 hours  
**Description**: Manage card/SHEBA/crypto payment methods

**Endpoints**:
```
POST   /api/admin/payment-methods
GET    /api/payment-methods (public - active + random rotation)
GET    /api/admin/payment-methods (admin - all)
PUT    /api/admin/payment-methods/{id}
DELETE /api/admin/payment-methods/{id}
```

**Features**:
- Random card rotation (select random active card)
- Daily limit tracking
- JSON config storage for flexible fields

**Deliverables**:
- `payment_methods.py`
- Random selection logic
- Limit validation

---

### TASK-009: Payment & Credit System [H]
**Time**: 3 hours  
**Description**: Upload receipts, temp credit, approval workflow

**Endpoints**:
```
POST   /api/payments/upload (agent/end-user)
GET    /api/payments/my (user's payments)
GET    /api/admin/payments (all pending)
PUT    /api/admin/payments/{id}/approve
PUT    /api/admin/payments/{id}/reject
```

**Logic**:
```python
# On upload
payment.status = PENDING
agent.credit_pending += payment.amount

# On approve
agent.credit_pending -= payment.amount
agent.credit_confirmed += payment.amount
create_transaction(type=CHARGE_APPROVED)

# On reject
agent.credit_pending -= payment.amount
# This makes total credit negative if already spent
create_transaction(type=CHARGE_REJECTED)
```

**Deliverables**:
- `payments.py`
- Receipt upload handling (save to /uploads)
- Transaction logging
- Credit calculation logic

---

### TASK-010: Marzban Integration [H]
**Time**: 3 hours  
**Description**: API client for Marzban user management

**Features**:
- Authentication (token-based)
- HTTP proxy support (env variable)
- User CRUD operations
- Username uniqueness check
- Subscription URL retrieval

**Endpoints** (Marzban):
```
POST /api/admin/token
POST /api/user
GET  /api/user/{username}
PUT  /api/user/{username}
DELETE /api/user/{username}
```

**RAD Panel Endpoints**:
```
POST   /api/marzban/users (create in Marzban + deduct credit)
GET    /api/marzban/users/check-username/{username}
GET    /api/marzban/users/my (agent's users)
DELETE /api/marzban/users/{id} (with refund logic)
```

**Note Auto-generation**:
```python
note = f"""
RAD Panel User
Created by: {agent.username}
Created at: {datetime.now()}
Plan: {plan.name}
Price: {amount} IRR
Agent Note: {custom_notes}
"""
```

**Deliverables**:
- `marzban_client.py` - API client
- `marzban_service.py` - Business logic
- Error handling & retries
- Proxy configuration

---

## Phase 3: Backend Business Logic (4 hours)

### TASK-011: Order Management [M]
**Time**: 2 hours  
**Description**: Create orders, link to Marzban users, calculate refunds

**Endpoints**:
```
POST /api/orders (create order + Marzban user)
GET  /api/orders/my
GET  /api/admin/orders
GET  /api/orders/{id}
```

**Order Flow**:
```
1. Validate: plan exists, user has credit
2. Calculate price (agent or public)
3. Check credit: confirmed + pending >= price
4. Create Marzban user
5. Deduct credit (from confirmed first, then pending)
6. Create order record
7. Create transaction log
8. Return subscription URL
```

**Deliverables**:
- `orders.py`
- Price calculation
- Credit deduction logic
- Order status tracking

---

### TASK-012: Transaction Ledger [M]
**Time**: 1 hour  
**Description**: Complete audit trail for all financial operations

**Transaction Types**:
- CHARGE_PENDING (receipt uploaded)
- CHARGE_APPROVED (payment approved)
- CHARGE_REJECTED (payment rejected)
- CHARGE_MANUAL (admin manual adjustment)
- ORDER_CREATED (user created)
- ORDER_REFUND (user deleted/disabled)

**Features**:
- Immutable records
- Balance snapshots (before/after)
- Reference to source (payment_id, order_id)
- Admin/system notes

**Deliverables**:
- `transactions.py`
- Auto-logging on all credit changes
- Query endpoints for history

---

### TASK-013: 24-Hour Rules Engine [M]
**Time**: 1.5 hours  
**Description**: Background job for negative credit enforcement

**Jobs**:
```python
@cron("0 * * * *")  # Every hour
def check_negative_credit():
    agents = get_agents_with_negative_credit()
    for agent in agents:
        if agent.negative_since > 24h:
            disable_all_users(agent)
            send_notification(agent)
        else:
            block_user_creation(agent)
```

**Logic**:
- Track `negative_credit_since` timestamp
- Block user creation if negative
- Disable users after 24h
- Re-enable when credit positive

**Deliverables**:
- `background_jobs.py`
- Cron scheduler (APScheduler)
- Negative credit tracking

---

### TASK-014: Refund Calculation [M]
**Time**: 1 hour  
**Description**: Calculate refund for deleted/disabled users

**Formula**:
```python
days_remaining = (expire_date - now).days
data_remaining_gb = data_limit_gb - data_used_gb

# Pro-rated refund
refund_days = (days_remaining / total_days) * price
refund_data = (data_remaining_gb / total_gb) * price

total_refund = min(refund_days, refund_data)  # Conservative approach
```

**Rules**:
- Only if < 24h since creation
- Based on unused days AND data
- Transaction logged
- Credit added back to agent

**Deliverables**:
- `refund_calculator.py`
- Integration with user delete endpoint

---

## Phase 4: Frontend (6 hours)

### TASK-015: Frontend Setup & Structure [L]
**Time**: 30 min  
**Description**: React app with routing, state management, UI library

**Stack**:
- React 18
- React Router v6
- TanStack Query (data fetching)
- Tailwind CSS
- Headless UI (components)

**Structure**:
```
/src
  /components - Reusable components
  /pages - Route pages
  /services - API clients
  /hooks - Custom hooks
  /utils - Helpers
  App.jsx
  main.jsx
```

**Deliverables**:
- Vite config
- Tailwind config
- Router setup
- API client (axios)

---

### TASK-016: Authentication UI [M]
**Time**: 1.5 hours  
**Description**: Login/register pages, auth context

**Pages**:
- `/login` - Login form
- `/register` - End-user registration

**Features**:
- Form validation
- Error messages
- Remember me (optional)
- Auth context (user state)
- Protected routes

**Design** (following frontend-design skill):
- **Tone**: Clean, professional, minimal
- **Typography**: Modern sans-serif (not Inter/Roboto)
- **Colors**: Professional blue/gray palette with RAD brand color
- **Motion**: Smooth transitions, subtle hover effects
- **Dark mode**: Toggle in header

**Deliverables**:
- Login/Register components
- AuthContext
- ProtectedRoute wrapper

---

### TASK-017: Admin Dashboard [H]
**Time**: 3 hours  
**Description**: Main admin panel with all management features

**Sections**:
1. **Overview** - Stats (total agents, active users, pending payments)
2. **Agents** - CRUD agents, credit management
3. **Plans** - CRUD plans
4. **Payment Methods** - CRUD payment methods
5. **Payments** - Approve/reject queue
6. **Orders** - All orders with filters
7. **Reports** - Excel export

**Components**:
- AgentsList - Table with actions
- AgentForm - Create/edit modal
- PlansList - CRUD table
- PaymentApproval - Pending payments with preview
- ReportsExport - Filters + download button

**Deliverables**:
- Admin layout with sidebar
- All CRUD components
- Data tables with pagination
- Modals for forms
- Excel export functionality

---

### TASK-018: Agent Dashboard [M]
**Time**: 2 hours  
**Description**: Agent panel for creating users and managing wallet

**Sections**:
1. **Wallet** - Balance (confirmed + pending), payment upload
2. **Create User** - Form with plan selection
3. **My Users** - List with subscription links
4. **Payments** - Upload history

**Components**:
- WalletCard - Show balance breakdown (click for details)
- CreateUserForm - Multi-step form (plan → details → confirm)
- UsersList - Table with subscription URLs
- PaymentUpload - Receipt upload with preview

**Credit Display**:
```
┌─────────────────────────┐
│ اعتبار کل: 2,500,000 ت │  ← Shows total
│ (کلیک برای جزئیات)     │
└─────────────────────────┘

On click:
┌──────────────────────────────┐
│ اعتبار تایید شده: 1,500,000│
│ اعتبار امانی: 1,000,000    │
│ ─────────────────────────   │
│ جمع: 2,500,000 تومان        │
│                              │
│ توضیحات:                    │
│ اعتبار امانی منتظر تایید  │
│ است. در صورت عدم تایید      │
│ ظرف 24 ساعت، اکانت‌ها       │
│ غیرفعال می‌شوند.            │
└──────────────────────────────┘
```

**Deliverables**:
- Agent layout
- Wallet management UI
- User creation flow
- Payment upload

---

### TASK-019: End-User Dashboard [M]
**Time**: 1.5 hours  
**Description**: Simple panel for end-users to buy and view accounts

**Sections**:
1. **Buy Account** - Select plan, upload payment
2. **My Accounts** - View subscription links
3. **Payments** - Upload history

**Components**:
- PlanSelector - Card-based plan selection
- BuyAccountForm - Purchase flow
- AccountsList - Subscription URLs with copy button
- PaymentStatus - Track payment approval

**Deliverables**:
- End-user layout
- Purchase flow
- Account viewing

---

### TASK-020: Common UI Components [M]
**Time**: 1 hour  
**Description**: Reusable components for consistency

**Components**:
- Button - Primary, secondary, danger variants
- Input - Text, number, select, file upload
- Table - Paginated, sortable
- Modal - Generic modal wrapper
- Card - Content containers
- Alert - Success, error, warning, info
- Spinner - Loading states
- Badge - Status indicators

**Deliverables**:
- `/components/ui` directory
- Styled with Tailwind
- Dark mode support

---

## Phase 5: Reports & Excel (2 hours)

### TASK-021: Excel Export Backend [M]
**Time**: 1 hour  
**Description**: Generate Excel files from transaction data

**Endpoint**:
```
POST /api/admin/reports/export
Body: {
  date_from: "2025-01-01",
  date_to: "2025-01-31",
  agents: [1, 2, 3],
  statuses: ["APPROVED", "PENDING"],
  types: ["CHARGE", "ORDER"]
}
```

**Library**: openpyxl (Python)

**Features**:
- Custom filters
- UTF-8 Persian text
- Auto-width columns
- Header row with formatting
- Filename: `RAD_Report_2025-01-01_2025-01-31.xlsx`

**Deliverables**:
- `reports.py`
- Excel generation logic
- Download endpoint

---

### TASK-022: Excel Export Frontend [L]
**Time**: 1 hour  
**Description**: UI for report generation and download

**Component**:
- Date range picker
- Multi-select filters (agents, statuses, types)
- Export button
- Download progress indicator

**Deliverables**:
- ReportsPage component
- Filter form
- Download trigger

---

## Phase 6: Testing & Deployment (4 hours)

### TASK-023: Unit Tests [M]
**Time**: 2 hours  
**Description**: Core business logic tests

**Coverage**:
- Authentication (login, JWT)
- Credit calculation (pending + confirmed)
- Refund calculation
- Payment approval/rejection
- Negative credit rules
- Order creation

**Framework**: pytest

**Deliverables**:
- `/tests/test_auth.py`
- `/tests/test_credit.py`
- `/tests/test_refunds.py`
- `/tests/test_orders.py`
- ~80% coverage

---

### TASK-024: Integration Tests [L]
**Time**: 1 hour  
**Description**: End-to-end API tests

**Scenarios**:
- Complete order flow (agent creates user)
- Payment approval flow
- Refund on user deletion
- Negative credit enforcement

**Deliverables**:
- `/tests/test_integration.py`

---

### TASK-025: Deployment Scripts [M]
**Time**: 1.5 hours  
**Description**: Production deployment automation

**Scripts**:
- `deploy.sh` - Full deployment
- `backup.sh` - Database backup
- `restore.sh` - Database restore
- `ssl-renew.sh` - SSL certificate renewal

**Deliverables**:
- Deployment scripts
- Systemd service files
- Cron jobs for backups
- DEPLOYMENT_GUIDE.md

---

## Phase 7: Documentation (2 hours)

### TASK-026: User Documentation [M]
**Time**: 1 hour  
**Description**: User manual in Persian

**Sections**:
- نصب و راه‌اندازی
- ورود به سیستم
- راهنمای مدیر (ساخت نماینده، تایید پرداخت)
- راهنمای نماینده (ساخت کاربر، شارژ کیف پول)
- راهنمای کاربر نهایی (خرید اکانت)
- رفع مشکلات متداول

**Deliverables**:
- `USER_MANUAL.md` (Persian)

---

### TASK-027: Technical Documentation [M]
**Time**: 1 hour  
**Description**: Developer/admin technical docs

**Sections**:
- Architecture overview
- API documentation
- Database schema
- Deployment guide
- Environment variables
- Troubleshooting

**Deliverables**:
- `ARCHITECTURE.md`
- `API.md`
- `DATABASE_SCHEMA.md`
- `DEPLOYMENT_GUIDE.md`
- `TROUBLESHOOTING.md`

---

## Summary

**Total Tasks**: 27  
**Total Time**: 26 hours

**By Complexity**:
- Low (L): 6 tasks × 0.5h avg = 3h
- Medium (M): 16 tasks × 1.5h avg = 24h
- High (H): 5 tasks × 3h avg = 15h

**By Phase**:
1. Setup: 4h
2. Backend Core: 8h
3. Business Logic: 4h
4. Frontend: 6h
5. Reports: 2h
6. Testing: 4h
7. Documentation: 2h

**Estimated Delivery**: 1.5-2 working days (with parallel work on frontend/backend)

---

## Next Steps

After completing MVP:
1. Deploy to staging server
2. User acceptance testing
3. Fix bugs and polish
4. Deploy to production
5. Monitor and gather feedback
6. Plan Phase 2 (Telegram bot, etc.)
