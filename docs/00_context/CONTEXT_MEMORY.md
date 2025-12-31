# Persistent Memory - RAD Panel

**Purpose**: Long-term context and knowledge base for the project  
**Last Updated**: 2025-01-01

---

## Project Identity

**Name**: RAD Panel  
**Full Name**: RAD Panel - VPN Sales & Agency Management System  
**Version**: 1.0.0 MVP  
**Domain**: VPN sales, agency management, financial tracking  
**Primary Language**: Persian (فارسی)  
**Secondary Language**: English (technical docs)

---

## Core Business Model

### Revenue Model
- **Source**: VPN service sales
- **Distribution**: Through agents (resellers)
- **Value Prop**: Automated sales + low-cost support

### Financial System
- **Credit-based**: Virtual currency (Iranian Rials)
- **Temporary credit**: Trust-first approach (امانی)
- **24-hour verification**: Admin approval window
- **Automatic enforcement**: Background jobs

---

## Key Stakeholders

### Primary User (Admin)
- **Name**: [User's business]
- **Need**: Reduce manual workload 80%
- **Pain Point**: Time-consuming manual order processing
- **Solution**: Automation + agent independence

### Secondary Users (Agents)
- **Profile**: VPN resellers across Iran
- **Need**: Fast order processing without delays
- **Pain Point**: Waiting for payment approval
- **Solution**: Temporary credit system

### Tertiary Users (End-users)
- **Profile**: VPN customers
- **Need**: Easy account purchase
- **Current**: Low volume (early stage)
- **Future**: Telegram bot (Phase 2)

---

## Critical Business Rules

### The "امانی" (Temporary Credit) System

**Philosophy**:
> "Admin's weakness is slow approval, not agent trustworthiness"

**Implementation**:
1. Receipt uploaded → Full credit added immediately
2. Agent can work without waiting
3. Admin verifies within 24 hours
4. System tracks everything for accountability

**Why This Matters**:
- Differentiates RAD Panel from competitors
- Enables fast operations
- Maintains admin control
- Builds trust with agents

---

### The 24-Hour Rules

**Rule 1**: Negative credit locks user creation
**Rule 2**: After 24h, all users disabled
**Rule 3**: Refunds only within 24h of creation

**Why 24 Hours**:
- Gives admin reasonable time to review
- Prevents immediate punishment
- Clear deadline for action
- Automated enforcement prevents disputes

---

## Technical Philosophy

### Simplicity Over Features
- MVP: Essential features only
- Phase 2: Advanced features
- Avoid premature optimization
- Clear upgrade path

### Trust Over Security Theater
- Temporary credit shows trust in agents
- Manual approval maintains control
- Balance between speed and safety

### Documentation Over Code
- Comprehensive docs enable any developer
- Clear requirements prevent rework
- Decisions documented with rationale

---

## Design Principles

### For Admin
- **Minimal clicks**: Bulk actions preferred
- **Clear overview**: Dashboard with key metrics
- **Quick approval**: One-click approve/reject
- **Excel reports**: Familiar format for analysis

### For Agents
- **Simple wallet**: Total shown, details on click
- **Fast order creation**: Minimal fields
- **Immediate feedback**: Subscription URL right away
- **Clear limits**: Credit displayed prominently

### For End-users
- **Minimal friction**: Simple registration
- **Clear instructions**: How to pay and get service
- **Fast delivery**: Subscription link after payment

---

## Technology Constraints

### Must Use
- **FastAPI**: Async, fast, auto-docs
- **PostgreSQL**: ACID, reliable, JSON support
- **React**: Component-based, popular
- **Docker**: Consistent deployment

### Must Avoid
- **Complex state management**: Redux not needed for MVP
- **Microservices**: Over-engineering for current scale
- **NoSQL**: We need ACID and relations
- **Heavy frameworks**: Django too much for MVP

---

## Domain Knowledge

### VPN Industry (Iran Context)

**Payment Methods**:
- Card-to-card most common (bank transfers)
- Cryptocurrency growing (10% bonus incentive)
- No PayPal/Stripe (sanctions)

**Distribution**:
- Agents/resellers are standard
- Telegram for customer support
- Manual processes still common

**Technical**:
- Marzban is de facto standard panel
- Proxy needed for Iran → abroad connections
- SSL/HTTPS critical for trust

---

## Marzban Integration Knowledge

### API Behavior
- Token-based authentication
- Tokens expire (need refresh logic)
- Username must be unique globally
- Note field limited to ~500 chars
- All inbounds used by default

### Known Limitations
- No batch operations
- No webhooks (must poll for updates)
- Delete is permanent (no soft delete)

### Best Practices
- Store metadata in note field
- Check username before creating
- Handle connection timeouts gracefully
- Use proxy for Iran → abroad

---

## User Preferences

### From User
- Prefers Persian for user-facing
- Wants minimal design (not flashy)
- Values speed over perfection
- Trusts agents (temporary credit)
- Needs Excel reports (familiar format)

---

## Common Pitfalls to Avoid

### Business Logic
- ❌ Auto-approving payments (fraud risk)
- ❌ Complex refund formulas (keep simple)
- ❌ Allowing spend beyond credit (strict limit)

### Technical
- ❌ Storing passwords in plain text
- ❌ Not using indexes (slow queries)
- ❌ Hardcoding Marzban URL (use env)
- ❌ No rate limiting (DDoS risk)

### UX
- ❌ Complex forms (keep minimal)
- ❌ Hiding credit details (be transparent)
- ❌ Generic error messages (be specific in Persian)

---

## Success Metrics (MVP)

### Business
- [ ] 80% reduction in admin time
- [ ] 50+ agents onboarded
- [ ] 0% financial discrepancy
- [ ] 99% uptime

### Technical
- [ ] <500ms API response (p95)
- [ ] <2s page load
- [ ] 100 concurrent users support
- [ ] 0 critical security issues

### User Satisfaction
- [ ] Agents can work independently
- [ ] 90% payments processed <24h
- [ ] No negative balance for 7+ days

---

## Phase 2 Vision

**From BrainStorm.txt**:
- Telegram bot for end-users
- OTP verification
- Sub-agents with commission
- White-label for agents
- Internal coin/token system
- Multi-panel support

**Not for MVP**: Keep focused on core value

---

## Glossary Quick Reference

| Persian | English | Meaning |
|---------|---------|---------|
| اعتبار امانی | Temporary Credit | Credit before approval |
| نماینده | Agent | VPN reseller |
| مدیر | Admin | System owner |
| لینک اشتراک | Subscription URL | VPN config link |
| پلن | Plan | Service package |

---

## Communication Patterns

### With User
- Use Persian for feature discussions
- Ask clarifying questions early
- Confirm assumptions explicitly
- Document all decisions

### With Developers
- Provide English technical docs
- Include code examples
- Link to official documentation
- Be specific about requirements

---

## Known Issues & Workarounds

*None yet - will be updated as discovered*

---

## Future Considerations

### Scalability
- Current: 100 concurrent users
- Next: 1000 users → Redis caching
- Future: 10K+ users → Kubernetes

### Features Requested but Deferred
- Admin impersonation (login as agent)
- Automatic payment verification
- Multi-language UI
- Mobile native apps

---

## Project History

### 2025-01-01: Project Started
- Initial requirements gathered
- Complete documentation created
- MVP scope defined
- Ready for development

---

## Important Contacts

### User
- **Role**: Business owner
- **Timezone**: Asia/Tehran (UTC+3:30)
- **Availability**: [To be added]

### Marzban Panel
- **Type**: API integration
- **Documentation**: https://github.com/Gozargah/Marzban
- **Version**: Latest stable

---

## Repository Information

**Primary**: [To be added when created]  
**Backup**: [To be added]  
**CI/CD**: [Future]

---

## License & Legal

**Software License**: MIT (open source)  
**Usage**: VPN sales panel  
**Compliance**: No PII collection in MVP  
**Data Storage**: Iran (user's server)

---

**Memory Status**: Active  
**Last Validated**: 2025-01-01  
**Next Review**: After MVP delivery
