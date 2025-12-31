# Technical Decisions - RAD Panel

**Project**: RAD Panel VPN Sales Management  
**Last Updated**: 2025-01-01

---

## Decision Log

This document records all significant technical decisions made during the project.

---

## Decision 001: Tech Stack Selection

**Date**: 2025-01-01  
**Status**: ✅ Approved  
**Context**: Need to choose technology stack for MVP

**Decision**:
- **Backend**: FastAPI (Python)
- **Frontend**: React 18 + Vite
- **Database**: PostgreSQL 15
- **Deployment**: Docker Compose

**Rationale**:
- FastAPI: Fast, async, auto-documentation, type-safe
- React: Large ecosystem, component-based, easy to find developers
- PostgreSQL: ACID compliant, reliable, JSON support
- Docker: Easy deployment, reproducible environments

**Alternatives Considered**:
- Django (rejected: too heavy for MVP)
- Vue.js (rejected: smaller ecosystem in Iran)
- MySQL (rejected: PostgreSQL has better features)

**Consequences**:
- ✅ Fast development
- ✅ Easy to find developers
- ✅ Production-ready
- ⚠️ Learning curve for team

---

## Decision 002: Temporary Credit System

**Date**: 2025-01-01  
**Status**: ✅ Approved  
**Context**: Users should not wait for admin approval

**Decision**:
Implement "امانی credit" system where users get immediate temporary credit upon payment upload, admin verifies within 24h.

**Rationale**:
- Admin's weakness is slow approval, not agent trustworthiness
- Agents need to work without delays
- System tracks everything for accountability
- 24-hour rules prevent abuse

**Alternatives Considered**:
- Manual approval (rejected: too slow)
- Auto-approval (rejected: fraud risk)
- Partial temporary credit (rejected: too complex)

**Consequences**:
- ✅ Fast operations
- ✅ Happy agents
- ✅ Admin maintains control
- ⚠️ Risk of negative credit

---

## Decision 003: End-User Registration

**Date**: 2025-01-01  
**Status**: ✅ Approved  
**Context**: How should end-users register?

**Decision**:
Phase 1 (MVP): Simple username/password registration (no Telegram OTP)
Phase 2: Add Telegram bot with OTP verification

**Rationale**:
- MVP needs to launch quickly
- Agents can start working immediately
- End-user volume is low initially
- Telegram bot adds significant complexity

**Alternatives Considered**:
- Telegram bot from start (rejected: too complex for MVP)
- Phone OTP (rejected: SMS costs in Iran)
- Email verification (rejected: low email usage in Iran)

**Consequences**:
- ✅ Faster MVP delivery
- ✅ Simpler codebase
- ⚠️ Less security (acceptable for MVP)
- 🔜 Plan for Phase 2

---

## Decision 004: Payment Methods

**Date**: 2025-01-01  
**Status**: ✅ Approved  
**Context**: How to handle multiple payment methods?

**Decision**:
Store payment methods in JSONB config field for flexibility. Support:
- Card-to-card with random rotation
- SHEBA
- Crypto with 10% bonus

**Rationale**:
- JSONB allows flexible schema per payment type
- Random rotation prevents single card overload
- Crypto bonus incentivizes usage
- Easy to add new payment types

**Alternatives Considered**:
- Separate tables per type (rejected: too rigid)
- Fixed schema (rejected: not flexible enough)
- External payment gateway (rejected: not available in Iran)

**Consequences**:
- ✅ Flexible payment configuration
- ✅ Easy to add new types
- ⚠️ Validation complexity

---

## Decision 005: Database Schema - Credit Storage

**Date**: 2025-01-01  
**Status**: ✅ Approved  
**Context**: How to store confirmed vs pending credit?

**Decision**:
Store two separate fields:
- `credit_confirmed`: Approved credits
- `credit_pending`: Awaiting approval
- Total = confirmed + pending

**Rationale**:
- Clear separation of states
- Easy to query and display
- Simple calculation
- Audit trail via transactions table

**Alternatives Considered**:
- Single field with status table (rejected: complex queries)
- Multiple credit tables (rejected: over-engineering)

**Consequences**:
- ✅ Simple and clear
- ✅ Easy to understand
- ✅ Fast queries

---

## Decision 006: Refund Calculation

**Date**: 2025-01-01  
**Status**: ✅ Approved  
**Context**: How to calculate refunds for deleted users?

**Decision**:
Pro-rated refund based on:
- Remaining days (proportional)
- Unused data (proportional)
- Only if < 24 hours since creation

**Rationale**:
- Fair to agents
- Prevents abuse (24h limit)
- Encourages careful planning
- Simple calculation

**Alternatives Considered**:
- Full refund always (rejected: abuse risk)
- No refunds (rejected: unfair to agents)
- Complex formula (rejected: over-engineering)

**Consequences**:
- ✅ Fair system
- ✅ Prevents abuse
- ✅ Simple to implement

---

## Decision 007: Marzban Integration

**Date**: 2025-01-01  
**Status**: ✅ Approved  
**Context**: How to connect to Marzban panel?

**Decision**:
- Direct API calls via httpx
- HTTP proxy support via environment variables
- Store metadata in Marzban note field
- Use all active inbounds by default

**Rationale**:
- Simple integration
- Proxy allows panel in Iran, Marzban abroad
- Notes field keeps data together
- Default inbounds simplify setup

**Alternatives Considered**:
- Separate metadata database (rejected: data duplication)
- Fixed inbound list (rejected: not flexible)
- SSH tunnel (rejected: complex setup)

**Consequences**:
- ✅ Simple integration
- ✅ Proxy support
- ⚠️ Dependent on Marzban API stability

---

## Decision 008: 24-Hour Rules

**Date**: 2025-01-01  
**Status**: ✅ Approved  
**Context**: How to handle negative credit?

**Decision**:
- Negative credit → Block user creation for 24h
- After 24h → Disable all agent's users
- Background job checks every hour

**Rationale**:
- Gives agent time to fix
- Automatic enforcement
- Clear consequences
- Prevents ongoing abuse

**Alternatives Considered**:
- Immediate disable (rejected: too harsh)
- No automatic action (rejected: allows abuse)
- Email warnings (rejected: not implemented in MVP)

**Consequences**:
- ✅ Fair warning period
- ✅ Automatic enforcement
- ⚠️ Requires background job

---

## Decision 009: Excel Export

**Date**: 2025-01-01  
**Status**: ✅ Approved  
**Context**: How to provide financial reports?

**Decision**:
Use openpyxl to generate Excel files with:
- Date/time columns
- Agent name
- Transaction type
- Amount, status, method
- Custom filters

**Rationale**:
- Excel is familiar to users
- Easy to analyze
- No need for complex reporting UI
- openpyxl is reliable

**Alternatives Considered**:
- CSV (rejected: less user-friendly)
- PDF (rejected: not analyzable)
- Web dashboard (deferred to Phase 2)

**Consequences**:
- ✅ Familiar format
- ✅ Easy analysis
- ⚠️ Server-side generation overhead

---

## Decision 010: Authentication

**Date**: 2025-01-01  
**Status**: ✅ Approved  
**Context**: How to handle authentication?

**Decision**:
- JWT tokens in httpOnly cookies
- 7-day expiry
- bcrypt password hashing (cost 12)
- Role-based access control

**Rationale**:
- JWT is stateless and scalable
- httpOnly prevents XSS
- bcrypt is industry standard
- RBAC is simple and effective

**Alternatives Considered**:
- Session-based (rejected: not scalable)
- OAuth (rejected: over-engineering for MVP)
- Plain cookies (rejected: not secure)

**Consequences**:
- ✅ Secure
- ✅ Scalable
- ✅ Industry standard

---

## Future Decisions (Deferred)

### Telegram Bot Integration
**Status**: 🔜 Phase 2  
**Context**: End-user authentication and notifications

### Multi-language Support
**Status**: 🔜 Phase 3  
**Context**: International expansion

### White-label System
**Status**: 🔜 Phase 3  
**Context**: Agent-specific branding

---

## Decision Template

```markdown
## Decision XXX: [Title]

**Date**: YYYY-MM-DD  
**Status**: ⏳ Pending | ✅ Approved | ❌ Rejected | 🔄 Changed  
**Context**: [Why is this decision needed?]

**Decision**: [What was decided?]

**Rationale**: [Why this decision?]

**Alternatives Considered**:
- Option A (rejected: reason)
- Option B (rejected: reason)

**Consequences**:
- ✅ Positive impact
- ⚠️ Risk or trade-off
```

---

**Total Decisions**: 10  
**Status**: All approved for MVP  
**Next Review**: After MVP delivery
