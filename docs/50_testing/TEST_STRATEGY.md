# Test Strategy - RAD Panel

## Testing Pyramid

```
       /\
      /  \     E2E (10%)
     /    \
    /------\   Integration (30%)
   /        \
  /----------\ Unit (60%)
```

## Unit Tests (60% of tests)

**Target**: Business logic, utilities, calculations

### Backend
- Credit calculations
- Refund calculations
- Payment approval logic
- 24-hour rules
- Marzban API client

**Tools**: pytest, pytest-asyncio

### Frontend
- Component rendering
- Form validation
- Utility functions

**Tools**: Vitest, React Testing Library

---

## Integration Tests (30%)

**Target**: API endpoints, database operations

- Authentication flow
- Payment approval flow
- Order creation flow
- Credit adjustment

**Tools**: pytest, httpx

---

## E2E Tests (10%)

**Target**: Critical user journeys

1. Agent creates order
2. Admin approves payment
3. User downloads subscription

**Tools**: Playwright

---

## Coverage Target

- **Minimum**: 70%
- **Critical paths**: 90%+
- **Tool**: pytest-cov

---

**Status**: Strategy defined, tests pending
