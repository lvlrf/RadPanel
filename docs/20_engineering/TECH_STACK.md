# Technology Stack - RAD Panel

**Version**: 1.0.0 MVP  
**Last Updated**: 2025-01-01

---

## Overview

This document explains the technology choices for RAD Panel and the rationale behind each decision.

---

## Backend Stack

### FastAPI (Python Web Framework)

**Version**: 0.104+  
**Website**: https://fastapi.tiangolo.com/

**Why Chosen**:
- ✅ **Performance**: Async/await support, one of fastest Python frameworks
- ✅ **Developer Experience**: Auto API documentation (OpenAPI/Swagger)
- ✅ **Type Safety**: Pydantic integration for request/response validation
- ✅ **Modern**: Built on Python 3.6+ features
- ✅ **Easy to Learn**: Simple, intuitive syntax
- ✅ **Production Ready**: Used by Microsoft, Uber, Netflix

**Alternatives Considered**:
- **Django**: Too heavy for MVP, more suited for CMS-style apps
- **Flask**: Lacks async support and auto-documentation
- **Node.js/Express**: Team already knows Python

**Use Cases in Project**:
- REST API endpoints
- Request validation
- Authentication middleware
- Background jobs
- Database operations

---

### SQLAlchemy (ORM)

**Version**: 2.0+  
**Website**: https://www.sqlalchemy.org/

**Why Chosen**:
- ✅ **Powerful**: Full-featured ORM with raw SQL support
- ✅ **Type Safe**: Excellent TypeScript-like typing in 2.0
- ✅ **Flexible**: Supports both Core and ORM patterns
- ✅ **Mature**: 15+ years of development
- ✅ **PostgreSQL Optimized**: Excellent dialect support

**Alternatives Considered**:
- **Django ORM**: Tied to Django framework
- **Peewee**: Less feature-rich
- **Raw SQL**: Too verbose, prone to injection

**Use Cases**:
- Database model definitions
- Query building
- Relationship management
- Transaction handling

---

### Alembic (Database Migrations)

**Version**: 1.12+  
**Website**: https://alembic.sqlalchemy.org/

**Why Chosen**:
- ✅ **SQLAlchemy Native**: Built by same team
- ✅ **Auto-generate**: Creates migrations from model changes
- ✅ **Version Control**: Git-friendly migration files
- ✅ **Rollback Support**: Easy up/down migrations

**Use Cases**:
- Schema versioning
- Database updates in production
- Development environment sync

---

### Pydantic (Data Validation)

**Version**: 2.5+  
**Website**: https://docs.pydantic.dev/

**Why Chosen**:
- ✅ **Type Safety**: Runtime validation with Python type hints
- ✅ **FastAPI Integration**: Native support
- ✅ **Automatic Parsing**: JSON ↔ Python objects
- ✅ **Excellent Errors**: Clear validation messages
- ✅ **Performance**: Rust-powered in v2

**Use Cases**:
- API request/response schemas
- Configuration validation
- Data serialization

---

### PostgreSQL (Database)

**Version**: 15+  
**Website**: https://www.postgresql.org/

**Why Chosen**:
- ✅ **ACID Compliant**: Reliable transactions
- ✅ **JSONB Support**: Flexible payment method configs
- ✅ **Full-Text Search**: Future feature support
- ✅ **Performance**: Excellent query optimizer
- ✅ **Open Source**: No licensing costs
- ✅ **Scalability**: Handles millions of rows easily

**Alternatives Considered**:
- **MySQL**: Less advanced features than PostgreSQL
- **SQLite**: Not suitable for production
- **MongoDB**: We need ACID and relations

**Use Cases**:
- Primary data storage
- Transaction ledger
- User management
- Order tracking

---

### httpx (HTTP Client)

**Version**: 0.25+  
**Website**: https://www.python-httpx.org/

**Why Chosen**:
- ✅ **Async Support**: Non-blocking Marzban API calls
- ✅ **Modern API**: Similar to requests but better
- ✅ **HTTP/2 Support**: Future-proof
- ✅ **Proxy Support**: Critical for Iran → abroad connections

**Use Cases**:
- Marzban API integration
- Proxy-based connections

---

### APScheduler (Background Jobs)

**Version**: 3.10+  
**Website**: https://apscheduler.readthedocs.io/

**Why Chosen**:
- ✅ **In-Process**: No separate service needed for MVP
- ✅ **Cron Support**: Familiar scheduling syntax
- ✅ **Async Ready**: Works with FastAPI's event loop
- ✅ **Simple**: Easy to set up

**Alternatives Considered**:
- **Celery**: Over-engineering for MVP (needs Redis/RabbitMQ)
- **Cron**: Less flexible, harder to test

**Use Cases**:
- 24-hour negative credit checks
- Database backups
- Future: payment reminders

---

### python-jose (JWT)

**Version**: 3.3+  
**Website**: https://github.com/mpdavis/python-jose

**Why Chosen**:
- ✅ **JWT Standard**: RFC 7519 compliant
- ✅ **Cryptography**: Secure token signing
- ✅ **FastAPI Examples**: Well-documented integration

**Use Cases**:
- User authentication tokens
- Session management

---

### passlib (Password Hashing)

**Version**: 1.7+  
**Website**: https://passlib.readthedocs.io/

**Why Chosen**:
- ✅ **bcrypt Support**: Industry standard hashing
- ✅ **Configurable Cost**: Easy to increase security
- ✅ **Battle-Tested**: Used everywhere

**Use Cases**:
- Password storage
- Password verification

---

### openpyxl (Excel Generation)

**Version**: 3.1+  
**Website**: https://openpyxl.readthedocs.io/

**Why Chosen**:
- ✅ **Native XLSX**: No Excel installation needed
- ✅ **Full Features**: Formulas, styling, etc.
- ✅ **Pure Python**: Cross-platform
- ✅ **UTF-8 Support**: Persian text works perfectly

**Use Cases**:
- Financial report exports
- Transaction history downloads

---

## Frontend Stack

### React 18

**Version**: 18.2+  
**Website**: https://react.dev/

**Why Chosen**:
- ✅ **Popular**: Largest ecosystem, easy to hire developers
- ✅ **Component-Based**: Reusable UI components
- ✅ **Hooks**: Modern state management
- ✅ **Fast**: Virtual DOM optimization
- ✅ **SSR Ready**: Future scalability (Next.js)

**Alternatives Considered**:
- **Vue.js**: Smaller ecosystem in Iran
- **Svelte**: Less mature, harder to hire
- **Angular**: Overkill for MVP

**Use Cases**:
- Admin dashboard
- Agent panel
- End-user interface

---

### Vite (Build Tool)

**Version**: 5.0+  
**Website**: https://vitejs.dev/

**Why Chosen**:
- ✅ **Lightning Fast**: HMR in milliseconds
- ✅ **Modern**: ES modules, no webpack complexity
- ✅ **Simple Config**: Works out of the box
- ✅ **Optimized Builds**: Tree-shaking, code splitting

**Alternatives Considered**:
- **Create React App**: Slower, deprecated
- **Webpack**: Complex configuration

---

### TanStack Query (React Query)

**Version**: 5.0+  
**Website**: https://tanstack.com/query/

**Why Chosen**:
- ✅ **Data Fetching**: Automatic caching and refetching
- ✅ **Loading States**: Built-in loading/error handling
- ✅ **Optimistic Updates**: Better UX
- ✅ **DevTools**: Excellent debugging

**Alternatives Considered**:
- **Redux**: Over-engineering for this use case
- **SWR**: Less feature-rich than React Query

**Use Cases**:
- API data fetching
- Cache management
- Real-time data updates

---

### Tailwind CSS

**Version**: 3.4+  
**Website**: https://tailwindcss.com/

**Why Chosen**:
- ✅ **Utility-First**: Fast development
- ✅ **No CSS Files**: Everything in JSX
- ✅ **Responsive**: Mobile-first by default
- ✅ **Dark Mode**: Built-in support
- ✅ **Small Bundle**: PurgeCSS removes unused styles

**Alternatives Considered**:
- **Bootstrap**: Too opinionated, bloated
- **Material-UI**: Heavy, slow
- **Plain CSS**: Too verbose

**Use Cases**:
- All styling
- Responsive layouts
- Dark/light themes

---

### Headless UI

**Version**: 2.0+  
**Website**: https://headlessui.com/

**Why Chosen**:
- ✅ **Unstyled**: Full design control
- ✅ **Accessible**: ARIA compliant
- ✅ **React Integration**: Built for React
- ✅ **Tailwind Friendly**: Perfect combo

**Use Cases**:
- Modals, dropdowns, tabs
- Form components
- Accessible UI patterns

---

### React Router

**Version**: 6.20+  
**Website**: https://reactrouter.com/

**Why Chosen**:
- ✅ **Standard**: Most used React routing library
- ✅ **Nested Routes**: Clean route organization
- ✅ **Code Splitting**: Lazy load pages
- ✅ **Protected Routes**: Easy auth integration

**Use Cases**:
- Page navigation
- Role-based routing
- Admin/Agent/User sections

---

### Axios

**Version**: 1.6+  
**Website**: https://axios-http.com/

**Why Chosen**:
- ✅ **Promise-Based**: Clean async/await syntax
- ✅ **Interceptors**: Easy auth header injection
- ✅ **Error Handling**: Better than fetch
- ✅ **Familiar**: Team already knows it

**Use Cases**:
- API requests
- File uploads
- JWT token management

---

### React Hook Form

**Version**: 7.49+  
**Website**: https://react-hook-form.com/

**Why Chosen**:
- ✅ **Performance**: Minimal re-renders
- ✅ **Validation**: Built-in validation
- ✅ **Simple**: Less code than Formik
- ✅ **TypeScript**: Full type support

**Use Cases**:
- Login forms
- Agent creation forms
- Order forms

---

## Infrastructure Stack

### Docker

**Version**: 24.0+  
**Website**: https://www.docker.com/

**Why Chosen**:
- ✅ **Consistency**: Dev = Staging = Production
- ✅ **Isolation**: No dependency conflicts
- ✅ **Easy Deployment**: Single command deployment
- ✅ **Portable**: Works on any OS

**Use Cases**:
- Development environment
- Production deployment
- Testing environments

---

### Docker Compose

**Version**: 2.23+  
**Website**: https://docs.docker.com/compose/

**Why Chosen**:
- ✅ **Multi-Container**: Easy orchestration
- ✅ **Declarative**: YAML configuration
- ✅ **Networks**: Automatic service discovery
- ✅ **Volumes**: Persistent data

**Use Cases**:
- Running backend + frontend + database
- Development setup
- Production deployment (MVP scale)

---

### Nginx

**Version**: Alpine (latest)  
**Website**: https://nginx.org/

**Why Chosen**:
- ✅ **Fast**: Highest performance web server
- ✅ **Reverse Proxy**: Routes to backend/frontend
- ✅ **SSL**: Let's Encrypt integration
- ✅ **Static Files**: Efficient serving
- ✅ **Rate Limiting**: Built-in DDoS protection

**Use Cases**:
- Reverse proxy
- SSL termination
- Static file serving
- Load balancing (future)

---

### Let's Encrypt (Certbot)

**Version**: Latest  
**Website**: https://letsencrypt.org/

**Why Chosen**:
- ✅ **Free**: No SSL certificate costs
- ✅ **Automatic**: Auto-renewal
- ✅ **Trusted**: Recognized by all browsers
- ✅ **Easy**: Simple integration

**Use Cases**:
- HTTPS/SSL certificates
- Automatic renewal

---

## Development Tools

### Git

**Why**: Version control, collaboration, backup

### Python 3.11+

**Why**: Latest stable Python with performance improvements

### Node.js 20+

**Why**: Modern JavaScript runtime for frontend build

### VS Code

**Recommended Extensions**:
- Python
- Pylance
- ES7+ React snippets
- Tailwind CSS IntelliSense
- Docker

---

## Testing Stack (Future)

### Backend
- **pytest**: Unit testing
- **pytest-asyncio**: Async test support
- **httpx**: API testing

### Frontend
- **Vitest**: Fast unit testing (Vite native)
- **React Testing Library**: Component testing
- **Playwright**: E2E testing

---

## Monitoring Stack (Future - Phase 2+)

### Application
- **Sentry**: Error tracking
- **Prometheus**: Metrics
- **Grafana**: Dashboards

### Infrastructure
- **Netdata**: System monitoring
- **Uptime Kuma**: Uptime monitoring

---

## Summary

### Why This Stack?

1. **Developer Productivity**
   - FastAPI: Fast development with auto-docs
   - React: Component reusability
   - Tailwind: Rapid styling

2. **Performance**
   - FastAPI: Async support
   - PostgreSQL: Optimized queries
   - Vite: Fast builds
   - Nginx: Efficient serving

3. **Maintainability**
   - TypeScript-like typing in Python
   - Component-based React
   - Docker for consistency

4. **Scalability**
   - Async architecture
   - PostgreSQL can handle millions of rows
   - Easy to add Redis, load balancers later

5. **Cost**
   - All open source
   - No licensing fees
   - Runs on $10-20/month VPS for MVP

6. **Developer Availability**
   - Python, React: Easy to hire in Iran
   - Popular stack: Good community support

---

**Stack Maturity**: Production-Ready  
**Total Technologies**: 20+  
**All Open Source**: Yes ✅  
**License Costs**: $0
