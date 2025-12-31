# Security Checklist - RAD Panel

**Last Updated**: 2025-01-01  
**Status**: Pre-deployment checklist

---

## Authentication & Authorization

- [ ] All passwords hashed with bcrypt (cost 12+)
- [ ] JWT tokens use strong secret (64+ chars random)
- [ ] Tokens expire (7 days max)
- [ ] httpOnly cookies for tokens (XSS protection)
- [ ] Secure cookies enabled in production (HTTPS only)
- [ ] SameSite=Strict for cookies (CSRF protection)
- [ ] Role-based access control implemented
- [ ] API endpoints check user permissions
- [ ] Password reset requires email verification
- [ ] Failed login attempts rate-limited (5/15min)

## Input Validation

- [ ] All API inputs validated with Pydantic
- [ ] File uploads size-limited (10MB max)
- [ ] File types restricted (jpg, png, pdf only)
- [ ] Filename sanitization (no path traversal)
- [ ] SQL injection prevented (use ORM, no raw SQL)
- [ ] NoSQL injection prevented (validate all queries)
- [ ] Command injection prevented (no shell commands with user input)
- [ ] XSS prevented (escape all user-generated content)
- [ ] LDAP injection prevented (if using LDAP)

## Data Protection

- [ ] Sensitive data encrypted at rest
- [ ] SSL/TLS for all connections (HTTPS)
- [ ] Database credentials in environment variables
- [ ] API keys not hardcoded
- [ ] Secrets not in version control
- [ ] .env file in .gitignore
- [ ] .env.example provided (no real secrets)
- [ ] Backup files encrypted
- [ ] Old backups securely deleted

## API Security

- [ ] Rate limiting enabled (100 req/min default)
- [ ] CORS configured (whitelist only)
- [ ] API versioning implemented (/api/v1)
- [ ] Error messages don't leak sensitive info
- [ ] Stack traces disabled in production
- [ ] Request logging enabled
- [ ] Suspicious activity monitoring
- [ ] DDoS protection (via Nginx/Cloudflare)

## Database Security

- [ ] Database user has minimal privileges
- [ ] Database not accessible from internet
- [ ] Database backups automated
- [ ] Backup restoration tested
- [ ] Indexes on sensitive columns
- [ ] Foreign key constraints enforced
- [ ] Transactions used for financial operations
- [ ] Connection pooling configured

## Session Management

- [ ] Session timeout configured
- [ ] Sessions invalidated on logout
- [ ] Concurrent sessions limited
- [ ] Session fixation prevented
- [ ] Session hijacking prevented (httpOnly + secure)

## Infrastructure

- [ ] Firewall configured (only 80, 443, 22)
- [ ] SSH key-based auth (no password login)
- [ ] SSH on non-standard port (not 22)
- [ ] Fail2ban installed and configured
- [ ] System packages up to date
- [ ] Unnecessary services disabled
- [ ] Root login disabled
- [ ] UFW/iptables configured
- [ ] Docker socket not exposed
- [ ] Docker containers run as non-root

## Application

- [ ] Debug mode disabled in production
- [ ] Verbose logging disabled in production
- [ ] API documentation password-protected
- [ ] Admin endpoints separate from public
- [ ] Background jobs secured
- [ ] File permissions restrictive (644 files, 755 dirs)
- [ ] Temp files cleaned up
- [ ] Dependencies up to date
- [ ] Known vulnerabilities patched

## Monitoring & Logging

- [ ] All authentication attempts logged
- [ ] Failed logins logged
- [ ] Admin actions logged
- [ ] Financial transactions logged (immutable)
- [ ] Logs rotated and archived
- [ ] Log access restricted
- [ ] Anomaly detection configured
- [ ] Security alerts configured

## Third-Party

- [ ] Marzban API calls over HTTPS
- [ ] Marzban credentials in env vars
- [ ] Third-party libraries up to date
- [ ] Dependency vulnerability scanning
- [ ] CDN resources have integrity checks (SRI)

## Compliance

- [ ] Privacy policy posted
- [ ] Terms of service posted
- [ ] Data retention policy defined
- [ ] User data export capability
- [ ] User data deletion capability
- [ ] GDPR compliance (if applicable)

## Pre-Deployment

- [ ] Security audit completed
- [ ] Penetration testing done
- [ ] Code review completed
- [ ] All tests passing
- [ ] No hardcoded credentials
- [ ] No TODO/FIXME in production code
- [ ] Error handling comprehensive
- [ ] Backup/restore tested

## Post-Deployment

- [ ] SSL certificate valid and auto-renewing
- [ ] HTTPS redirect working
- [ ] Security headers configured
- [ ] Monitoring alerts working
- [ ] Incident response plan documented
- [ ] Security contacts defined

---

**Critical**: All items must be checked before production deployment.  
**Review**: Monthly security audit  
**Updates**: Quarterly or after incidents
