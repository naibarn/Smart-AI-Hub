# 🚀 Kilo Code Prompt - Smart AI Hub Next Steps (Refactored)

## 📋 สถานะปัจจุบันจาก Backlog.md

### ✅ สิ่งที่เสร็จแล้ว (84/218 points, 38.5%):

- Database setup และ schema implementation
- Basic authentication API (login, register, JWT)
- Email verification system พร้อม OTP
- Password reset flow
- Google OAuth integration
- Role-Based Access Control (RBAC)
- Credit account system พร้อม transaction history
- Promotional code system
- MCP Server Foundation (WebSocket, authentication)
- Frontend development server setup (Vite + React)
- API Gateway development server

### 🔄 สิ่งที่กำลังทำอยู่ (Sprint 4):

- OpenAI SDK integration (E4.2) - 🔄 IN PROGRESS
- Frontend React app setup (E5.1) - 🔄 IN PROGRESS

### 📋 สิ่งที่ต้องทำถัดไป (เรียงตามความสำคัญสำหรับ local development):

---

## 🎯 **Priority 1: Complete OpenAI Integration (E4.2)**

### **Task 1.1: สร้าง OpenAI Integration ใน MCP Server**

```
@kilo complete OpenAI integration in Smart AI Hub MCP server with:

OpenAI SDK Integration:
- Install and configure OpenAI SDK in packages/mcp-server
- Support for GPT-3.5-turbo and GPT-4 models
- API key configuration from environment variables
- Error handling for API failures

Streaming Response Implementation:
- Implement streaming response handling for real-time chat
- Stream chunks back to WebSocket client
- Handle connection drops during streaming
- Buffer management for smooth streaming

Token Usage Tracking:
- Count input and output tokens accurately
- Calculate credit cost per request
- Log usage statistics for analytics
- Handle token limits and warnings

Credit Deduction System:
- Pre-request credit validation
- Atomic credit deduction after completion
- Handle insufficient credits gracefully
- Transaction logging for audit

Error Handling:
- Rate limit detection and handling (429 status)
- Timeout handling for long requests
- Invalid API key handling
- Model availability checking

Integration Points:
- Connect to existing MCP server foundation
- Use existing credit service
- Integrate with logging service
- Maintain WebSocket message format

Focus on local development testing with proper error handling and logging.
```

---

## 🎯 **Priority 2: Complete Frontend Authentication UI (E5.2)**

### **Task 2.1: สร้าง Authentication UI Components**

```
@kilo create authentication UI components for Smart AI Hub frontend with:

Login Page Implementation:
- Email and password form with validation
- Remember me checkbox functionality
- Forgot password link integration
- Google OAuth login button
- Loading states and error handling
- Redirect after successful login

Registration Page:
- Registration form with email/password/confirm password
- Terms and conditions checkbox
- Form validation with error messages
- Success state with email verification notice
- Google OAuth registration option

Password Reset Flow:
- Forgot password form with email input
- Password reset form with new password/confirm
- Token validation from URL parameters
- Password strength indicator
- Success message with login redirect

Authentication Context:
- React context for auth state management
- Token storage in httpOnly cookies
- Auto-refresh token mechanism
- Logout functionality
- User session management

Protected Routes:
- HOC or wrapper component for route protection
- Redirect to login for unauthenticated users
- Loading state while checking authentication
- Role-based access control integration

API Integration:
- Connect to existing auth-service endpoints
- Handle API errors gracefully
- Show appropriate user feedback
- Retry mechanism for failed requests

Focus on local development with responsive design and user-friendly error messages.
```

---

## 🎯 **Priority 3: Complete Dashboard UI (E5.3)**

### **Task 3.1: สร้าง Dashboard Layout และ Components**

```
@kilo create dashboard UI for Smart AI Hub with:

Dashboard Layout:
- Responsive sidebar navigation
- Header with user profile and notifications
- Main content area with grid layout
- Mobile-friendly drawer navigation
- Dark/light theme toggle

Credit Balance Widget:
- Real-time credit balance display
- Credit usage chart (last 7/30 days)
- Quick top-up button
- Credit transaction history preview
- Low credit warnings

Usage Statistics:
- API usage charts with Recharts
- Model usage breakdown
- Cost analysis per model
- Usage trends over time
- Export functionality

Available Services Grid:
- AI model selection cards (GPT-3.5, GPT-4, Claude)
- Model information and pricing
- Quick access buttons
- Service status indicators
- Model comparison features

Recent Activity Table:
- Recent API calls with timestamps
- Token usage per request
- Cost per request
- Filter and search functionality
- Pagination for large datasets

Quick Actions Panel:
- Top-up credits button
- View full history link
- API documentation link
- Support contact
- Settings shortcut

State Management:
- Redux Toolkit setup for dashboard state
- API integration with RTK Query
- Caching for performance
- Error boundary implementation
- Loading states for all components

Focus on local development with smooth animations and intuitive user experience.
```

---

## 🎯 **Priority 4: Add Claude Integration (E4.3)**

### **Task 4.1: สร้าง Claude Integration ใน MCP Server**

```
@kilo create Claude integration for Smart AI Hub MCP server with:

Anthropic SDK Integration:
- Install and configure Anthropic SDK
- Support for Claude-3 models (Sonnet, Haiku, Opus)
- API key configuration from environment
- Error handling for API failures

Provider Abstraction:
- Create unified interface for OpenAI and Claude
- Provider selection logic (auto, openai, claude)
- Load balancing between providers
- Fallback mechanism when provider fails

Model Management:
- Model configuration and capabilities
- Cost calculation per model
- Token counting for Claude
- Model-specific parameters

Streaming Support:
- Implement streaming for Claude responses
- Unified streaming interface across providers
- Handle different response formats
- Error recovery during streaming

Integration with Existing Systems:
- Connect to existing credit service
- Use existing logging service
- Maintain WebSocket message format
- Integrate with provider manager

Testing:
- Mock Claude responses for testing
- Provider switching tests
- Error handling validation
- Performance comparison

Focus on local development testing with proper provider abstraction and error handling.
```

---

## 🎯 **Priority 5: Complete API Gateway Routing**

### **Task 5.1: สร้าง API Gateway Routing และ Middleware**

```
@kilo complete API Gateway routing for Smart AI Hub with:

Route Configuration:
- Proxy routes to auth-service (port 3001)
- Proxy routes to core-service (port 3002)
- WebSocket proxy to mcp-server (port 3003)
- Static file serving for frontend
- Health check endpoints

Authentication Middleware:
- JWT validation for protected routes
- Token refresh mechanism
- User context injection
- Role-based access control
- Session management

Error Handling:
- Centralized error handling middleware
- Proper HTTP status codes
- Error response formatting
- Logging for debugging
- User-friendly error messages

CORS Configuration:
- Configure CORS for frontend integration
- Support for multiple origins in development
- Credentials handling
- Preflight request handling

Rate Limiting:
- Basic rate limiting per IP
- User-based rate limiting
- Different limits for different endpoints
- Redis-based rate limit storage

Request Logging:
- Request/response logging
- Correlation ID tracking
- Performance metrics
- Error tracking

Focus on local development with proper routing and middleware configuration.
```

---

## 🎯 **Priority 6: Basic Testing Setup**

### **Task 6.1: สร้าง Basic Testing Framework**

```
@kilo create basic testing framework for Smart AI Hub with:

Backend Testing Setup:
- Jest configuration for all services
- Supertest for API testing
- Mock database for testing
- Test environment configuration
- Basic test coverage reporting

Frontend Testing Setup:
- React Testing Library configuration
- Component testing examples
- Mock API responses
- User interaction testing
- Accessibility testing

Integration Testing:
- API endpoint testing
- Authentication flow testing
- Credit system testing
- MCP server WebSocket testing

Test Scripts:
- Test scripts for each service
- Combined test runner
- Coverage reporting
- Test documentation

Focus on local development testing with critical path coverage.
```

---

## 📊 **Success Criteria สำหรับ Local Development**

### **Functional Requirements:**

- [ ] OpenAI integration working with streaming responses
- [ ] Claude integration working with provider switching
- [ ] Authentication UI complete with all flows
- [ ] Dashboard UI with real-time data
- [ ] API Gateway routing correctly to all services
- [ ] Basic testing framework operational

### **Quality Requirements:**

- [ ] Error handling implemented throughout
- [ ] Loading states for all async operations
- [ ] Responsive design working on mobile/desktop
- [ ] Console errors eliminated
- [ ] Basic test coverage for critical paths

### **Integration Requirements:**

- [ ] All services communicating correctly
- [ ] WebSocket connections stable
- [ ] Credit deduction working with AI requests
- [ ] Authentication flow end-to-end
- [ ] Real-time updates in dashboard

---

## 🚀 **Quick Start Commands สำหรับ Local Development**

```bash
# 1. Start database services
docker-compose up -d postgres redis

# 2. Run database migrations
cd packages/auth-service
npm run migrate:latest
npm run seed:run

# 3. Start all services (in separate terminals)
npm run dev:auth      # Auth Service (port 3001)
npm run dev:core      # Core Service (port 3002)
npm run dev:mcp       # MCP Server (port 3003)
npm run dev:gateway   # API Gateway (port 3000)
npm run dev:frontend  # Frontend (port 5173)

# 4. Test endpoints
curl http://localhost:3000/health  # API Gateway
curl http://localhost:3001/health  # Auth Service
curl http://localhost:3002/health  # Core Service
curl http://localhost:3003/health  # MCP Server

# 5. Run tests
npm run test        # All tests
npm run test:watch  # Watch mode
```

---

## 📋 **Implementation Priority Order สำหรับ Local Development**

1. **Today**: Complete OpenAI Integration (Task 1.1)
2. **Tomorrow**: Authentication UI Components (Task 2.1)
3. **Day 3**: Dashboard UI (Task 3.1)
4. **Day 4**: Claude Integration (Task 4.1)
5. **Day 5**: API Gateway Routing (Task 5.1)
6. **Day 6**: Basic Testing Setup (Task 6.1)

**🎊 เริ่มจาก Task 1.1 (OpenAI Integration) ได้เลย! ใช้ Kilo Code ตามคำสั่งข้างต้นเพื่อทำงานบน local PC ก่อน!**
