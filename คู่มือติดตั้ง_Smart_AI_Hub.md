# คู่มือติดตั้ง Smart AI Hub

## ภาพรวม

คู่มือนี้ให้คำแนะนำทีละขั้นตอนในการติดตั้งแพลตฟอร์ม Smart AI Hub บนระบบ production การติดตั้งรวมถึงบริการทั้งหมดที่จำเป็น การติดตั้ง monitoring การกำหนดค่าความปลอดภัย และขั้นตอนการดำเนินงาน

## ข้อกำหนดเบื้องต้น

### ความต้องการด้านโครงสร้างพื้นฐาน

| ส่วนประกอบ | ขั้นต่ำ | แนะนำ |
|-----------|---------|-------------|
| CPU | 4 cores | 8 cores |
| RAM | 8 GB | 16 GB |
| Storage | 50 GB SSD | 100 GB SSD |
| Network | 1 Gbps | 10 Gbps |

### ความต้องการด้านซอฟต์แวร์

- Docker (v20.x หรือใหม่กว่า)
- Docker Compose (v2.x หรือใหม่กว่า)
- OpenSSL (สำหรับ SSL certificates)
- Git

### บริการภายนอก

- ชื่อโดเมน (เช่น yourdomain.com)
- SSL certificates (Let's Encrypt หรือ commercial)
- SMTP server สำหรับการแจ้งเตือนทางอีเมล
- Cloud storage (AWS S3, Google Cloud Storage, เป็นต้น)

## สถาปัตยกรรมการติดตั้ง

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │────│   Nginx Proxy   │────│   Frontend      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                 │
                 ┌───────────────┼───────────────┐
                 │               │               │
         ┌───────▼──────┐ ┌──────▼──────┐ ┌─────▼──────┐
         │ API Gateway  │ │Auth Service │ │Core Service│
         └──────────────┘ └─────────────┘ └────────────┘
                 │               │               │
                 └───────────────┼───────────────┘
                                 │
                     ┌───────────▼───────────┐
                     │   Database & Cache    │
                     │  (PostgreSQL, Redis)  │
                     └───────────────────────┘
```

## การเตรียมการก่อนติดตั้ง

### ขั้นตอนที่ 1: Clone Repository

```bash
git clone https://github.com/your-username/Smart-AI-Hub.git
cd Smart-AI-Hub
```

### ขั้นตอนที่ 2: กำหนดค่าตัวแปรสภาพแวดล้อม

```bash
# คัดลอกเทมเพลตสภาพแวดล้อม production
cp .env.production .env.local

# แก้ไขไฟล์สภาพแวดล้อมด้วยค่าจริง
nano .env.local
```

### ขั้นตอนที่ 3: สร้าง SSL Certificates

#### ตัวเลือก A: Let's Encrypt (แนะนำ)

```bash
# ติดตั้ง Certbot
sudo apt-get update
sudo apt-get install certbot

# สร้าง certificates
sudo certbot certonly --standalone -d yourdomain.com

# คัดลอก certificates ไปยังโปรเจกต์ไดเรกทอรี
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ./ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ./ssl/key.pem
```

#### ตัวเลือก B: Self-Signed (สำหรับทดสอบ)

```bash
# สร้าง SSL directory
mkdir -p ssl

# สร้าง self-signed certificates
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout ssl/key.pem \
    -out ssl/cert.pem \
    -subj "/C=TH/ST=Bangkok/L=Bangkok/O=Smart AI Hub/CN=yourdomain.com"
```

### ขั้นตอนที่ 4: สร้างไดเรกทอรีที่จำเป็น

```bash
# สร้างไดเรกทอรีสำหรับ logs และ backups
mkdir -p logs/{api-gateway,auth-service,core-service,mcp-server,nginx}
mkdir -p backups
mkdir -p ssl
```

## กระบวนการติดตั้ง

### ขั้นตอนที่ 5: การติดตั้งอัตโนมัติ

ใช้สคริปต์การติดตั้งที่ให้มาสำหรับการติดตั้งอัตโนมัติ:

```bash
# ทำให้สคริปต์สามารถ execute ได้
chmod +x scripts/deploy-production.sh

# รันสคริปต์การติดตั้ง
./scripts/deploy-production.sh
```

### ขั้นตอนที่ 6: การติดตั้งด้วยตนเอง

หากคุณต้องการติดตั้งด้วยตนเอง ให้ทำตามขั้นตอนเหล่านี้:

#### ขั้นตอนที่ 6.1: อัปเดตโค้ดแอปพลิเคชัน

```bash
# ดึงการเปลี่ยนแปลงล่าสุด
git pull origin main

# ติดตั้ง dependencies
npm ci --production

# Build packages
npm run build
```

#### ขั้นตอนที่ 6.2: ติดตั้งบริการ

```bash
# หยุดบริการที่มีอยู่
docker-compose -f docker-compose.prod.yml down

# Build images ใหม่
docker-compose -f docker-compose.prod.yml build --no-cache

# เริ่มบริการ
docker-compose -f docker-compose.prod.yml up -d
```

#### ขั้นตอนที่ 6.3: รัน Database Migrations

```bash
# รอให้ database พร้อม
sleep 30

# รัน migrations
docker-compose -f docker-compose.prod.yml exec core-service npm run db:migrate
```

#### ขั้นตอนที่ 6.4: ตรวจสอบการติดตั้ง

```bash
# ตรวจสอบสถานะบริการ
docker-compose -f docker-compose.prod.yml ps

# ตรวจสอบ health endpoints
curl -f https://yourdomain.com/health
curl -f https://yourdomain.com/auth/health
curl -f https://yourdomain.com/core/health
curl -f https://yourdomain.com/mcp/health
```

## การติดตั้งระบบ Monitoring

### ขั้นตอนที่ 7: ติดตั้ง Monitoring Stack

```bash
# ไปยัง monitoring directory
cd monitoring

# ติดตั้งบริการ monitoring
docker-compose -f docker-compose.monitoring.yml up -d
```

### ขั้นตอนที่ 8: เข้าถึง Monitoring Dashboards

#### Monitoring Stack
- **Grafana**: https://yourdomain.com:3001 (admin/admin123)
- **Prometheus**: https://yourdomain.com:9090
- **AlertManager**: https://yourdomain.com:9093

#### Frontend Monitoring Dashboard
- **แดชบอร์ดหลัก**: https://yourdomain.com/admin/monitoring
- **วิเคราะห์ประสิทธิภาพ**: https://yourdomain.com/admin/monitoring/performance
- **Monitoring ฐานข้อมูล**: https://yourdomain.com/admin/monitoring/database
- **จัดการ Alert**: https://yourdomain.com/admin/monitoring/alerts
- **ทรัพยากรระบบ**: https://yourdomain.com/admin/monitoring/system
- **การผสานรวม Grafana**: https://yourdomain.com/admin/monitoring/grafana

### ขั้นตอนที่ 9: กำหนดค่า Grafana Dashboards

1. เข้าสู่ระบบ Grafana
2. เพิ่ม Prometheus เป็น data source
3. นำเข้า dashboards ที่กำหนดค่าไว้ล่วงหน้าจาก `monitoring/grafana/dashboards`

### ขั้นตอนที่ 10: กำหนดค่าตัวแปรสภาพแวดล้อม Monitoring

เพิ่มสิ่งต่อไปนี้ในไฟล์ `.env.local` ของคุณ:

```bash
# Monitoring Configuration
VITE_GRAFANA_URL=https://yourdomain.com:3001
VITE_API_URL=https://yourdomain.com

# Alertmanager Configuration
ALERTMANAGER_SMTP_HOST=smtp.example.com
ALERTMANAGER_SMTP_PORT=587
ALERTMANAGER_SMTP_USER=alerts@example.com
ALERTMANAGER_SMTP_PASSWORD=your-password
ALERTMANAGER_SMTP_FROM=Smart AI Hub Alerts <alerts@example.com>
ALERTMANAGER_SMTP_TO=admin@example.com
```

### ขั้นตอนที่ 11: การติดตั้ง Performance Monitoring (ขั้นสูง)

#### 11.1 การติดตั้ง Monitoring Library

```bash
# ติดตั้ง shared monitoring library
cd packages/shared/monitoring
npm install
```

#### 11.2 การกำหนดค่า Metrics สำหรับแต่ละบริการ

ทุกบริการได้รับการติดตั้ง monitoring middleware แล้ว:

- **Auth Service** (port 3001) - Authentication metrics
- **Core Service** (port 3002) - API performance metrics
- **MCP Server** (port 3003) - AI model interaction metrics
- **Notification Service** (port 3004) - Email delivery metrics
- **Webhook Service** (port 3005) - Webhook delivery metrics

#### 11.3 การตรวจสอบ Metrics Endpoints

```bash
# ตรวจสอบ metrics endpoints ทั้งหมด
curl https://yourdomain.com/api/metrics
curl https://yourdomain.com/auth/metrics
curl https://yourdomain.com/core/metrics
curl https://yourdomain.com/mcp/metrics
curl https://yourdomain.com/webhook/metrics
curl https://yourdomain.com/notification/metrics
```

#### 11.4 การกำหนดค่า Alert Rules

ระบบมีการกำหนดค่า alert rules 7 ประเภท:

1. **ServiceDown** - เมื่อบริการไม่สามารถเข้าถึงได้
2. **HighErrorRate** - อัตราความผิดพลาด > 5%
3. **HighResponseTime** - เวลาตอบสนอง > 1 วินาที
4. **SlowDatabaseQueries** - คำสั่งฐานข้อมูล > 2 วินาที
5. **HighMemoryUsage** - การใช้หน่วยความจำ > 80%
6. **HighCPUUsage** - การใช้ CPU > 80%
7. **UnusualTraffic** - การจราจรผิดปกติ

#### 11.5 การกำหนดค่าการแจ้งเตือนทางอีเมล

Alertmanager ได้รับการกำหนดค่าให้ส่งอีเมลแจ้งเตือนโดยอัตโนมัติ:

```bash
# ทดสอบการส่งอีเมลแจ้งเตือน
curl -X POST http://localhost:9093/api/v1/alerts \
  -H "Content-Type: application/json" \
  -d '[{
    "labels": {
      "alertname": "TestAlert",
      "severity": "info"
    },
    "annotations": {
      "description": "This is a test alert"
    }
  }]'
```

#### 11.6 การเข้าถึง Monitoring Dashboard

แดชบอร์ด monitoring ได้รับการป้องกันด้วย RBAC:

- **บทบาทที่จำเป็น**: Admin, Manager
- **สิทธิ์ที่จำเป็น**: `monitoring:read`, `system:read`

เพื่อมอบสิทธิ์การเข้าถึง monitoring ให้กับผู้ใช้:

```sql
-- มอบบทบาท admin สำหรับการเข้าถึง monitoring แบบเต็ม
INSERT INTO user_roles (user_id, role_id) VALUES ('user-id', 'admin-role-id');

-- มอบบทบาท manager สำหรับการเข้าถึง monitoring
INSERT INTO user_roles (user_id, role_id) VALUES ('user-id', 'manager-role-id');
```

## การกำหนดค่าความปลอดภัย

### ขั้นตอนที่ 12: การตั้งค่า Firewall

```bash
# กำหนดค่า UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### ขั้นตอนที่ 13: การกำหนดค่า Security Headers

Smart AI Hub มีการติดตั้ง security headers ที่ครอบคลุมในทุกชั้นของแอปพลิเคชัน เพื่อป้องกันช่องโหว่ความปลอดภัยต่างๆ รวมถึง XSS, clickjacking, MIME-type sniffing และการโจมตีแบบ man-in-the-middle

#### Security Headers ที่ติดตั้ง

| Header | วัตถุประสงค์ | ค่า |
|--------|-------------|------|
| `X-Content-Type-Options` | ป้องกัน MIME-type sniffing | `nosniff` |
| `X-Frame-Options` | ป้องกัน clickjacking | `DENY` |
| `X-XSS-Protection` | เปิดใช้งาน XSS filtering | `1; mode=block` |
| `Strict-Transport-Security` | บังคับใช้ HTTPS | `max-age=31536000; includeSubDomains; preload` |
| `Referrer-Policy` | ควบคุมข้อมูล referrer | `strict-origin-when-cross-origin` |
| `X-DNS-Prefetch-Control` | ควบคุม DNS prefetching | `off` |
| `X-Download-Options` | ป้องกันการ execute file downloads | `noopen` |
| `X-Permitted-Cross-Domain-Policies` | จำกัด cross-domain policies | `none` |
| `Permissions-Policy` | ควบคุมการเข้าถึงฟีเจอร์ของ browser | ถูกจำกัด |
| `Content-Security-Policy` | ควบคุมการโหลดทรัพยากร | ขึ้นกับสภาพแวดล้อม |

#### Content Security Policy (CSP)

CSP มีการกำหนดค่าตามสภาพแวดล้อม:

**CSP สำหรับ Production (เข้มงวด):**
```
default-src 'self';
script-src 'self' 'nonce-{NONCE}';
style-src 'self' 'nonce-{NONCE}';
img-src 'self' data: https:;
connect-src 'self' https://api.smart-ai-hub.com;
font-src 'self';
object-src 'none';
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
upgrade-insecure-requests;
report-uri /api/v1/security/csp-report;
```

**CSP สำหรับ Staging (ผ่อนปรน):**
```
default-src 'self' 'unsafe-inline' 'unsafe-eval';
script-src 'self' 'unsafe-inline' 'unsafe-eval' localhost:* ws://localhost:*;
connect-src 'self' localhost:* ws://localhost:*;
report-uri /api/v1/security/csp-report;
```

#### ขั้นตอนการติดตั้ง Security Headers

1. **ตรวจสอบการกำหนดค่า NGINX**
   ```bash
   # ทดสอบการกำหนดค่า NGINX
   nginx -t -c nginx.prod.conf
   
   # โหลด NGINX ใหม่ถ้าถูกต้อง
   nginx -s reload
   ```

2. **กำหนดค่า Backend Services**
   - บริการ backend ทั้งหมดใช้ Helmet.js middleware
   - การกำหนดค่าความปลอดภัยอยู่ใน `packages/shared/security/headers.ts`
   - CSP nonces ถูกสร้างต่อ request สำหรับ inline scripts

3. **การกำหนดค่า Frontend**
   - Security meta tags อยู่ใน `packages/frontend/index.html`
   - CSP policies ถูกบังคับใช้ผ่าน NGINX และ backend headers
   - Inline scripts ทั้งหมดใช้ CSP nonces

#### การทดสอบ Security Headers

1. **รันสคริปต์ทดสอบความปลอดภัย**
   ```bash
   # Linux/macOS
   ./scripts/test-security-headers.sh --base-url https://yourdomain.com --frontend-url https://yourdomain.com --verbose
   
   # Windows
   scripts\test-security-headers.bat --base-url https://yourdomain.com --frontend-url https://yourdomain.com --verbose
   ```

2. **ตรวจสอบ Headers ด้วยตนเอง**
   ```bash
   # ตรวจสอบ security headers
   curl -I https://yourdomain.com
   
   # มองหา security headers ทั้งหมดใน response
   ```

3. **การทดสอบความปลอดภัยภายนอก**
   - ทดสอบกับ [securityheaders.com](https://securityheaders.com) - เป้าหมาย: A+ rating
   - ทดสอบกับ [Mozilla Observatory](https://observatory.mozilla.org) - เป้าหมาย: 90+ score
   - ทดสอบกับ [SSL Labs](https://www.ssllabs.com/ssltest/) - เป้าหมาย: A+ rating

#### การ Monitoring ความปลอดภัย

1. **เข้าถึง Security Dashboard**
   - URL: `https://yourdomain.com/admin/security/headers`
   - ฟีเจอร์: สถานะความปลอดภัย, CSP violations, คะแนนความปลอดภัย, คำแนะนำ

2. **ตรวจสอบ CSP Violations**
   ```bash
   # ตรวจสอบ violations ล่าสุด
   curl -H "Authorization: Bearer <token>" https://yourdomain.com/api/v1/security/status
   ```

3. **การแจ้งเตือนความปลอดภัย**
   - CSP violations ระดับสูงแจ้งเตือนทันที
   - คะแนนความปลอดภัยต่ำกว่า B แจ้งเตือน
   - Security headers หายไปแจ้งเตือนระดับ critical

#### การบำรุงรักษา Security Headers

1. **การทดสอบปกติ**
   - ทดสอบ security headers หลังการ deploy ทุกครั้ง
   - รัน automated tests รายสัปดาห์
   - ตรวจสอบคะแนนความปลอดภัยภายนอกรายเดือน

2. **การจัดการ CSP Violations**
   - ตรวจสอบ violations ใน production ทุกวัน
   - อัปเดต CSP policies เพื่ออนุญาตทรัพยากรที่ถูกต้อง
   - ลบ `unsafe-inline` ออกจาก CSP ใน production

3. **การจัดการ HSTS**
   - ทดสอบ HSTS ใน staging ก่อน production
   - เริ่มต้นด้วย max-age ที่สั้นกว่า (1 ชั่วโมง) สำหรับโดเมนใหม่
   - เปิดใช้งาน preload เฉพาะหลังทดสอบอย่างละเอียด

#### การแก้ไขปัญหา Security Headers

1. **CSP Violations**
   ```bash
   # ตรวจสอบรายละเอียด violations
   curl -H "Authorization: Bearer <token>" https://yourdomain.com/api/v1/security/violations
   
   # วิธีแก้ไขทั่วไป:
   # - เพิ่มโดเมนที่หายไปใน CSP directives
   # - ใช้ nonces แทน unsafe-inline
   # - ย้าย inline scripts ไปยัง external files
   ```

2. **Headers ที่หายไป**
   ```bash
   # ตรวจสอบการกำหนดค่า NGINX
   nginx -t -c nginx.prod.conf
   
   # ตรวจสอบการกำหนดค่าบริการ
   docker-compose -f docker-compose.prod.yml logs nginx
   ```

3. **ปัญหา HSTS**
   ```bash
   # HSTS เปิดใช้งานเฉพาะใน production/staging
   # ตรวจสอบตัวแปรสภาพแวดล้อม NODE_ENV=production
   
   # หากต้องการปิด HSTS ชั่วคราว (ฉุกเฉินเท่านั้น):
   # ลบ HSTS header ออกจาก nginx.prod.conf
   # โหลด NGINX ใหม่
   ```

#### การคำนวณคะแนนความปลอดภัย

คะแนนความปลอดภัยถูกคำนวณจาก:
- **Headers ที่มีอยู่** (60%): แต่ละ header ที่จำเป็นมีคะแนน
- **ความเข้มงวดของ CSP** (25%): CSP ที่เข้มงวดกว่าได้คะแนนสูงกว่า
- **การกำหนดค่า HSTS** (10%): HSTS ที่ถูกต้องเพิ่มคะแนน
- **Violations** (-5% ต่อรายการ): Violations ล่าสุดลดคะแนน

**ระดับคะแนน:**
- **A+**: 95-100 คะแนน
- **A**: 90-94 คะแนน
- **B**: 80-89 คะแนน
- **C**: 70-79 คะแนน
- **D**: 60-69 คะแนน
- **F**: ต่ำกว่า 60 คะแนน

สำหรับเอกสารฉบับสมบูรณ์เกี่ยวกับ security headers โปรดอ้างอิง `docs/SECURITY_HEADERS.md`

### ขั้นตอนที่ 14: Rate Limiting

Rate limiting ได้รับการกำหนดค่าใน Nginx:
- API endpoints: 10 requests/second
- Auth endpoints: 5 requests/second

## การสำรองข้อมูลและการกู้คืน

### ขั้นตอนที่ 15: การสำรองข้อมูลอัตโนมัติ

การสำรองข้อมูลจะถูกสร้างโดยอัตโนมัติระหว่างการติดตั้งและสามารถกำหนดเวลาด้วย cron:

```bash
# แก้ไข crontab
crontab -e

# เพิ่มการสำรองข้อมูลทุกวันเวลา 2 นาฬิกา
0 2 * * * /path/to/Smart-AI-Hub/scripts/backup.sh
```

### ขั้นตอนที่ 16: การสำรองข้อมูลด้วยตนเอง

```bash
# สำรองข้อมูลฐานข้อมูล
docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U postgres smart_ai_hub | gzip > backups/db_backup_$(date +%Y%m%d_%H%M%S).sql.gz

# สำรองข้อมูลการกำหนดค่า
tar -czf backups/config_backup_$(date +%Y%m%d_%H%M%S).tar.gz .env.local nginx.prod.conf docker-compose.prod.yml
```

### ขั้นตอนที่ 17: ขั้นตอนการกู้คืน

```bash
# หยุดบริการ
docker-compose -f docker-compose.prod.yml down

# กู้คืนฐานข้อมูล
gunzip -c backups/db_backup_YYYYMMDD_HHMMSS.sql.gz | docker-compose -f docker-compose.prod.yml exec -T postgres psql -U postgres smart_ai_hub

# เริ่มบริการ
docker-compose -f docker-compose.prod.yml up -d
```

## การปรับขนาดและประสิทธิภาพ

### ขั้นตอนที่ 18: การปรับขนาดแนวนอน

เพื่อปรับขนาดบริการแต่ละรายการ:

```bash
# ปรับขนาด API Gateway
docker-compose -f docker-compose.prod.yml up -d --scale api-gateway=3

# ปรับขนาด Auth Service
docker-compose -f docker-compose.prod.yml up -d --scale auth-service=2
```

### ขั้นตอนที่ 19: การปรับแต่งฐานข้อมูล

- กำหนดค่า connection pooling
- เปิดใช้งาน query caching
- ตั้งค่า read replicas สำหรับ traffic สูง

### ขั้นตอนที่ 20: การปรับแต่ง Redis

- กำหนดค่าขีดจำกัดหน่วยความจำ
- เปิดใช้งาน persistence
- ตั้งค่า Redis Cluster สำหรับ high availability

## การแก้ไขปัญหา

### ขั้นตอนที่ 21: บริการไม่เริ่มทำงาน

```bash
# ตรวจสอบ service logs
docker-compose -f docker-compose.prod.yml logs [service-name]

# ตรวจสอบสถานะบริการ
docker-compose -f docker-compose.prod.yml ps

# รีสตาร์ทบริการ
docker-compose -f docker-compose.prod.yml restart [service-name]
```

### ขั้นตอนที่ 22: ปัญหาการเชื่อมต่อฐานข้อมูล

```bash
# ทดสอบการเชื่อมต่อฐานข้อมูล
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d smart_ai_hub -c "SELECT 1;"

# ตรวจสอบ database logs
docker-compose -f docker-compose.prod.yml logs postgres
```

### ขั้นตอนที่ 23: ปัญหา SSL Certificate

```bash
# ตรวจสอบการหมดอายุของ certificate
openssl x509 -in ssl/cert.pem -text -noout | grep "Not After"

# ต่ออายุ certificates
sudo certbot renew
```

## การบำรุงรักษา

### ขั้นตอนที่ 24: การอัปเดตปกติ

```bash
# อัปเดตแอปพลิเคชัน
git pull origin main
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

### ขั้นตอนที่ 25: การจัดการ Logs

```bash
# หมุน logs
docker-compose -f docker-compose.prod.yml exec [service-name] logrotate -f /etc/logrotate.d/[service]

# ลบ logs เก่า
find logs/ -name "*.log" -mtime +30 -delete
```

### ขั้นตอนที่ 26: การตรวจสอบประสิทธิภาพ

ตรวจสอบเป็นประจำ:
- การใช้ CPU และหน่วยความจำ
- ประสิทธิภาพฐานข้อมูล
- เวลาตอบสนอง
- อัตราความผิดพลาด

## ขั้นตอนฉุกเฉิน

### ขั้นตอนที่ 27: การหยุดทำงานของบริการ

1. ระบุบริการที่ได้รับผลกระทบ
2. ตรวจสอบ service logs
3. รีสตาร์ทบริการหากจำเป็น
4. ตรวจสอบสุขภาพบริการ

### ขั้นตอนที่ 28: ความล้มเหลวของฐานข้อมูล

1. สลับไปใช้ read replica หากมี
2. กู้คืนจากการสำรองข้อมูลล่าสุด
3. ตรวจสอบความสมบูรณ์ของข้อมูล

### ขั้นตอนที่ 29: เหตุการณ์ความปลอดภัย

1. ระบุและควบคุมการบุกรุก
2. ตรวจสอบ access logs
3. เปลี่ยน secrets และ certificates
4. อัปเดตการกำหนดค่าความปลอดภัย

## การสนับสนุนและการติดต่อ

สำหรับการสนับสนุนเพิ่มเติม:
- สร้าง issue บน GitHub
- ติดต่อทีม DevOps
- อ่านเอกสารประกอบที่ https://docs.smartaihub.com

---

**หมายเหตุ**: คู่มือนี้สำหรับการติดตั้งในสภาพแวดล้อม production สำหรับสภาพแวดล้อม development หรือ staging โปรดอ้างอิงเอกสารที่เกี่ยวข้อง

## เอกสารประกอบเพิ่มเติม

สำหรับข้อมูลเพิ่มเติมเกี่ยวกับระบบ monitoring โปรดอ่าน `docs/PERFORMANCE_MONITORING.md`

## ขั้นตอนที่ 12: การตั้งค่า Response Time Tracking

Smart AI Hub มีระบบติดตามเวลาตอบสนองและการตรวจสอบ SLA (Service Level Agreement) เพื่อให้มั่นใจว่าบริการทั้งหมดทำงานด้วยประสิทธิภาพสูงสุด

### 12.1 การกำหนดค่า SLA

ระดับ SLA ถูกกำหนดใน `config/sla-config.json` ด้วยเกณฑ์ต่อไปนี้:

| ระดับ SLA | เกณฑ์ (P95) | คำอธิบาย | ตัวอย่าง Endpoint |
|-------------|-------------|-------------|-------------------|
| Critical | < 500ms | ปฏิบัติการที่สำคัญทางภารกิจ | auth, mcp chat |
| High | < 1000ms | ฟีเจอร์สำคัญสำหรับผู้ใช้ | users, credits |
| Medium | < 2000ms | การวิเคราะห์และ monitoring | analytics, monitoring |
| Low | < 5000ms | การประมวลผลในพื้นหลัง | webhooks, reports |

### 12.2 การติดตั้ง Response Time Tracking

```bash
# ติดตั้ง SLA alert rules
cp monitoring/sla-alert-rules.yml /etc/prometheus/rules/

# รีสตาร์ท Prometheus เพื่อโหลด rules ใหม่
docker-compose restart prometheus

# ตรวจสอบว่า rules โหลดแล้ว
curl http://localhost:9090/api/v1/rules
```

### 12.3 การเปิดใช้งาน Performance Baselines

```bash
# ติดตั้ง cron job สำหรับคำนวณ baselines
crontab -e

# เพิ่ม job ที่ทำงานทุกวันเวลา 2 นาฬิกา
0 2 * * * cd /path/to/Smart-AI-Hub && docker-compose exec analytics-service npm run calculate-baselines
```

### 12.4 การเข้าถึง Response Time Analytics

เข้าถึงแดชบอร์ด Response Time Analytics ได้ที่:
`https://yourdomain.com/admin/monitoring/response-time`

แดชบอร์ดประกอบด้วย 5 ส่วน:

1. **ภาพรวม** - เวลาตอบสนองเฉลี่ย, เปอร์เซ็นต์ความสอดคล้อง SLA, endpoint ที่ช้าที่สุด, จำนวนการละเมิด
2. **การวิเคราะห์ Endpoint** - ตารางที่สามารถกรอง/เรียงลำดับ/ค้นหาได้
3. **แนวโน้มเวลาตอบสนอง** - กราฟแสดง P50/P90/P95/P99
4. **การละเมิด SLA** - รายการการละเมิดล่าสุดพร้อมรายละเอียด
5. **การเปรียบเทียบประสิทธิภาพ** - เปรียบเทียบ endpoints/ช่วงเวลา/บริการ

### 12.5 การกำหนดค่า Grafana Dashboard

```bash
# นำเข้า dashboard สำหรับ response time analysis
curl -X POST \
  http://admin:admin123@localhost:3001/api/dashboards/db \
  -H 'Content-Type: application/json' \
  -d @monitoring/grafana/dashboards/response-time-analysis.json
```

เข้าถึง Grafana dashboard ได้ที่:
`https://yourdomain.com:3001/d/smart-ai-hub-response-time`

### 12.6 การกำหนดค่าตัวแปรสภาพแวดล้อม

เพิ่มสิ่งต่อไปนี้ในไฟล์ `.env.local`:

```bash
# Response Time Tracking Configuration
ENABLE_RESPONSE_TIME_TRACKING=true
DEFAULT_SLA_TIER=medium
BASELINE_CALCULATION_SCHEDULE=0 2 * * *  # ทุกวันเวลา 2 นาฬิกา
PERFORMANCE_RETENTION_DAYS=90
```

### 12.7 การตรวจสอบการทำงาน

```bash
# ตรวจสอบว่า response time headers ถูกเพิ่ม
curl -I https://yourdomain.com/api/v1/users
# ควรเห็น: X-Response-Time: <value>ms

# ตรวจสอบ metrics ที่เกี่ยวข้องกับ response time
curl http://localhost:9090/api/v1/query?query=http_response_time_milliseconds_bucket

# ตรวจสอบ SLA alerts
curl http://localhost:9093/api/v1/alerts
```

### 12.8 การแก้ไขปัญหาที่พบบ่อย

#### ไม่พบ Response Time Headers
- ตรวจสอบว่า monitoring middleware ถูกเปิดใช้งานในทุกบริการ
- ตรวจสอบว่า `ENABLE_RESPONSE_TIME_TRACKING=true` ถูกตั้งค่า

#### SLA Alerts ไม่ทำงาน
- ตรวจสอบว่า Prometheus alert rules ถูกโหลด
- ตรวจสอบการกำหนดค่า AlertManager

#### Baseline Calculation ไม่ทำงาน
- ตรวจสอบว่า cron job ถูกกำหนดค่า
- ตรวจสอบ logs ของ analytics service

#### Dashboard ไม่แสดงข้อมูล
- ตรวจสอบว่า Prometheus กำลังเก็บ metrics
- ตรวจสอบการกำหนดค่า data source ใน Grafana