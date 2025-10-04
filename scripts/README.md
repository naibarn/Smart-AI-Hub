# Smart AI Hub Scripts

This directory contains various scripts for the Smart AI Hub project, including authentication tests and deployment automation.

## Available Scripts

### Deployment Scripts

#### 1. Bash Deployment Script (Linux/macOS)

**File:** `deploy.sh`

Comprehensive deployment script for VPS with error handling and rollback capabilities.

**Usage:**

```bash
./scripts/deploy.sh
./scripts/deploy.sh --help
./scripts/deploy.sh --dry-run
```

**Features:**

- Pull latest code from git
- Install dependencies (npm ci)
- Run database migrations (npx prisma migrate deploy)
- Build all packages (npm run build)
- Restart services with PM2
- Health check endpoints
- Automatic rollback on failure
- Detailed logging

#### 2. Windows Deployment Script

**File:** `deploy.bat`

Windows batch version of the deployment script with the same functionality.

**Usage:**

```cmd
scripts\deploy.bat
scripts\deploy.bat --help
scripts\deploy.bat --dry-run
```

For detailed deployment documentation, see [`DEPLOYMENT_README.md`](DEPLOYMENT_README.md).

### Authentication Test Scripts

#### 1. Node.js Version (Recommended)

**File:** `test-auth.js`

This is the recommended version as it works cross-platform and handles JSON parsing correctly.

**Usage:**

```bash
node scripts/test-auth.js
```

#### 2. Bash Version

**File:** `test-auth.sh`

This version works on Unix-like systems with Git Bash, WSL, or Linux/macOS.

**Requirements:**

- curl
- node (for JSON parsing)

**Usage:**

```bash
bash scripts/test-auth.sh
```

#### 3. Windows Batch Version

**File:** `test-auth.bat`

This version works on Windows Command Prompt.

**Note:** This version has limitations with JSON parsing and may not work correctly in all cases.

**Usage:**

```cmd
scripts\test-auth.bat
```

## Test Flow

All scripts test the following authentication flow:

1. **Register User** - Creates a new user account
2. **Login** - Authenticates the user and receives tokens
3. **Access Protected Endpoint** - Calls a protected endpoint with the access token
4. **Refresh Token** - Refreshes the access token using the refresh token
5. **Logout** - Logs out the user and revokes tokens
6. **Verify Logout** - Attempts to access a protected endpoint after logout (should fail)

## Prerequisites

Before running the test scripts, ensure:

1. **Auth Service is running** on `http://localhost:3001`
2. **Database is set up** with the required tables and seed data
3. **Redis is running** for token storage and blacklist functionality

### Starting the Auth Service

```bash
cd packages/auth-service
npm run dev
```

### Setting up the Database

```bash
cd packages/auth-service
npx prisma db push
node prisma/seed.js
```

## Expected Output

When the test runs successfully, you should see output similar to:

```
========================================
🧪 ทดสอบ Authentication Flow
========================================

🔄 ตรวจสอบสถานะ Auth Service...
✅ Auth Service ทำงานอยู่
Response: {"success":true,"message":"Smart AI Hub Auth Service is running",...}

🔄 1. Register ผู้ใช้ใหม่
✅ Register สำเร็จ
Response: {"success":true,"data":{"user":{...},"token": "...", ...}}

🔄 2. Login และเก็บ tokens
✅ Login สำเร็จ
Response: {"success":true,"data":{"user":{...},"accessToken": "...", ...}}

🔄 3. เรียก Protected Endpoint ด้วย Access Token
✅ เรียก Protected Endpoint สำเร็จ
Response: {"success":true,"data":{"user":{...}}}

🔄 4. Refresh Access Token
✅ Refresh Token สำเร็จ
Response: {"success":true,"data":{"accessToken": "...", ...}}

🔄 5. Logout
✅ Logout สำเร็จ
Response: {"success":true,"message":"Logged out successfully"}

🔄 6. พยายามเรียก Protected Endpoint หลัง Logout (ควรล้มเหลว)
✅ Protected Endpoint ปฏิเสธการเข้าถึงตามที่คาดหวัง
Response: {"success":false,"error":{"message":"Token has been revoked"}}

========================================
✅ การทดสอบ Authentication Flow สำเร็จทั้งหมด
========================================
```

## Troubleshooting

### Common Issues

1. **Auth Service not accessible**
   - Ensure the auth service is running on port 3001
   - Check if there are any firewall blocking the connection

2. **Database connection errors**
   - Verify PostgreSQL is running on port 5432
   - Check the database credentials in `.env` file
   - Ensure the database schema is up to date with `npx prisma db push`

3. **Redis connection errors**
   - Ensure Redis is running on port 6379
   - Check Redis connection configuration in `.env` file

4. **Permission errors**
   - On Windows, you might need to run the scripts with appropriate permissions
   - On Unix-like systems, ensure the scripts have execute permissions: `chmod +x scripts/*.sh`

### Debug Mode

To get more detailed output, you can modify the scripts to include additional logging or use curl with the `-v` flag for verbose HTTP output.
