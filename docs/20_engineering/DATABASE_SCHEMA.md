# Database Schema - RAD Panel

**Database**: PostgreSQL 15+  
**ORM**: SQLAlchemy 2.0  
**Migrations**: Alembic

---

## Complete SQL Schema

```sql
-- ============================================================================
-- USERS & AUTHENTICATION
-- ============================================================================

CREATE TYPE user_role AS ENUM ('ADMIN', 'AGENT', 'END_USER');
CREATE TYPE user_status AS ENUM ('ACTIVE', 'DISABLED');

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    status user_status DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ============================================================================
-- AGENT PROFILES
-- ============================================================================

CREATE TABLE agents (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    shop_name VARCHAR(200),
    province VARCHAR(100),
    city VARCHAR(100),
    address_details TEXT,
    notes TEXT,
    
    -- Financial
    credit_confirmed NUMERIC(15, 2) DEFAULT 0.00,
    credit_pending NUMERIC(15, 2) DEFAULT 0.00,
    negative_credit_since TIMESTAMP,
    
    -- Status
    status user_status DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_agents_user_id ON agents(user_id);
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_agents_credit ON agents(credit_confirmed, credit_pending);

-- Computed total credit view
CREATE VIEW agent_balances AS
SELECT 
    id,
    user_id,
    credit_confirmed,
    credit_pending,
    (credit_confirmed + credit_pending) AS total_credit,
    CASE 
        WHEN (credit_confirmed + credit_pending) < 0 THEN TRUE
        ELSE FALSE
    END AS is_negative
FROM agents;

-- ============================================================================
-- END USER PROFILES
-- ============================================================================

CREATE TABLE end_users (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    phone VARCHAR(20),
    verified BOOLEAN DEFAULT FALSE,
    credit_confirmed NUMERIC(15, 2) DEFAULT 0.00,
    credit_pending NUMERIC(15, 2) DEFAULT 0.00,
    status user_status DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_end_users_user_id ON end_users(user_id);
CREATE INDEX idx_end_users_phone ON end_users(phone);

-- ============================================================================
-- VPN PLANS
-- ============================================================================

CREATE TYPE plan_status AS ENUM ('ACTIVE', 'INACTIVE');

CREATE TABLE plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    days INTEGER NOT NULL,
    data_limit_gb INTEGER NOT NULL,
    price_public NUMERIC(12, 2) NOT NULL,
    price_agent NUMERIC(12, 2) NOT NULL,
    status plan_status DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_plans_status ON plans(status);

-- ============================================================================
-- PAYMENT METHODS
-- ============================================================================

CREATE TYPE payment_method_type AS ENUM ('CARD', 'SHEBA', 'CRYPTO');

CREATE TABLE payment_methods (
    id SERIAL PRIMARY KEY,
    type payment_method_type NOT NULL,
    alias VARCHAR(100) NOT NULL,  -- Display name
    config JSONB NOT NULL,  -- Flexible config storage
    status user_status DEFAULT 'ACTIVE',
    daily_limit_count INTEGER,
    daily_limit_amount NUMERIC(12, 2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payment_methods_type ON payment_methods(type);
CREATE INDEX idx_payment_methods_status ON payment_methods(status);

-- Example config structures:
-- CARD: {"card_number": "1234567812345678", "account_holder": "John Doe", "bank": "Melli"}
-- SHEBA: {"sheba_number": "IR123456789012345678901234", "account_holder": "John Doe"}
-- CRYPTO: {"coin": "USDT_TRC20", "wallet": "TXyz123...", "network": "TRC20", "bonus_pct": 10}

-- ============================================================================
-- PAYMENTS
-- ============================================================================

CREATE TYPE payment_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    payment_method_id INTEGER NOT NULL REFERENCES payment_methods(id),
    receipt_url VARCHAR(500),  -- Path to uploaded file
    status payment_status DEFAULT 'PENDING',
    
    -- Admin review
    admin_notes TEXT,
    processed_at TIMESTAMP,
    processed_by INTEGER REFERENCES users(id),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at);
CREATE INDEX idx_payments_method ON payments(payment_method_id);

-- ============================================================================
-- ORDERS
-- ============================================================================

CREATE TYPE order_status AS ENUM ('ACTIVE', 'DISABLED', 'DELETED');

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id INTEGER NOT NULL REFERENCES plans(id),
    
    -- Pricing snapshot
    amount NUMERIC(12, 2) NOT NULL,  -- Price at time of purchase
    
    -- Marzban info
    marzban_username VARCHAR(100) NOT NULL UNIQUE,
    alias VARCHAR(200),  -- User's display name
    
    -- Status
    status order_status DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    
    CONSTRAINT chk_deleted CHECK (
        (status = 'DELETED' AND deleted_at IS NOT NULL) OR
        (status != 'DELETED' AND deleted_at IS NULL)
    )
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_marzban_username ON orders(marzban_username);

-- ============================================================================
-- MARZBAN USERS (Synced data)
-- ============================================================================

CREATE TYPE marzban_user_status AS ENUM ('ACTIVE', 'DISABLED', 'EXPIRED', 'LIMITED');

CREATE TABLE marzban_users (
    id SERIAL PRIMARY KEY,
    order_id INTEGER UNIQUE NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    
    -- Marzban data
    username VARCHAR(100) NOT NULL UNIQUE,
    subscription_url TEXT,
    expire_date TIMESTAMP,
    data_limit_gb INTEGER,
    data_used_gb INTEGER DEFAULT 0,
    
    -- Sync tracking
    status marzban_user_status DEFAULT 'ACTIVE',
    last_synced_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_marzban_users_username ON marzban_users(username);
CREATE INDEX idx_marzban_users_status ON marzban_users(status);
CREATE INDEX idx_marzban_users_expire ON marzban_users(expire_date);

-- ============================================================================
-- TRANSACTION LEDGER (Immutable audit log)
-- ============================================================================

CREATE TYPE transaction_type AS ENUM (
    'CHARGE_PENDING',     -- Receipt uploaded
    'CHARGE_APPROVED',    -- Payment approved by admin
    'CHARGE_REJECTED',    -- Payment rejected by admin
    'CHARGE_MANUAL',      -- Manual credit adjustment
    'ORDER_CREATED',      -- User created, credit deducted
    'ORDER_REFUND',       -- User deleted, credit refunded
    'ORDER_DISABLED'      -- User disabled (no refund)
);

CREATE TYPE reference_type AS ENUM ('PAYMENT', 'ORDER', 'MANUAL');

CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    type transaction_type NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,  -- Can be positive or negative
    
    -- Balance snapshots
    balance_before NUMERIC(15, 2) NOT NULL,
    balance_after NUMERIC(15, 2) NOT NULL,
    
    -- Reference to source
    reference_type reference_type,
    reference_id INTEGER,  -- payment_id, order_id, etc.
    
    -- Notes
    notes TEXT,
    
    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id)  -- NULL for system, USER_ID for manual
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_transactions_reference ON transactions(reference_type, reference_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER agents_updated_at
    BEFORE UPDATE ON agents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER end_users_updated_at
    BEFORE UPDATE ON end_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER plans_updated_at
    BEFORE UPDATE ON plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER payment_methods_updated_at
    BEFORE UPDATE ON payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Track negative credit timestamp
CREATE OR REPLACE FUNCTION track_negative_credit()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.credit_confirmed + NEW.credit_pending) < 0 AND (OLD.credit_confirmed + OLD.credit_pending) >= 0 THEN
        -- Just went negative
        NEW.negative_credit_since = CURRENT_TIMESTAMP;
    ELSIF (NEW.credit_confirmed + NEW.credit_pending) >= 0 THEN
        -- Back to positive
        NEW.negative_credit_since = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agents_track_negative
    BEFORE UPDATE ON agents
    FOR EACH ROW
    EXECUTE FUNCTION track_negative_credit();

-- ============================================================================
-- SEED DATA (Initial setup)
-- ============================================================================

-- Create admin user (password: "admin123" hashed with bcrypt)
INSERT INTO users (username, email, password_hash, role, status)
VALUES (
    'admin',
    'admin@radpanel.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYY4sXDvQhDZIy2',  -- "admin123"
    'ADMIN',
    'ACTIVE'
);

-- Sample plans
INSERT INTO plans (name, days, data_limit_gb, price_public, price_agent, status)
VALUES
    ('پایه', 30, 30, 50000.00, 40000.00, 'ACTIVE'),
    ('استاندارد', 30, 50, 80000.00, 65000.00, 'ACTIVE'),
    ('پریمیوم', 30, 100, 140000.00, 110000.00, 'ACTIVE');

-- ============================================================================
-- USEFUL QUERIES
-- ============================================================================

-- Get agent total balance
SELECT 
    u.username,
    a.credit_confirmed,
    a.credit_pending,
    (a.credit_confirmed + a.credit_pending) AS total_credit
FROM agents a
JOIN users u ON a.user_id = u.id;

-- Find agents with negative credit for >24h
SELECT 
    u.username,
    a.credit_confirmed,
    a.credit_pending,
    (a.credit_confirmed + a.credit_pending) AS total_credit,
    a.negative_credit_since,
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - a.negative_credit_since))/3600 AS hours_negative
FROM agents a
JOIN users u ON a.user_id = u.id
WHERE (a.credit_confirmed + a.credit_pending) < 0
  AND a.negative_credit_since < (CURRENT_TIMESTAMP - INTERVAL '24 hours');

-- Pending payments
SELECT 
    p.id,
    u.username,
    p.amount,
    pm.alias AS payment_method,
    p.created_at
FROM payments p
JOIN users u ON p.user_id = u.id
JOIN payment_methods pm ON p.payment_method_id = pm.id
WHERE p.status = 'PENDING'
ORDER BY p.created_at ASC;

-- Agent's transaction history
SELECT 
    t.created_at,
    t.type,
    t.amount,
    t.balance_after,
    t.notes
FROM transactions t
WHERE t.user_id = $1  -- Agent's user_id
ORDER BY t.created_at DESC
LIMIT 50;

-- Active users per agent
SELECT 
    u.username AS agent,
    COUNT(o.id) AS active_users,
    SUM(p.price_agent) AS total_revenue
FROM orders o
JOIN users u ON o.user_id = u.id
JOIN plans p ON o.plan_id = p.id
WHERE o.status = 'ACTIVE'
GROUP BY u.username
ORDER BY active_users DESC;

-- ============================================================================
-- PERFORMANCE CONSIDERATIONS
-- ============================================================================

-- Vacuum and analyze regularly
VACUUM ANALYZE;

-- Monitor slow queries
SELECT
    query,
    calls,
    total_time,
    mean_time,
    max_time
FROM pg_stat_statements
WHERE mean_time > 100  -- Queries slower than 100ms
ORDER BY total_time DESC
LIMIT 20;

-- Check index usage
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexname NOT LIKE 'pg_toast%';

-- ============================================================================
-- BACKUP & RESTORE
-- ============================================================================

-- Backup
pg_dump -U postgres rad_panel > backup.sql

-- Backup with compression
pg_dump -U postgres rad_panel | gzip > backup.sql.gz

-- Restore
psql -U postgres rad_panel < backup.sql

-- Restore from compressed
gunzip -c backup.sql.gz | psql -U postgres rad_panel
```

---

## SQLAlchemy Models

See `/backend/app/models/` for Python implementations.

**Key Models**:
- `User` - Base user table
- `Agent` - Agent profile
- `EndUser` - End-user profile
- `Plan` - VPN plans
- `PaymentMethod` - Payment configurations
- `Payment` - Payment submissions
- `Order` - VPN purchases
- `MarzbanUser` - Marzban sync data
- `Transaction` - Ledger entries

---

## Alembic Migrations

### Initial Migration
```bash
# Create initial migration
alembic revision --autogenerate -m "Initial schema"

# Apply migration
alembic upgrade head
```

### Example Migration (Adding column)
```python
# alembic/versions/xxx_add_agent_notes.py
def upgrade():
    op.add_column('agents', sa.Column('internal_notes', sa.Text(), nullable=True))

def downgrade():
    op.drop_column('agents', 'internal_notes')
```

---

## Data Integrity Rules

### 1. Credit Consistency
- Total credit = `confirmed + pending`
- Cannot spend more than total credit
- Transactions immutable (audit trail)

### 2. Order-User Relationship
- Each order has exactly one Marzban user
- Cascade delete: User deleted → Orders deleted → Marzban users deleted

### 3. Payment Workflow
- Payment created → status = PENDING
- Admin approves → credit added, transaction logged
- Admin rejects → no credit, transaction logged

### 4. Refund Rules
- Only < 24h after creation
- Pro-rated based on usage
- Transaction logged

---

## Common Operations

### Create Agent
```python
# Create user
user = User(
    username="agent1",
    password_hash=hash_password("password"),
    role="AGENT"
)
db.add(user)
db.flush()

# Create agent profile
agent = Agent(
    user_id=user.id,
    first_name="John",
    last_name="Doe",
    credit_confirmed=0,
    credit_pending=0
)
db.add(agent)
db.commit()
```

### Process Payment
```python
# On upload
payment = Payment(
    user_id=agent.user_id,
    amount=1000000,
    payment_method_id=1,
    receipt_url="/uploads/receipt123.jpg",
    status="PENDING"
)
db.add(payment)

# Add pending credit
agent.credit_pending += payment.amount
db.commit()

# Log transaction
transaction = Transaction(
    user_id=agent.user_id,
    type="CHARGE_PENDING",
    amount=payment.amount,
    balance_before=old_balance,
    balance_after=new_balance,
    reference_type="PAYMENT",
    reference_id=payment.id
)
db.add(transaction)
db.commit()

# On approval
payment.status = "APPROVED"
agent.credit_pending -= payment.amount
agent.credit_confirmed += payment.amount

transaction = Transaction(
    user_id=agent.user_id,
    type="CHARGE_APPROVED",
    amount=payment.amount,
    balance_before=old_balance,
    balance_after=new_balance,
    reference_type="PAYMENT",
    reference_id=payment.id,
    created_by=admin_user.id
)
db.add(transaction)
db.commit()
```

### Create Order
```python
# Calculate price
price = plan.price_agent if user.role == "AGENT" else plan.price_public

# Check credit
total_credit = agent.credit_confirmed + agent.credit_pending
if total_credit < price:
    raise InsufficientCreditError()

# Create in Marzban
marzban_user = await marzban_client.create_user(
    username=username,
    days=plan.days,
    data_limit_gb=plan.data_limit_gb,
    note=f"RAD Panel - Agent: {agent.username}"
)

# Create order
order = Order(
    user_id=agent.user_id,
    plan_id=plan.id,
    amount=price,
    marzban_username=username,
    status="ACTIVE"
)
db.add(order)
db.flush()

# Deduct credit (from confirmed first, then pending)
if agent.credit_confirmed >= price:
    agent.credit_confirmed -= price
else:
    remaining = price - agent.credit_confirmed
    agent.credit_confirmed = 0
    agent.credit_pending -= remaining

# Log transaction
transaction = Transaction(
    user_id=agent.user_id,
    type="ORDER_CREATED",
    amount=-price,
    balance_before=old_balance,
    balance_after=new_balance,
    reference_type="ORDER",
    reference_id=order.id
)
db.add(transaction)

# Save Marzban data
marzban_user_record = MarzbanUser(
    order_id=order.id,
    username=marzban_user["username"],
    subscription_url=marzban_user["subscription_url"],
    expire_date=marzban_user["expire"],
    data_limit_gb=plan.data_limit_gb,
    status="ACTIVE"
)
db.add(marzban_user_record)
db.commit()
```

---

## Conclusion

This schema provides:
- ✅ Complete audit trail (transactions table)
- ✅ Flexible payment methods (JSONB config)
- ✅ Credit tracking (confirmed + pending)
- ✅ Automatic timestamps (triggers)
- ✅ Data integrity (foreign keys, constraints)
- ✅ Performance (indexes)
- ✅ Scalability (partitioning-ready)

Next: See ARCHITECTURE.md for system design and TASKS.md for implementation plan.
