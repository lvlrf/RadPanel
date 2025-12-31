# راهنمای استقرار - RAD Panel

**نسخه**: 1.0.0 MVP  
**پلتفرم**: Ubuntu 22.04 / 24.04

---

## پیش‌نیازها

### سرور
- **OS**: Ubuntu 22.04 یا 24.04
- **RAM**: حداقل 2GB (توصیه: 4GB)
- **Disk**: حداقل 20GB
- **CPU**: 2 Core
- **Network**: دسترسی به اینترنت

### دامنه
- یک دامنه یا subdomain (مثلاً `panel.example.com`)
- DNS record از نوع A که به IP سرور اشاره کند

### اطلاعات مرزبان
- URL پنل مرزبان (مثلاً `https://marzban.example.com`)
- نام کاربری و رمز عبور مدیر
- (اختیاری) پروکسی برای اتصال به مرزبان

---

## مرحله 1: نصب Docker

```bash
# به‌روزرسانی سیستم
sudo apt update && sudo apt upgrade -y

# نصب پیش‌نیازها
sudo apt install -y ca-certificates curl gnupg lsb-release

# افزودن GPG key رسمی Docker
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# افزودن repository Docker
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# نصب Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# فعال کردن و شروع Docker
sudo systemctl enable docker
sudo systemctl start docker

# تست نصب
sudo docker run hello-world
```

---

## مرحله 2: آماده‌سازی پروژه

```bash
# ایجاد دایرکتوری پروژه
sudo mkdir -p /var/rad-panel
cd /var/rad-panel

# (فرض بر این است که فایل ZIP پروژه را دریافت کرده‌اید)
# اگر فایل را در /tmp دارید:
sudo unzip /tmp/rad-panel.zip -d /var/rad-panel

# یا اگر از Git استفاده می‌کنید:
# git clone https://github.com/your-repo/rad-panel.git .

# تنظیم مالکیت
sudo chown -R $USER:$USER /var/rad-panel

# ایجاد دایرکتوری‌های لازم
mkdir -p uploads backups nginx/ssl
```

---

## مرحله 3: تنظیم Environment Variables

```bash
# کپی کردن فایل نمونه
cp .env.example .env

# ویرایش فایل .env
nano .env
```

محتوای `.env`:

```bash
# ==============================
# DATABASE
# ==============================
POSTGRES_USER=radpanel
POSTGRES_PASSWORD=your_secure_password_here_change_this
POSTGRES_DB=radpanel
DATABASE_URL=postgresql://radpanel:your_secure_password_here_change_this@db:5432/radpanel

# ==============================
# SECURITY
# ==============================
# Generate with: openssl rand -hex 32
JWT_SECRET=your_64_character_random_secret_key_here
BCRYPT_ROUNDS=12

# ==============================
# MARZBAN
# ==============================
MARZBAN_URL=https://your-marzban-panel.com
MARZBAN_USERNAME=admin
MARZBAN_PASSWORD=your_marzban_admin_password

# اگر پنل در ایران و مرزبان در خارج است (اختیاری)
# HTTP_PROXY=http://your-proxy-server:port
# HTTPS_PROXY=http://your-proxy-server:port

# ==============================
# PANEL CONFIG
# ==============================
PANEL_NAME=RAD Panel
PANEL_DOMAIN=panel.example.com

# ==============================
# BACKEND
# ==============================
BACKEND_PORT=8000
BACKEND_HOST=0.0.0.0

# ==============================
# FRONTEND
# ==============================
FRONTEND_PORT=3000
VITE_API_URL=https://panel.example.com/api
```

**مهم**: 
- `JWT_SECRET` را با یک رشته تصادفی 64 کاراکتری جایگزین کنید
- `POSTGRES_PASSWORD` را تغییر دهید
- اطلاعات مرزبان را وارد کنید
- `PANEL_DOMAIN` را با دامنه خود جایگزین کنید

---

## مرحله 4: تنظیم Nginx و SSL

### نصب Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### دریافت SSL Certificate

```bash
# دریافت گواهی Let's Encrypt
sudo certbot certonly --standalone \
  -d panel.example.com \
  --agree-tos \
  --non-interactive \
  --email your-email@example.com

# گواهی در این مسیر ذخیره می‌شود:
# /etc/letsencrypt/live/panel.example.com/
```

### تنظیم خودکار تمدید

```bash
# تست تمدید
sudo certbot renew --dry-run

# اضافه کردن cron job برای تمدید خودکار
(crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --post-hook 'docker restart rad-panel-nginx'") | crontab -
```

---

## مرحله 5: تنظیم Nginx Config

فایل `nginx/nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/m;

    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name panel.example.com;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS Server
    server {
        listen 443 ssl http2;
        server_name panel.example.com;

        # SSL Configuration
        ssl_certificate /etc/letsencrypt/live/panel.example.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/panel.example.com/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;

        # Security Headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;

        # Frontend (React SPA)
        location / {
            proxy_pass http://frontend:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        # Backend API
        location /api {
            limit_req zone=api_limit burst=20 nodelay;
            
            proxy_pass http://backend:8000;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # Timeouts
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # Login endpoint (stricter rate limit)
        location /api/auth/login {
            limit_req zone=login_limit burst=3 nodelay;
            
            proxy_pass http://backend:8000;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Uploaded files
        location /uploads {
            alias /var/rad-panel/uploads;
            autoindex off;
            
            # Only allow authenticated requests (handled by backend)
            proxy_pass http://backend:8000/uploads;
        }

        # Max upload size
        client_max_body_size 10M;
    }
}
```

**مهم**: `panel.example.com` را با دامنه خود جایگزین کنید.

---

## مرحله 6: راه‌اندازی با Docker Compose

### بررسی فایل docker-compose.yml

```yaml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    networks:
      - rad-network

  backend:
    build: ./backend
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
      - MARZBAN_URL=${MARZBAN_URL}
      - MARZBAN_USERNAME=${MARZBAN_USERNAME}
      - MARZBAN_PASSWORD=${MARZBAN_PASSWORD}
      - HTTP_PROXY=${HTTP_PROXY:-}
      - HTTPS_PROXY=${HTTPS_PROXY:-}
    volumes:
      - ./uploads:/app/uploads
    depends_on:
      - db
    restart: unless-stopped
    networks:
      - rad-network

  frontend:
    build: ./frontend
    environment:
      - VITE_API_URL=${VITE_API_URL}
    restart: unless-stopped
    networks:
      - rad-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - ./uploads:/var/rad-panel/uploads:ro
    depends_on:
      - backend
      - frontend
    restart: unless-stopped
    networks:
      - rad-network

volumes:
  postgres_data:

networks:
  rad-network:
    driver: bridge
```

### ساخت و اجرا

```bash
# ساخت images
sudo docker compose build

# اجرا
sudo docker compose up -d

# بررسی وضعیت
sudo docker compose ps

# مشاهده logs
sudo docker compose logs -f

# فقط logs backend
sudo docker compose logs -f backend
```

---

## مرحله 7: راه‌اندازی اولیه دیتابیس

```bash
# اجرای migrations
sudo docker compose exec backend alembic upgrade head

# بررسی جداول
sudo docker compose exec db psql -U radpanel -d radpanel -c "\dt"
```

**کاربر پیش‌فرض Admin**:
- **Username**: `admin`
- **Password**: `admin123`

⚠️ **مهم**: بلافاصله پس از ورود، رمز عبور را تغییر دهید!

---

## مرحله 8: بکاپ خودکار

### ایجاد script بکاپ

```bash
sudo nano /usr/local/bin/backup-radpanel.sh
```

محتوا:

```bash
#!/bin/bash

# تنظیمات
BACKUP_DIR="/var/rad-panel/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_CONTAINER="rad-panel-db-1"
DB_NAME="radpanel"
DB_USER="radpanel"

# ایجاد بکاپ
docker exec $DB_CONTAINER pg_dump -U $DB_USER $DB_NAME | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# حذف بکاپ‌های قدیمی‌تر از 30 روز
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: backup_$DATE.sql.gz"
```

```bash
# اجازه اجرا
sudo chmod +x /usr/local/bin/backup-radpanel.sh

# اضافه کردن به cron (هر روز ساعت 3 صبح)
(crontab -l 2>/dev/null; echo "0 3 * * * /usr/local/bin/backup-radpanel.sh >> /var/log/rad-panel-backup.log 2>&1") | crontab -

# تست
sudo /usr/local/bin/backup-radpanel.sh
```

---

## مرحله 9: Systemd Service (اختیاری)

برای راه‌اندازی خودکار با boot سیستم:

```bash
sudo nano /etc/systemd/system/rad-panel.service
```

محتوا:

```ini
[Unit]
Description=RAD Panel
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/var/rad-panel
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
ExecReload=/usr/bin/docker compose restart
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

```bash
# فعال‌سازی
sudo systemctl daemon-reload
sudo systemctl enable rad-panel
sudo systemctl start rad-panel

# بررسی وضعیت
sudo systemctl status rad-panel
```

---

## مرحله 10: بررسی نهایی

### چک‌لیست نهایی

- [ ] Docker نصب و در حال اجراست
- [ ] SSL certificate دریافت شده
- [ ] فایل .env تنظیم شده
- [ ] تمام containers در حال اجرا هستند
- [ ] دامنه به IP سرور اشاره دارد
- [ ] پنل از طریق HTTPS در دسترس است
- [ ] ورود با admin/admin123 کار می‌کند
- [ ] اتصال به مرزبان موفق است
- [ ] بکاپ خودکار تنظیم شده

### تست اتصال

```bash
# تست HTTPS
curl -I https://panel.example.com

# تست API
curl https://panel.example.com/api/health

# تست Marzban connection
sudo docker compose logs backend | grep "Marzban"
```

---

## عیب‌یابی

### مشکل: Container راه‌اندازی نمی‌شود

```bash
# مشاهده logs
sudo docker compose logs

# راه‌اندازی مجدد
sudo docker compose down
sudo docker compose up -d
```

### مشکل: دیتابیس connect نمی‌شود

```bash
# بررسی وضعیت database
sudo docker compose exec db pg_isready -U radpanel

# ورود به database
sudo docker compose exec db psql -U radpanel -d radpanel
```

### مشکل: SSL کار نمی‌کند

```bash
# بررسی گواهی
sudo certbot certificates

# تمدید دستی
sudo certbot renew

# راه‌اندازی مجدد nginx
sudo docker compose restart nginx
```

### مشکل: اتصال به مرزبان

```bash
# بررسی proxy settings
echo $HTTP_PROXY
echo $HTTPS_PROXY

# تست اتصال دستی
curl -x http://your-proxy:port https://your-marzban.com

# مشاهده logs backend
sudo docker compose logs backend | grep "Marzban"
```

---

## دستورات مفید

```bash
# مشاهده containers
sudo docker compose ps

# راه‌اندازی مجدد سرویس خاص
sudo docker compose restart backend

# مشاهده logs real-time
sudo docker compose logs -f

# ورود به container
sudo docker compose exec backend bash

# توقف همه
sudo docker compose down

# راه‌اندازی با build مجدد
sudo docker compose up -d --build

# حذف volumes (⚠️ خطرناک - دیتا پاک می‌شود)
sudo docker compose down -v

# بررسی استفاده از منابع
sudo docker stats
```

---

## به‌روزرسانی

```bash
# دانلود نسخه جدید
cd /var/rad-panel
git pull  # یا unzip نسخه جدید

# ساخت مجدد
sudo docker compose build

# راه‌اندازی با نسخه جدید
sudo docker compose up -d

# اجرای migrations جدید
sudo docker compose exec backend alembic upgrade head
```

---

## امنیت

### تغییر رمز Admin

1. وارد پنل شوید با `admin/admin123`
2. بروید به Profile Settings
3. رمز عبور را تغییر دهید

### Firewall

```bash
# نصب ufw
sudo apt install -y ufw

# اجازه SSH
sudo ufw allow 22/tcp

# اجازه HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# فعال‌سازی
sudo ufw enable

# بررسی
sudo ufw status
```

### محافظت از .env

```bash
# تنظیم دسترسی
sudo chmod 600 /var/rad-panel/.env
sudo chown root:root /var/rad-panel/.env
```

---

## پشتیبانی

در صورت مشکل:
1. بررسی logs: `sudo docker compose logs`
2. بررسی مستندات فنی در `/docs`
3. مراجعه به `TROUBLESHOOTING.md`

---

**موفق باشید! 🚀**
