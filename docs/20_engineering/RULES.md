# Coding Standards - RAD Panel

**Purpose**: Maintain code quality, consistency, and readability  
**Enforcement**: Code review + linting tools  
**Last Updated**: 2025-01-01

---

## General Principles

### 1. Readability First
- Code is read 10x more than written
- Choose clarity over cleverness
- Use descriptive names
- Comment complex logic

### 2. Consistency
- Follow existing patterns
- Use project conventions
- Automate formatting

### 3. Simplicity
- KISS (Keep It Simple, Stupid)
- YAGNI (You Aren't Gonna Need It)
- DRY (Don't Repeat Yourself)

---

## Python Backend Standards

### Code Style

**Formatter**: Black (line length: 88)
**Linter**: Pylint + Flake8
**Type Checker**: mypy

```python
# ✅ GOOD
def calculate_refund(
    order: Order,
    deleted_at: datetime
) -> Decimal:
    """
    Calculate refund amount for deleted order.
    
    Args:
        order: The order being deleted
        deleted_at: When the order was deleted
        
    Returns:
        Refund amount in IRR
    """
    if (deleted_at - order.created_at).days > 1:
        return Decimal("0")
    
    days_remaining = (order.expire_date - deleted_at).days
    refund_pct = days_remaining / order.plan.days
    return order.amount * Decimal(str(refund_pct))


# ❌ BAD
def calc_ref(o, d):
    if (d - o.created_at).days > 1: return 0
    dr = (o.expire_date - d).days
    rp = dr / o.plan.days
    return o.amount * rp  # No Decimal conversion
```

### Naming Conventions

```python
# Classes: PascalCase
class AgentService:
    pass

# Functions/methods: snake_case
def create_agent(username: str) -> Agent:
    pass

# Constants: UPPER_SNAKE_CASE
MAX_UPLOAD_SIZE_MB = 10

# Private: prefix with _
def _internal_helper():
    pass

# Database models: PascalCase
class User(Base):
    __tablename__ = "users"
```

### Type Hints (Required)

```python
# ✅ GOOD - All parameters and return types annotated
def approve_payment(
    payment_id: int,
    admin_id: int,
    notes: Optional[str] = None
) -> Payment:
    pass

# ❌ BAD - No type hints
def approve_payment(payment_id, admin_id, notes=None):
    pass
```

### Docstrings (Required for Public Functions)

```python
def create_order(
    user_id: int,
    plan_id: int,
    username: str
) -> Order:
    """
    Create new VPN order and Marzban user.
    
    Args:
        user_id: ID of user creating order (agent or end-user)
        plan_id: ID of plan to purchase
        username: Unique username for Marzban
        
    Returns:
        Created order object
        
    Raises:
        InsufficientCreditError: If user lacks credit
        UsernameExistsError: If username already taken
        MarzbanConnectionError: If Marzban API fails
    """
    pass
```

### Error Handling

```python
# ✅ GOOD - Specific exceptions
try:
    user = await marzban.create_user(username)
except httpx.TimeoutError:
    raise MarzbanConnectionError("Marzban timeout")
except httpx.HTTPError as e:
    if e.response.status_code == 409:
        raise UsernameExistsError(f"Username {username} exists")
    raise

# ❌ BAD - Catch all
try:
    user = await marzban.create_user(username)
except Exception as e:
    print(e)  # Don't use print, use logger
    raise  # Re-raise without context
```

### Async/Await

```python
# ✅ GOOD - Proper async
async def get_agent(agent_id: int) -> Agent:
    return await db.get(Agent, agent_id)

# Use async for:
# - Database operations
# - External API calls (Marzban)
# - File I/O

# Don't use async for:
# - Pure computation
# - Simple data transformation
```

### Database Queries

```python
# ✅ GOOD - Use ORM, avoid N+1
agents = (
    await db.execute(
        select(Agent)
        .options(joinedload(Agent.user))  # Eager load
        .where(Agent.status == "ACTIVE")
    )
).scalars().all()

# ❌ BAD - Raw SQL string (use only when necessary)
agents = await db.execute("SELECT * FROM agents WHERE status = 'ACTIVE'")

# ❌ BAD - N+1 query
agents = await db.execute(select(Agent)).scalars().all()
for agent in agents:
    user = await db.get(User, agent.user_id)  # Separate query each time!
```

### Configuration

```python
# ✅ GOOD - Use Pydantic settings
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    jwt_secret: str
    marzban_url: str
    
    class Config:
        env_file = ".env"

settings = Settings()

# ❌ BAD - os.getenv everywhere
import os
db_url = os.getenv("DATABASE_URL")  # No validation, no defaults
```

---

## JavaScript/React Frontend Standards

### Code Style

**Formatter**: Prettier
**Linter**: ESLint (with React plugin)
**Config**: Airbnb style guide (modified)

```jsx
// ✅ GOOD
function WalletCard({ agent }) {
  const [showDetails, setShowDetails] = useState(false);
  
  return (
    <div className="rounded-lg border p-4">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="text-lg font-bold"
      >
        اعتبار کل: {agent.total_credit.toLocaleString('fa-IR')} تومان
      </button>
      
      {showDetails && (
        <div className="mt-2 text-sm">
          <p>تایید شده: {agent.credit_confirmed.toLocaleString('fa-IR')}</p>
          <p>امانی: {agent.credit_pending.toLocaleString('fa-IR')}</p>
        </div>
      )}
    </div>
  );
}

// ❌ BAD
function walletcard(props) {  // Wrong case
  const [show, setShow] = useState(false)  // Missing semicolon
  return <div onClick={() => setShow(!show)}>  // Inline too complex
    اعتبار: {props.agent.total_credit}  // No formatting
  </div>
}
```

### Component Structure

```jsx
// ✅ GOOD - Organized
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import PropTypes from 'prop-types';

function AgentList({ filter }) {
  // 1. Hooks
  const [selectedId, setSelectedId] = useState(null);
  
  // 2. Queries
  const { data: agents, isLoading } = useQuery({
    queryKey: ['agents', filter],
    queryFn: () => fetchAgents(filter),
  });
  
  // 3. Effects
  useEffect(() => {
    // Side effects
  }, []);
  
  // 4. Event handlers
  const handleSelect = (id) => {
    setSelectedId(id);
  };
  
  // 5. Render logic
  if (isLoading) return <Spinner />;
  
  return (
    <div>
      {agents.map(agent => (
        <AgentCard
          key={agent.id}
          agent={agent}
          isSelected={agent.id === selectedId}
          onSelect={handleSelect}
        />
      ))}
    </div>
  );
}

// PropTypes (or TypeScript)
AgentList.propTypes = {
  filter: PropTypes.string,
};

export default AgentList;
```

### Naming Conventions

```jsx
// Components: PascalCase
function UserDashboard() {}

// Functions: camelCase
function handleSubmit() {}

// Constants: UPPER_SNAKE_CASE
const API_BASE_URL = 'https://panel.example.com/api';

// CSS classes: kebab-case (via Tailwind)
className="flex items-center justify-between"
```

### State Management

```jsx
// ✅ GOOD - TanStack Query for server state
const { data, isLoading, error } = useQuery({
  queryKey: ['orders'],
  queryFn: fetchOrders,
});

// ✅ GOOD - useState for UI state
const [isModalOpen, setIsModalOpen] = useState(false);

// ❌ BAD - useState for server data
const [orders, setOrders] = useState([]);
useEffect(() => {
  fetch('/api/orders')
    .then(r => r.json())
    .then(setOrders);  // No caching, no refetch, no error handling
}, []);
```

### API Calls

```jsx
// ✅ GOOD - Centralized API client
// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,  // For JWT cookies
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const agentService = {
  getAll: () => api.get('/agents').then(r => r.data),
  create: (data) => api.post('/agents', data).then(r => r.data),
};

// ❌ BAD - Fetch everywhere
function Component() {
  useEffect(() => {
    fetch('https://hardcoded-url.com/api/agents')  // Bad
      .then(r => r.json())
      .then(data => setAgents(data));
  }, []);
}
```

---

## SQL/Database Standards

### Table Names
- Lowercase, plural: `users`, `agents`, `plans`
- Use snake_case: `payment_methods`, `marzban_users`

### Column Names
- Lowercase, snake_case: `created_at`, `credit_confirmed`
- Boolean prefix: `is_active`, `has_verified`

### Indexes
```sql
-- ✅ GOOD - Descriptive names
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_payments_user_status ON payments(user_id, status);

-- ❌ BAD - Generic names
CREATE INDEX idx1 ON users(username);
```

### Migrations
```python
# ✅ GOOD - Descriptive revision message
# alembic/versions/001_create_users_table.py

def upgrade():
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('username', sa.String(50), unique=True, nullable=False),
    )

def downgrade():
    op.drop_table('users')  # Always provide downgrade

# ❌ BAD - No downgrade, vague message
# 001_update.py
def upgrade():
    op.add_column('users', sa.Column('new_col', sa.String()))
```

---

## Git Standards

### Commit Messages

```bash
# ✅ GOOD - Clear, imperative
git commit -m "Add payment approval endpoint"
git commit -m "Fix negative credit calculation bug"
git commit -m "Update deployment guide with SSL steps"

# ❌ BAD - Vague, past tense
git commit -m "changes"
git commit -m "fixed stuff"
git commit -m "Updated files"
```

### Branch Naming

```bash
# ✅ GOOD
feature/payment-approval
fix/credit-calculation-bug
docs/update-deployment-guide

# ❌ BAD
my-branch
test
asdf
```

### Pull Requests
- Title: Clear summary
- Description: What, why, how
- Link to issue/task
- Screenshots for UI changes

---

## Testing Standards

### Unit Tests

```python
# ✅ GOOD - Descriptive test names
def test_calculate_refund_within_24h_returns_full_amount():
    order = Order(
        amount=Decimal("100000"),
        created_at=datetime.now() - timedelta(hours=12),
        expire_date=datetime.now() + timedelta(days=30),
    )
    refund = calculate_refund(order, datetime.now())
    assert refund == Decimal("100000")

def test_calculate_refund_after_24h_returns_zero():
    order = Order(
        amount=Decimal("100000"),
        created_at=datetime.now() - timedelta(hours=25),
    )
    refund = calculate_refund(order, datetime.now())
    assert refund == Decimal("0")

# ❌ BAD - Unclear test name
def test_refund():
    # What is being tested?
    assert True
```

### Test Coverage
- Minimum: 70% for MVP
- Critical paths: 100% (payment, credit, refund)
- Use `pytest-cov` to track

---

## Security Standards

### Never Commit
- `.env` files
- API keys
- Passwords
- JWT secrets
- Database credentials

### Always Use
- `.env.example` with dummy values
- Environment variables
- Secrets management
- `.gitignore`

### Input Validation
```python
# ✅ GOOD - Validate all inputs
from pydantic import BaseModel, validator

class CreateAgentRequest(BaseModel):
    username: str
    password: str
    
    @validator('username')
    def username_alphanumeric(cls, v):
        if not v.isalnum() and '_' not in v:
            raise ValueError('Username must be alphanumeric')
        return v

# ❌ BAD - Trust user input
def create_agent(username, password):
    # Direct SQL injection risk
    db.execute(f"INSERT INTO users VALUES ('{username}', '{password}')")
```

---

## Performance Standards

### Database
- Always use indexes on foreign keys
- Use `select_related`/`joinedload` to avoid N+1
- Paginate large result sets
- Use `EXPLAIN` to analyze slow queries

### API
- Response time <500ms (p95)
- Use caching where appropriate
- Compress responses (gzip)
- Rate limit to prevent abuse

### Frontend
- Code splitting (lazy load routes)
- Image optimization
- Minimize bundle size
- Use React.memo for expensive renders

---

## Documentation Standards

### Code Comments

```python
# ✅ GOOD - Explain WHY, not WHAT
# We use bcrypt cost 12 instead of default 10 for extra security
# since this handles financial data
password_hash = bcrypt.hash(password, rounds=12)

# ❌ BAD - State the obvious
# Hash the password
password_hash = bcrypt.hash(password)
```

### README Files
- Purpose of module/directory
- How to run/test
- Dependencies
- Examples

---

## Review Checklist

Before committing code, check:

- [ ] Code passes linting (no warnings)
- [ ] Type hints added (Python)
- [ ] Tests written and passing
- [ ] Documentation updated if needed
- [ ] No console.log or print statements
- [ ] No commented-out code
- [ ] Secrets not committed
- [ ] Follows naming conventions
- [ ] Error handling added
- [ ] Persian text properly encoded (UTF-8)

---

**Enforcement**: PR reviews + automated CI checks  
**Exceptions**: Discuss with team first  
**Updates**: Review quarterly
