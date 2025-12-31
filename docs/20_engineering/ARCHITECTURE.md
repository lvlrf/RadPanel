# System Architecture - RAD Panel

**Version**: 1.0.0 MVP  
**Last Updated**: 2025-01-01

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Internet                            │
└────────────────────┬────────────────────────────────────────┘
                     │
              ┌──────▼──────┐
              │   Nginx     │  ← SSL Termination, Reverse Proxy
              │ (Port 443)  │
              └──────┬──────┘
                     │
        ┌────────────┼────────────┐
        │                         │
   ┌────▼────┐              ┌────▼────┐
   │ React   │              │ FastAPI │  ← Backend API
   │Frontend │              │ Backend │
   │(SPA)    │              │(Port 8000)
   └─────────┘              └────┬────┘
                                 │
                    ┌────────────┼────────────┐
                    │                         │
              ┌─────▼──────┐          ┌──────▼────────┐
              │ PostgreSQL │          │ Marzban API   │
              │  Database  │          │ (Port 8080)   │
              └────────────┘          └───────────────┘
                                             │
                                      (via HTTP Proxy
                                       if needed)
```

---

## Technology Stack

### Backend
- **Framework**: FastAPI 0.104+
- **Language**: Python 3.11+
- **Database ORM**: SQLAlchemy 2.0
- **Migrations**: Alembic
- **Validation**: Pydantic v2
- **Auth**: python-jose (JWT), passlib (bcrypt)
- **HTTP Client**: httpx (for Marzban API)
- **Job Scheduler**: APScheduler
- **Excel**: openpyxl

**Why FastAPI?**
- ✅ Fast (async/await support)
- ✅ Auto API documentation (OpenAPI)
- ✅ Type safety (Pydantic)
- ✅ Easy to learn
- ✅ Great for microservices

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Routing**: React Router v6
- **State**: TanStack Query (React Query)
- **Styling**: Tailwind CSS 3
- **Components**: Headless UI
- **Forms**: React Hook Form
- **HTTP**: Axios
- **Icons**: Heroicons

**Why React + Vite?**
- ✅ Fast development (HMR)
- ✅ Component-based
- ✅ Large ecosystem
- ✅ Easy deployment

### Database
- **RDBMS**: PostgreSQL 15
- **Why Postgres?**
  - ✅ ACID compliant
  - ✅ JSON support (for payment configs)
  - ✅ Full-text search
  - ✅ Excellent performance
  - ✅ Free and open-source

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: Nginx
- **SSL**: Let's Encrypt (Certbot)
- **OS**: Ubuntu 22.04 / 24.04
- **Process Manager**: Systemd

---

## System Components

### 1. Frontend (React SPA)

**Responsibilities**:
- User interface for all roles
- Client-side routing
- Form validation
- API communication
- State management
- File uploads (receipts)

**Routes**:
```
/                    → Landing/Login
/login              → Login page
/register           → End-user registration
/admin/*            → Admin dashboard
  /agents           → Agent management
  /plans            → Plan management
  /payments         → Payment approval
  /payment-methods  → Payment method config
  /orders           → All orders
  /reports          → Excel export
/agent/*            → Agent dashboard
  /wallet           → Credit & payments
  /create-user      → Create new user
  /users            → My users
/user/*             → End-user dashboard
  /buy              → Purchase account
  /accounts         → My accounts
  /payments         → Payment history
```

**State Management**:
- **Auth**: Context API (user, role, token)
- **Data**: TanStack Query (caching, refetching)
- **Forms**: React Hook Form (validation)

---

### 2. Backend (FastAPI)

**Responsibilities**:
- API endpoints
- Business logic
- Database operations
- Marzban integration
- File storage (receipts)
- Authentication & authorization
- Background jobs (24h rules)
- Excel generation

**Project Structure**:
```
backend/
├── app/
│   ├── main.py              ← FastAPI app
│   ├── config.py            ← Settings (env vars)
│   ├── database.py          ← DB connection
│   ├── models/              ← SQLAlchemy models
│   │   ├── user.py
│   │   ├── agent.py
│   │   ├── plan.py
│   │   ├── payment.py
│   │   ├── order.py
│   │   └── transaction.py
│   ├── schemas/             ← Pydantic schemas
│   │   ├── auth.py
│   │   ├── agent.py
│   │   ├── plan.py
│   │   └── ...
│   ├── api/                 ← Route handlers
│   │   ├── auth.py
│   │   ├── agents.py
│   │   ├── plans.py
│   │   ├── payments.py
│   │   ├── orders.py
│   │   ├── marzban.py
│   │   └── reports.py
│   ├── services/            ← Business logic
│   │   ├── credit.py        ← Credit calculations
│   │   ├── refund.py        ← Refund logic
│   │   ├── marzban.py       ← Marzban client
│   │   └── excel.py         ← Excel generation
│   ├── utils/               ← Helpers
│   │   ├── security.py      ← JWT, bcrypt
│   │   ├── deps.py          ← FastAPI dependencies
│   │   └── validators.py    ← Custom validators
│   └── jobs/                ← Background jobs
│       └── negative_credit.py
├── alembic/                 ← Migrations
├── uploads/                 ← Receipt images
├── requirements.txt
└── .env.example
```

**API Versioning**:
- Current: `/api/v1/*`
- Future: `/api/v2/*` (for breaking changes)

---

### 3. Database (PostgreSQL)

**Schema Overview**:

```sql
-- Core users table
users
  id (PK)
  username (unique)
  email (unique, nullable)
  password_hash
  role (ADMIN | AGENT | END_USER)
  status (ACTIVE | DISABLED)
  created_at
  updated_at

-- Agent profiles
agents
  id (PK)
  user_id (FK → users.id)
  first_name
  last_name
  phone
  shop_name
  address (JSON: province, city, details)
  credit_confirmed (numeric)
  credit_pending (numeric)
  negative_credit_since (timestamp, nullable)
  status (ACTIVE | DISABLED)
  created_at

-- End-user profiles
end_users
  id (PK)
  user_id (FK → users.id)
  phone
  verified (boolean)
  status (ACTIVE | DISABLED)
  created_at

-- VPN plans
plans
  id (PK)
  name
  days (integer)
  data_limit_gb (integer)
  price_public (numeric)
  price_agent (numeric)
  status (ACTIVE | INACTIVE)
  created_at
  updated_at

-- Payment methods (flexible JSON config)
payment_methods
  id (PK)
  type (CARD | SHEBA | CRYPTO)
  alias (e.g., "کارت ملی")
  config (JSON: card_number, wallet_address, etc.)
  status (ACTIVE | INACTIVE)
  daily_limit_count (integer, nullable)
  daily_limit_amount (numeric, nullable)
  notes
  created_at

-- Payment submissions
payments
  id (PK)
  user_id (FK → users.id)
  amount (numeric)
  payment_method_id (FK → payment_methods.id)
  receipt_url (string: path to uploaded file)
  status (PENDING | APPROVED | REJECTED)
  admin_notes (text, nullable)
  processed_at (timestamp, nullable)
  processed_by (FK → users.id, nullable)
  created_at

-- Orders (VPN purchases)
orders
  id (PK)
  user_id (FK → users.id) ← Agent or End-user
  plan_id (FK → plans.id)
  amount (numeric) ← Price at time of order
  marzban_username (string)
  status (ACTIVE | DISABLED | DELETED)
  created_at
  deleted_at (timestamp, nullable)

-- Marzban users (linked to orders)
marzban_users
  id (PK)
  order_id (FK → orders.id)
  username (string) ← Marzban username
  subscription_url (text)
  expire_date (timestamp)
  data_limit_gb (integer)
  data_used_gb (integer) ← Updated from Marzban
  status (ACTIVE | DISABLED | EXPIRED)
  created_at
  last_synced_at

-- Transaction ledger (immutable audit log)
transactions
  id (PK)
  user_id (FK → users.id)
  type (CHARGE_PENDING | CHARGE_APPROVED | CHARGE_REJECTED | 
        CHARGE_MANUAL | ORDER_CREATED | ORDER_REFUND)
  amount (numeric) ← Positive or negative
  balance_before (numeric)
  balance_after (numeric)
  reference_type (PAYMENT | ORDER | MANUAL)
  reference_id (integer) ← ID of payment/order
  notes (text)
  created_at
  created_by (FK → users.id, nullable) ← Admin for manual
```

**Indexes**:
```sql
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_agents_user_id ON agents(user_id);
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_marzban_users_username ON marzban_users(username);
```

---

### 4. Marzban Integration

**Connection**:
```python
# Environment variables
MARZBAN_URL = "https://marzban-panel.com"
MARZBAN_USERNAME = "admin"
MARZBAN_PASSWORD = "secure_password"

# Optional proxy (if panel in Iran, Marzban abroad)
HTTP_PROXY = "http://proxy-server:port"
HTTPS_PROXY = "http://proxy-server:port"
```

**Client Architecture**:
```python
class MarzbanClient:
    def __init__(self):
        self.base_url = settings.MARZBAN_URL
        self.username = settings.MARZBAN_USERNAME
        self.password = settings.MARZBAN_PASSWORD
        self.token = None
        self.token_expires = None
        
        # HTTP client with proxy support
        self.client = httpx.AsyncClient(
            proxies=settings.HTTP_PROXY if settings.HTTP_PROXY else None,
            timeout=30.0
        )
    
    async def authenticate(self):
        """Get/refresh auth token"""
        if self.token and self.token_expires > datetime.now():
            return self.token
        
        response = await self.client.post(
            f"{self.base_url}/api/admin/token",
            data={"username": self.username, "password": self.password}
        )
        data = response.json()
        self.token = data["access_token"]
        self.token_expires = datetime.now() + timedelta(hours=1)
        return self.token
    
    async def create_user(self, username, days, data_limit_gb, note):
        """Create user in Marzban"""
        token = await self.authenticate()
        
        payload = {
            "username": username,
            "expire": int((datetime.now() + timedelta(days=days)).timestamp()),
            "data_limit": data_limit_gb * 1024 * 1024 * 1024,  # Convert to bytes
            "note": note,
            "proxies": {},  # Use all active inbounds
            "inbounds": {},  # Default inbounds
            "status": "active"
        }
        
        response = await self.client.post(
            f"{self.base_url}/api/user",
            headers={"Authorization": f"Bearer {token}"},
            json=payload
        )
        
        if response.status_code == 200:
            user_data = response.json()
            return {
                "username": user_data["username"],
                "subscription_url": user_data["subscription_url"],
                "expire": user_data["expire"],
                "data_limit": user_data["data_limit"]
            }
        else:
            raise Exception(f"Marzban API error: {response.text}")
    
    async def check_username(self, username):
        """Check if username exists"""
        token = await self.authenticate()
        response = await self.client.get(
            f"{self.base_url}/api/user/{username}",
            headers={"Authorization": f"Bearer {token}"}
        )
        return response.status_code == 200
    
    async def delete_user(self, username):
        """Delete user from Marzban"""
        token = await self.authenticate()
        response = await self.client.delete(
            f"{self.base_url}/api/user/{username}",
            headers={"Authorization": f"Bearer {token}"}
        )
        return response.status_code == 200
```

**Error Handling**:
- Connection timeout → Retry 3x with exponential backoff
- Auth failure → Alert admin, log error
- User exists → Return friendly error to user
- Proxy failure → Log and notify admin

---

### 5. Background Jobs

**Job Scheduler**: APScheduler (in-process)

**Jobs**:

#### Job 1: Negative Credit Enforcement
```python
from apscheduler.schedulers.asyncio import AsyncIOScheduler

scheduler = AsyncIOScheduler()

@scheduler.scheduled_job('interval', hours=1)
async def check_negative_credit():
    """
    Check agents with negative credit:
    - If < 24h: block user creation (already handled by API)
    - If >= 24h: disable all their users
    """
    db = SessionLocal()
    
    # Find agents with negative credit for >24h
    agents = db.query(Agent).filter(
        Agent.credit_confirmed + Agent.credit_pending < 0,
        Agent.negative_credit_since < datetime.now() - timedelta(hours=24)
    ).all()
    
    for agent in agents:
        # Disable all active users
        orders = db.query(Order).filter(
            Order.user_id == agent.user_id,
            Order.status == "ACTIVE"
        ).all()
        
        for order in orders:
            # Disable in Marzban
            await marzban_client.disable_user(order.marzban_username)
            
            # Update status
            order.status = "DISABLED"
            
            # Log transaction (no refund, just disable)
            create_transaction(
                user_id=agent.user_id,
                type="ORDER_DISABLED",
                amount=0,
                notes=f"Auto-disabled due to negative credit >24h"
            )
        
        db.commit()
        
        # TODO: Send notification (email/telegram)
        print(f"Disabled {len(orders)} users for agent {agent.user_id}")
```

#### Job 2: Database Backup
```python
@scheduler.scheduled_job('cron', hour=3, minute=0)  # Daily at 3 AM
async def backup_database():
    """
    Create PostgreSQL backup
    """
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"rad_panel_backup_{timestamp}.sql"
    
    # pg_dump command
    os.system(f"pg_dump -U {DB_USER} {DB_NAME} > /backups/{filename}")
    
    # Compress
    os.system(f"gzip /backups/{filename}")
    
    # Delete old backups (keep last 30 days)
    os.system("find /backups -name '*.sql.gz' -mtime +30 -delete")
```

---

## Security Architecture

### Authentication Flow

```
User Login
    │
    ▼
[POST /api/auth/login]
    │
    ├─ Validate username/password (bcrypt)
    │
    ├─ Generate JWT token
    │     ├─ Payload: {user_id, username, role, exp}
    │     ├─ Sign with SECRET_KEY
    │     └─ Set expiry (7 days)
    │
    └─ Set httpOnly cookie
          └─ Secure, SameSite=Strict

Protected Endpoint
    │
    ▼
[Middleware: verify_token]
    │
    ├─ Extract token from cookie
    ├─ Verify signature
    ├─ Check expiry
    └─ Decode user_id, role

[Middleware: check_role]
    │
    └─ Verify user has required role (ADMIN, AGENT, END_USER)
```

### Password Security
```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Hash password
hashed = pwd_context.hash("plain_password")  # bcrypt with cost=12

# Verify
is_valid = pwd_context.verify("plain_password", hashed)
```

### Authorization Levels

| Endpoint | Admin | Agent | End-User |
|----------|-------|-------|----------|
| Create Agent | ✅ | ❌ | ❌ |
| View Own Wallet | ✅ | ✅ | ✅ |
| Create Order | ✅ | ✅ | ✅ |
| Approve Payment | ✅ | ❌ | ❌ |
| View All Orders | ✅ | ❌ | ❌ |
| Export Reports | ✅ | ❌ | ❌ |

---

## Scalability Plan

### Current (MVP):
- **Users**: 100 concurrent
- **Database**: Single PostgreSQL instance
- **Backend**: Single FastAPI instance
- **Frontend**: Static files via Nginx

### Future Scaling Triggers:

#### Tier 1: 100-1000 users
**Trigger**: Response time >500ms OR CPU >70%

**Actions**:
- Database read replica
- Redis caching (session, frequently accessed data)
- CDN for static assets

**Cost**: ~$50-100/month

---

#### Tier 2: 1000-10000 users
**Trigger**: Database queries >1000/sec

**Actions**:
- Database sharding (by user_id)
- Load balancer (multiple backend instances)
- Background job queue (Celery + Redis)
- Separate file storage (S3/MinIO)

**Cost**: ~$200-500/month

---

#### Tier 3: 10000+ users
**Trigger**: Multi-region needed

**Actions**:
- Kubernetes cluster
- Multi-region deployment
- Advanced monitoring (Datadog/New Relic)
- Dedicated DBA

**Cost**: $1K-5K/month  
**Team**: DevOps engineer required

---

## Deployment Architecture

### Production Setup

```
┌─────────────────────────────────────────┐
│         Ubuntu 22.04 Server             │
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  Docker Compose                   │ │
│  │                                   │ │
│  │  ┌─────────┐  ┌─────────────┐   │ │
│  │  │ Nginx   │  │ PostgreSQL  │   │ │
│  │  │ (443)   │  │   (5432)    │   │ │
│  │  └────┬────┘  └──────────┬──┘   │ │
│  │       │                   │      │ │
│  │  ┌────▼────┐    ┌────────▼───┐  │ │
│  │  │ Frontend│    │  Backend   │  │ │
│  │  │  (3000) │    │   (8000)   │  │ │
│  │  └─────────┘    └────────────┘  │ │
│  └───────────────────────────────────┘ │
│                                         │
│  /var/rad-panel/                       │
│    ├── docker-compose.yml              │
│    ├── .env                            │
│    ├── nginx/                          │
│    ├── uploads/                        │
│    └── backups/                        │
└─────────────────────────────────────────┘
```

### SSL/HTTPS
- **Certificate**: Let's Encrypt
- **Auto-renewal**: Certbot cron job
- **Redirect**: HTTP → HTTPS (301)

### Backup Strategy
- **Frequency**: Daily (3 AM)
- **Retention**: 30 days
- **Method**: pg_dump + gzip
- **Storage**: Local + (future: off-site)

---

## Monitoring & Logging

### Application Logs
```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/var/log/rad-panel/app.log'),
        logging.StreamHandler()
    ]
)

# Log important events
logger.info(f"User {user_id} created order {order_id}")
logger.warning(f"Failed Marzban connection: {error}")
logger.error(f"Critical: Payment approval failed for {payment_id}")
```

### Database Logs
- Slow queries (>1s) logged
- Connection pool usage monitored

### System Monitoring
```bash
# Systemd service health check
systemctl status rad-panel

# Resource usage
htop
df -h  # Disk
```

### Alerts (Future)
- Email on critical errors
- Telegram notifications for:
  - Failed Marzban connections
  - Negative credit threshold
  - High error rate

---

## API Documentation

**Auto-generated**: FastAPI provides interactive docs

**Endpoints**:
- `/docs` - Swagger UI (interactive)
- `/redoc` - ReDoc (pretty)
- `/openapi.json` - OpenAPI schema

**Access**:
- Development: Public
- Production: Admin-only (via auth)

---

## Conclusion

This architecture is designed for:
- ✅ **Simplicity** (easy to understand & maintain)
- ✅ **Scalability** (clear upgrade path)
- ✅ **Security** (auth, encryption, audit logs)
- ✅ **Reliability** (backups, error handling)
- ✅ **Developer Experience** (fast development, good docs)

**Next Steps**: See TASKS.md for implementation plan.
