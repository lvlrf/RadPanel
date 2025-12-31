# Product Requirements Document - RAD Panel (AI-Executable)

**Version**: 1.0.0 MVP  
**Date**: 2025-01-01  
**Status**: Approved for Development

---

## Executive Summary

**RAD Panel** is a VPN sales and agency management system built as a management layer on top of Marzban panel. It provides automated sales, financial management, and service delivery for VPN businesses.

### Core Problem
Manual management of agents is time-consuming and error-prone. Business owner needs automation for sales process, payment tracking, and service delivery.

### Solution
Web-based panel with three user roles (Admin, Agent, End-user) featuring:
- Temporary credit system ("امانی credit") for fast operations
- Automated Marzban integration
- Payment workflow with manual approval
- Complete financial tracking and Excel reports

---

## User Roles & Permissions

### Role: Admin (Super User)
**Primary User**: Business owner

**Capabilities**:
- Create/edit/disable agents
- Define VPN plans (CRUD)
- Manage payment methods (card/SHEBA/crypto)
- Approve/reject payments with notes
- Manual credit adjustment (increase/decrease)
- View all orders and transactions
- Export Excel reports
- Manage payment accounts with random rotation

**Access Level**: Full system access

---

### Role: Agent
**Primary Users**: Sales representatives

**Capabilities**:
- View wallet balance (confirmed + pending credits)
- Create orders (select plan)
- Upload payment receipt for wallet recharge
- View list of created users
- Delete/disable users (with credit refund rules)
- Receive subscription links
- See random rotated card numbers for payment

**Access Level**: Own data only

**Credit System**:
- Can spend up to: `confirmed_credit + pending_credit`
- Cannot exceed total available credit
- Negative credit locks user creation for 24h
- After 24h with negative credit: all users disabled

---

### Role: End-user
**Primary Users**: Final VPN customers

**Capabilities**:
- Public registration (/register)
- Purchase VPN accounts
- Upload payment receipt
- View purchased accounts
- Receive subscription links

**Credit System**:
- Same as Agent (temporary credit for unconfirmed payments)

**Access Level**: Own accounts only

---

## Credit & Payment Logic

### Temporary Credit System (اعتبار امانی)

**Philosophy**: Trust-first approach. Users receive full credit immediately upon upload, admin verifies within 24h.

**Flow**:
```
1. User uploads receipt → Payment status: "PENDING"
2. System adds full amount as "pending_credit"
3. User can spend: confirmed_credit + pending_credit
4. Admin reviews within 24h
5a. APPROVED → pending_credit becomes confirmed_credit
5b. REJECTED → credit becomes negative
```

**Rules**:
- User cannot spend more than total credit (confirmed + pending)
- Negative credit = cannot create users for 24h
- After 24h: all users disabled if still negative
- Next payment: clears negative first, then adds remainder

**Example**:
```
Agent uploads 1,000,000 receipt
→ pending_credit: +1,000,000
→ Can spend: 1,000,000

Agent spends 1,500,000 (has confirmed credit from before)
→ confirmed: 0, pending: 1,000,000, spent: 1,500,000
→ total: 500,000

Admin REJECTS payment
→ pending: 0, confirmed: 0
→ balance: -500,000 (NEGATIVE)
→ Cannot create users for 24h
→ After 24h: all users disabled
```

---

## Payment Methods

### 1. Card-to-Card (کارت به کارت)

**Fields**:
- `alias`: Display name (e.g., "کارت ملی")
- `card_number`: 16-digit card number
- `account_holder`: Name on card
- `bank_name`: Bank name
- `status`: ACTIVE | INACTIVE
- `daily_limit_count`: Max transactions per day (optional)
- `daily_limit_amount`: Max amount per day (optional)
- `notes`: Additional info

**Special Feature**: Random Rotation
- When user selects "card payment", system shows random active card
- Distributes load across multiple accounts
- Avoids hitting bank limits

### 2. SHEBA (شبا)
Same as card-to-card but with SHEBA number instead

### 3. Cryptocurrency

**Fields**:
- `alias`: Display name (e.g., "USDT TRC20")
- `coin_type`: USDT_TRC20 | BTC | ETH | etc.
- `wallet_address`: Crypto wallet address
- `network`: TRC20 | ERC20 | BEP20 | etc.
- `status`: ACTIVE | INACTIVE
- `bonus_percentage`: Extra credit % (default: 10%)
- `daily_limit_amount`: Optional
- `notes`: Instructions

**Bonus Example**:
User pays 1,000,000 via crypto → receives 1,100,000 credit (10% bonus)

**Verification**: Manual (admin checks transaction)

---

## VPN Plans

Admin can CRUD plans from dashboard.

**Plan Structure**:
```json
{
  "name": "Standard Plan",
  "days": 30,
  "data_limit_gb": 50,
  "price_public": 80000,     // For end-users
  "price_agent": 65000,      // For agents
  "status": "ACTIVE"
}
```

**Pricing Rules**:
- Plans always use CURRENT price (not historical)
- When price changes, pending orders use new price
- Credit deduction happens on order creation

**Example Plans**:
1. Basic: 30GB/30d - Public: 50K - Agent: 40K
2. Standard: 50GB/30d - Public: 80K - Agent: 65K
3. Premium: 100GB/30d - Public: 140K - Agent: 110K

---

## User Creation in Marzban

### Input Fields (by Agent/End-user):
- `alias`: Display name (optional)
- `username`: Unique (validated against Marzban)
- `days`: Duration
- `data_limit_gb`: Traffic limit
- `on_hold`: Boolean (Marzban setting)

### Auto-generated Note in Marzban:
```
RAD Panel User
Created by: [agent_username]
Created at: 2025-01-01 14:30:00
Plan: Standard Plan
Price: 65,000 IRR
Agent Note: [custom notes]
Last Modified: 2025-01-01 14:30:00
```

### Inbounds:
- All active inbounds (or panel default)

### Validation:
1. Check username uniqueness via Marzban API
2. Check agent has sufficient credit
3. Create user in Marzban
4. Deduct credit from agent
5. Create order record in RAD database

---

## 24-Hour Rules

### Rule 1: Negative Credit Lock
```
IF agent.balance < 0:
  - BLOCK user creation for 24 hours
  - SHOW warning: "اعتبار منفی - لطفاً شارژ کنید"
  
  IF still negative after 24h:
    - DISABLE all users created by this agent
    - SEND warning notification
```

### Rule 2: User Deletion Refund
```
IF user deleted AND (created_at + 24h) > now():
  // Within 24 hours
  days_remaining = user.expire_days - days_used
  data_remaining_gb = user.data_limit_gb - data_used_gb
  
  refund = calculate_refund(days_remaining, data_remaining_gb)
  agent.credit += refund
  
  LOG transaction: "Refund for early deletion"
```

### Rule 3: User Disable Refund
```
IF user disabled:
  // Not consuming resources
  refund = calculate_refund(days_remaining, data_remaining_gb)
  agent.credit += refund
  
  IF user re-enabled:
    agent.credit -= refund
```

---

## Marzban Integration

### Connection:
**Environment Variables**:
```
MARZBAN_URL=https://marzban-panel.com
MARZBAN_USERNAME=admin
MARZBAN_PASSWORD=secure_password

# Optional: Proxy support (if panel is in Iran, Marzban abroad)
HTTP_PROXY=http://proxy-server:port
HTTPS_PROXY=http://proxy-server:port
```

### API Endpoints Used:
```
POST /api/admin/token          → Get auth token
POST /api/user                  → Create user
GET  /api/user/{username}      → Get user info
PUT  /api/user/{username}      → Update user
DELETE /api/user/{username}    → Delete user
GET  /api/users                → List users
```

### Error Handling:
- Username already exists → Suggest alternative
- Connection timeout → Retry with exponential backoff
- Auth failure → Alert admin via dashboard
- Proxy connection → Log connection status

---

## Reports & Excel Export

### Excel Columns:
1. `date`: Transaction date (YYYY-MM-DD)
2. `time`: Transaction time (HH:MM:SS)
3. `agent_name`: Agent name
4. `transaction_type`: CHARGE | ORDER | REFUND
5. `amount`: Amount (IRR)
6. `status`: APPROVED | REJECTED | PENDING
7. `payment_method`: CARD | SHEBA | CRYPTO
8. `notes`: Admin/user notes

### Filters:
- Date range (from/to)
- Agent (multi-select)
- Status (multi-select)
- Transaction type (multi-select)

### Export Format:
- XLSX (Excel 2007+)
- UTF-8 encoding
- Persian text support
- Auto-width columns

---

## Security

### Authentication:
- **Method**: JWT (JSON Web Tokens)
- **Storage**: httpOnly cookies
- **Expiry**: 7 days (configurable)
- **Refresh**: Automatic on activity

### Password Security:
- **Hashing**: bcrypt (cost factor: 12)
- **Min length**: 8 characters
- **Must include**: Letters + numbers (recommended)

### Authorization:
- **Role-based access control (RBAC)**
- Middleware checks role on every request
- Agents can only access own data
- Admins can access all data

### Rate Limiting:
```
Login: 5 attempts / 15 minutes
API calls: 100 requests / minute / user
Upload: 10 files / hour
```

### Data Protection:
- All secrets in `.env` (not in code)
- HTTPS only (redirect HTTP → HTTPS)
- SQL injection prevention (parameterized queries)
- XSS protection (sanitize inputs)

---

## Deployment

### Infrastructure:
- **Server**: Ubuntu 22.04 / 24.04 (Iran)
- **Domain**: Custom domain with SSL
- **Container**: Docker + Docker Compose
- **Database**: PostgreSQL 15
- **Reverse Proxy**: Nginx
- **SSL**: Let's Encrypt (auto-renewal)

### Environment:
```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/radpanel

# Marzban
MARZBAN_URL=https://marzban.com
MARZBAN_USERNAME=admin
MARZBAN_PASSWORD=secret

# Proxy (optional)
HTTP_PROXY=http://proxy:8080

# Security
JWT_SECRET=random_64_char_string
BCRYPT_ROUNDS=12

# Panel
PANEL_NAME=RAD Panel
PANEL_DOMAIN=panel.example.com
```

### Backup:
- **Database**: Daily automatic backup
- **Files**: Uploaded receipts backed up
- **Retention**: 30 days

---

## Out of Scope (NOT in MVP)

### ○ Telegram Bot
- OTP for end-users
- Share contact verification
- Notifications
- Bot-based panel access
→ **Phase 2**

### ○ Sub-agents & Referral
- Multi-level commission
- Agent-to-agent hierarchy
→ **Phase 2**

### ○ White-label
- Custom domains per agent
- Custom branding
- Independent financial settings
→ **Phase 3**

### ○ Coin/Token System
- Internal currency
- Price change protection
→ **Phase 3**

### ○ Smart Account Rotation
- Daily usage limits per account
- Random amount suffix
→ **Phase 2**

### ○ Admin Impersonation
- Login as agent for debugging
→ **Phase 2**

### ○ Multi-panel Support
- Sanaei, Hiddify, OpenVPN, MikroTik
→ **Future**

---

## Technical Constraints

### Performance:
- Page load < 2 seconds
- API response < 500ms (95th percentile)
- Support 100 concurrent users

### Compatibility:
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive (iOS, Android)
- Desktop (Windows, macOS, Linux)

### Scalability:
- Database: Indexed for queries
- Caching: Redis (future)
- CDN: Static assets (future)

---

## Success Metrics (MVP)

### Functional:
- ✅ Agents can create users without admin intervention
- ✅ 90% of payments processed within 24h
- ✅ Zero unauthorized access incidents
- ✅ 99% uptime

### Business:
- ✅ Reduce admin time by 80%
- ✅ Enable 50+ agents to operate independently
- ✅ Accurate financial tracking (0% discrepancy)

---

## Glossary

- **امانی (Amani)**: Temporary/pending credit given before payment approval
- **Agent**: Sales representative who sells VPN services
- **Plan**: VPN service package (days + data + price)
- **Marzban**: VPN panel software (backend)
- **Subscription**: Auto-updating configuration link for VPN client
- **On Hold**: Marzban feature to pause user without deletion
- **Inbound**: VPN protocol endpoint in Marzban

---

**Version**: 1.0.0 MVP  
**Status**: ✅ Approved  
**Next Review**: After MVP delivery
