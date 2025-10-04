#!/bin/bash

# สคริปต์ทดสอบ Authentication Flow
# สำหรับทดสอบการทำงานของระบบ Authentication ของ Smart AI Hub

# กำหนดค่า Base URL ของ Auth Service
BASE_URL="http://localhost:3001"
API_BASE="$BASE_URL/api/auth"

# กำหนดสีสำหรับแสดงผล
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ฟังก์ชันสำหรับแสดงผลลัพธ์
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

print_step() {
    echo -e "\n${YELLOW}🔄 $1${NC}"
}

# สร้างตัวแปรสำหรับเก็บข้อมูล
USER_EMAIL="testuser$(date +%s)@example.com"
USER_PASSWORD="TestPassword123!"
ACCESS_TOKEN=""
REFRESH_TOKEN=""

# ฟังก์ชันสำหรับตรวจสอบว่า Auth Service ทำงานอยู่หรือไม่
check_service() {
    print_step "ตรวจสอบสถานะ Auth Service..."
    
    response=$(curl -s "$BASE_URL/health")
    
    # ตรวจสอบว่า response มีคำว่า "running" หรือไม่
    if echo "$response" | grep -q "running"; then
        print_success "Auth Service ทำงานอยู่"
        echo "Response: $response"
        return 0
    else
        print_error "Auth Service ไม่สามารถเข้าถึงได้"
        print_info "กรุณาตรวจสอบว่า Auth Service กำลังทำงานอยู่ที่ $BASE_URL"
        echo "Response: $response"
        exit 1
    fi
}

# ฟังก์ชันสำหรับ Register ผู้ใช้ใหม่
register_user() {
    print_step "1. Register ผู้ใช้ใหม่"
    
    response=$(curl -s -X POST "$API_BASE/register" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"$USER_EMAIL\",
            \"password\": \"$USER_PASSWORD\"
        }")
    
    # ตรวจสอบว่า response มีคำว่า "success":true หรือ "Registration successful" หรือไม่
    if echo "$response" | grep -q '"success":true\|"Registration successful"'; then
        print_success "Register สำเร็จ"
        echo "Response: $response"
        
        # ดึง tokens จาก response โดยใช้ node
        ACCESS_TOKEN=$(echo "$response" | node -e "console.log(JSON.parse(require('fs').readFileSync(0, 'utf8')).data.token || JSON.parse(require('fs').readFileSync(0, 'utf8')).data.accessToken)")
        REFRESH_TOKEN=$(echo "$response" | node -e "console.log(JSON.parse(require('fs').readFileSync(0, 'utf8')).data.refreshToken)")
        
        print_info "Email: $USER_EMAIL"
        return 0
    else
        print_error "Register ล้มเหลว"
        echo "Response: $response"
        return 1
    fi
}

# ฟังก์ชันสำหรับ Login
login_user() {
    print_step "2. Login และเก็บ tokens"
    
    response=$(curl -s -X POST "$API_BASE/login" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"$USER_EMAIL\",
            \"password\": \"$USER_PASSWORD\"
        }")
    
    # ตรวจสอบว่า response มีคำว่า "success":true หรือ "Login successful" หรือไม่
    if echo "$response" | grep -q '"success":true\|"Login successful"'; then
        print_success "Login สำเร็จ"
        echo "Response: $response"
        
        # ดึง tokens จาก response โดยใช้ node
        ACCESS_TOKEN=$(echo "$response" | node -e "console.log(JSON.parse(require('fs').readFileSync(0, 'utf8')).data.accessToken)")
        REFRESH_TOKEN=$(echo "$response" | node -e "console.log(JSON.parse(require('fs').readFileSync(0, 'utf8')).data.refreshToken)")
        
        print_info "Access Token: ${ACCESS_TOKEN:0:20}..."
        print_info "Refresh Token: ${REFRESH_TOKEN:0:20}..."
        return 0
    else
        print_error "Login ล้มเหลว"
        echo "Response: $response"
        return 1
    fi
}

# ฟังก์ชันสำหรับเรียก Protected Endpoint
call_protected_endpoint() {
    print_step "3. เรียก Protected Endpoint ด้วย Access Token"
    
    response=$(curl -s -X GET "$API_BASE/me" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    
    # ตรวจสอบว่า response มีคำว่า "success":true หรือไม่
    if echo "$response" | grep -q '"success":true'; then
        print_success "เรียก Protected Endpoint สำเร็จ"
        echo "Response: $response"
        return 0
    else
        print_error "เรียก Protected Endpoint ล้มเหลว"
        echo "Response: $response"
        return 1
    fi
}

# ฟังก์ชันสำหรับ Refresh Access Token
refresh_access_token() {
    print_step "4. Refresh Access Token"
    
    response=$(curl -s -X POST "$API_BASE/refresh" \
        -H "Content-Type: application/json" \
        -d "{
            \"refreshToken\": \"$REFRESH_TOKEN\"
        }")
    
    # ตรวจสอบว่า response มีคำว่า "success":true หรือ "Token refreshed successfully" หรือไม่
    if echo "$response" | grep -q '"success":true\|"Token refreshed successfully"'; then
        print_success "Refresh Token สำเร็จ"
        echo "Response: $response"
        
        # ดึง tokens ใหม่จาก response โดยใช้ node
        ACCESS_TOKEN=$(echo "$response" | node -e "console.log(JSON.parse(require('fs').readFileSync(0, 'utf8')).data.accessToken)")
        REFRESH_TOKEN=$(echo "$response" | node -e "console.log(JSON.parse(require('fs').readFileSync(0, 'utf8')).data.refreshToken)")
        
        print_info "New Access Token: ${ACCESS_TOKEN:0:20}..."
        print_info "New Refresh Token: ${REFRESH_TOKEN:0:20}..."
        return 0
    else
        print_error "Refresh Token ล้มเหลว"
        echo "Response: $response"
        return 1
    fi
}

# ฟังก์ชันสำหรับ Logout
logout_user() {
    print_step "5. Logout"
    
    response=$(curl -s -X POST "$API_BASE/logout" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"refreshToken\": \"$REFRESH_TOKEN\"
        }")
    
    # ตรวจสอบว่า response มีคำว่า "success":true หรือ "Logged out successfully" หรือไม่
    if echo "$response" | grep -q '"success":true\|"Logged out successfully"'; then
        print_success "Logout สำเร็จ"
        echo "Response: $response"
        return 0
    else
        print_error "Logout ล้มเหลว"
        echo "Response: $response"
        return 1
    fi
}

# ฟังก์ชันสำหรับพยายามเรียก Protected Endpoint หลัง Logout
call_protected_after_logout() {
    print_step "6. พยายามเรียก Protected Endpoint หลัง Logout (ควรล้มเหลว)"
    
    response=$(curl -s -X GET "$API_BASE/me" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    
    # ตรวจสอบว่า response มีคำว่า "success":false หรือ "Unauthorized" หรือไม่
    if echo "$response" | grep -q '"success":false\|"Unauthorized"\|"invalid token"\|"revoked"'; then
        print_success "Protected Endpoint ปฏิเสธการเข้าถึงตามที่คาดหวัง"
        echo "Response: $response"
        return 0
    else
        print_error "Protected Endpoint ไม่ปฏิเสธการเข้าถึง"
        echo "Response: $response"
        return 1
    fi
}

# เริ่มการทำงานของสคริปต์
echo "========================================"
echo "🧪 ทดสอบ Authentication Flow"
echo "========================================"

# ตรวจสอบว่า curl ติดตั้งอยู่หรือไม่
if ! command -v curl &> /dev/null; then
    print_error "curl ไม่ได้ติดตั้งอยู่ กรุณาติดตั้งก่อนใช้งานสคริปต์นี้"
    exit 1
fi

# ตรวจสอบว่า node ติดตั้งอยู่หรือไม่ (สำหรับ parsing JSON)
if ! command -v node &> /dev/null; then
    print_error "node ไม่ได้ติดตั้งอยู่ กรุณาติดตั้งก่อนใช้งานสคริปต์นี้"
    exit 1
fi

# เรียกฟังก์ชันต่างๆ ตามลำดับ
check_service || exit 1
register_user || exit 1
login_user || exit 1
call_protected_endpoint || exit 1
refresh_access_token || exit 1
logout_user || exit 1
call_protected_after_logout || exit 1

echo -e "\n${GREEN}========================================"
echo "✅ การทดสอบ Authentication Flow สำเร็จทั้งหมด"
echo "========================================${NC}"