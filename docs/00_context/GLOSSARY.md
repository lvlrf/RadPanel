# Glossary - RAD Panel

**Project**: RAD Panel  
**Last Updated**: 2025-01-01

---

## Domain Terminology

### A

**Admin**  
مدیر سیستم - The super user who manages the entire panel, approves payments, creates agents, and has full access to all features.

**Agent**  
نماینده - A sales representative who sells VPN services to end-users. Agents have credit wallets and can create VPN users.

**API (Application Programming Interface)**  
رابط برنامه‌نویسی - Interface for communication between RAD Panel and Marzban.

**امانی (Amani Credit)**  
See "Temporary Credit"

---

### B

**Backend**  
بک‌اند - Server-side application (FastAPI) that handles business logic, database operations, and API endpoints.

**Balance**  
موجودی - The total available credit (confirmed + pending) in an agent's wallet.

**bcrypt**  
Algorithm used for secure password hashing (cost factor: 12).

---

### C

**Confirmed Credit**  
اعتبار تایید شده - Credit that has been approved by admin and can be spent without restrictions.

**CRUD**  
Create, Read, Update, Delete - Basic database operations.

**Credit**  
اعتبار - Virtual currency in the system measured in Iranian Rials (IRR). Used to purchase VPN services.

**Crypto Payment**  
پرداخت ارز دیجیتال - Payment method using cryptocurrency (USDT, Bitcoin, etc.) with 10% bonus.

---

### D

**Data Limit**  
محدودیت حجم - Maximum amount of data (in GB) allocated to a VPN user.

**Days**  
روز - Duration of VPN service validity.

**Docker**  
Containerization platform used for deployment.

---

### E

**End-user**  
کاربر نهایی - Final customer who purchases VPN service for personal use.

**Excel Export**  
خروجی اکسل - Financial report generation in .xlsx format.

**Expire Date**  
تاریخ انقضا - Date when VPN service ends.

---

### F

**FastAPI**  
Python web framework used for backend development.

**Frontend**  
فرانت‌اند - Client-side application (React) that provides the user interface.

---

### G

**GB (Gigabyte)**  
گیگابایت - Unit of data measurement (1 GB = 1024 MB).

---

### I

**Inbound**  
ورودی - VPN protocol endpoint in Marzban (VMESS, VLESS, Trojan, etc.).

**IRR (Iranian Rial)**  
تومان - Currency used in the system (1 Toman = 10 Rials, but we use Toman colloquially).

---

### J

**JWT (JSON Web Token)**  
Token-based authentication method used for securing API requests.

---

### M

**Marzban**  
مرزبان - VPN panel software that RAD Panel integrates with. Handles actual VPN server management.

**MVP (Minimum Viable Product)**  
محصول حداقلی قابل استفاده - First version with essential features only.

---

### N

**Negative Credit**  
اعتبار منفی - When an agent's total balance (confirmed + pending) is below zero. Triggers 24-hour rules.

**Note (Marzban)**  
یادداشت - Metadata field in Marzban user record where RAD Panel stores additional information.

---

### O

**On Hold**  
معلق - Marzban feature to temporarily pause a user without deletion.

**Order**  
سفارش - A VPN service purchase transaction.

---

### P

**Payment Method**  
روش پرداخت - Way to transfer money (card-to-card, SHEBA, crypto).

**Pending Credit**  
اعتبار امانی/در انتظار تایید - Temporary credit given immediately upon payment upload, awaiting admin approval.

**Plan**  
پلن - VPN service package with specific days, data limit, and price.

**PostgreSQL**  
Database management system used for data storage.

**Proxy**  
پروکسی - HTTP/SOCKS proxy used to connect RAD Panel (Iran) to Marzban (abroad).

---

### R

**RAD Panel**  
پنل راد - The VPN sales and agency management system (this project).

**React**  
JavaScript library for building user interfaces.

**Receipt**  
رسید - Payment proof image uploaded by user.

**Refund**  
بازگشت اعتبار - Credit returned to agent when user is deleted within 24 hours.

**Role**  
نقش - User type: ADMIN, AGENT, or END_USER.

---

### S

**SHEBA**  
شبا - Iranian bank account number format (IR + 24 digits).

**Subscription URL**  
لینک اشتراک - Auto-updating configuration link for VPN client apps.

**Sub-user**  
See "End-user"

---

### T

**Temporary Credit**  
اعتبار امانی - Credit immediately added to wallet upon payment upload, before admin approval. Also called "Amani Credit" (امانی).

**Transaction**  
تراکنش - Record of any credit change (charge, order, refund, etc.) in the ledger.

**24-Hour Rules**  
قوانین 24 ساعته - Automated enforcement for negative credit:
  1. Block user creation if negative
  2. Disable all users after 24h if still negative
  3. Refund only if user deleted within 24h

---

### U

**Username**  
نام کاربری - Unique identifier for VPN users in Marzban.

---

### V

**VPN (Virtual Private Network)**  
شبکه خصوصی مجازی - Privacy and security service sold through RAD Panel.

---

### W

**Wallet**  
کیف پول - Agent's credit storage with two components:
  - Confirmed credit (approved)
  - Pending credit (awaiting approval)

---

## System States

### Payment Status
- **PENDING** (در انتظار) - Uploaded, awaiting admin review
- **APPROVED** (تایید شده) - Admin approved payment
- **REJECTED** (رد شده) - Admin rejected payment

### Order Status
- **ACTIVE** (فعال) - VPN user is active
- **DISABLED** (غیرفعال) - VPN user is paused
- **DELETED** (حذف شده) - VPN user is removed

### User Status
- **ACTIVE** (فعال) - User can login and operate
- **DISABLED** (غیرفعال) - User is locked out

---

## Business Concepts

### Temporary Credit Flow
```
1. User uploads receipt
2. System adds full amount as "pending credit"
3. User can spend: confirmed + pending
4. Admin approves/rejects within 24h
5a. Approve → pending becomes confirmed
5b. Reject → balance may go negative
```

### Negative Credit Enforcement
```
If balance < 0:
  → Cannot create users
  → Warning displayed
  
If still negative after 24h:
  → All user's VPN accounts disabled automatically
```

### Refund Calculation
```
Only if deleted within 24h:
  days_refund = (remaining_days / total_days) × price
  data_refund = (unused_GB / total_GB) × price
  total_refund = min(days_refund, data_refund)
```

---

## Technical Terms

### Backend Stack
- **FastAPI** - Web framework
- **SQLAlchemy** - ORM
- **Alembic** - Database migrations
- **Pydantic** - Data validation
- **httpx** - HTTP client (for Marzban)
- **APScheduler** - Background jobs

### Frontend Stack
- **React 18** - UI library
- **Vite** - Build tool
- **TanStack Query** - Data fetching
- **Tailwind CSS** - Styling
- **Axios** - HTTP client

### Database
- **PostgreSQL 15** - RDBMS
- **JSONB** - JSON storage in database
- **Index** - Performance optimization
- **Migration** - Schema version control

---

## Acronyms

| Acronym | Meaning |
|---------|---------|
| API | Application Programming Interface |
| CRUD | Create, Read, Update, Delete |
| CSV | Comma-Separated Values |
| DB | Database |
| GB | Gigabyte |
| HTTP | HyperText Transfer Protocol |
| HTTPS | HTTP Secure |
| IRR | Iranian Rial |
| JWT | JSON Web Token |
| MB | Megabyte |
| MVP | Minimum Viable Product |
| ORM | Object-Relational Mapping |
| OTP | One-Time Password |
| RBAC | Role-Based Access Control |
| SQL | Structured Query Language |
| SSL | Secure Sockets Layer |
| TLS | Transport Layer Security |
| UI | User Interface |
| UX | User Experience |
| VPN | Virtual Private Network |
| XLSX | Excel file format |

---

## Persian-English Quick Reference

| فارسی | English |
|-------|---------|
| مدیر | Admin |
| نماینده | Agent |
| کاربر نهایی | End-user |
| اعتبار | Credit |
| اعتبار امانی | Temporary/Pending Credit |
| اعتبار تایید شده | Confirmed Credit |
| اعتبار منفی | Negative Credit |
| پلن | Plan |
| سفارش | Order |
| پرداخت | Payment |
| رسید | Receipt |
| تایید | Approve |
| رد | Reject |
| فعال | Active |
| غیرفعال | Disabled |
| حذف شده | Deleted |
| کیف پول | Wallet |
| موجودی | Balance |
| تراکنش | Transaction |
| بازگشت اعتبار | Refund |
| روش پرداخت | Payment Method |
| کارت به کارت | Card-to-card |
| ارز دیجیتال | Cryptocurrency |
| لینک اشتراک | Subscription URL |

---

**Total Terms**: 50+  
**Last Updated**: 2025-01-01  
**Maintained By**: Development Team
