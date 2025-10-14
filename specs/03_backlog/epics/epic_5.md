# Epic 5: Frontend Development (Sprint 4-5)

## E5.1: React App Setup

**Story Points**: 5
**Priority**: P1 (High)
**Status**: 🔄 In Progress (Started 2025-10-04)
**Dependencies**: None
**Risk Level**: Low
- **links_to_architecture**:
  - Service: `../../02_architecture/services/api_gateway.md`

**Acceptance Criteria**:

- [x] React 18+ with TypeScript
- [x] Vite build tool configuration
- [ ] Material-UI component library
- [ ] Redux Toolkit state management
- [ ] React Router navigation
- [ ] Responsive layout foundation

**Current Progress**:

- ✅ Vite + React + TypeScript setup complete
- ✅ Development server running on port 5173
- ✅ API Gateway development server also running
- 🔄 Installing additional dependencies (MUI, Redux, etc.)

**Initial Setup**:

```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install @mui/material @emotion/react @emotion/styled
npm install @reduxjs/toolkit react-redux
npm install react-router-dom
npm install react-hook-form zod @hookform/resolvers
```

**Project Structure**:

```
frontend/src/
├── components/
│   ├── common/          # Reusable components
│   ├── auth/            # Auth-related
│   └── layout/          # Layout components
├── pages/               # Route components
├── store/               # Redux store
├── services/            # API services
├── hooks/               # Custom hooks
├── utils/               # Utilities
├── types/               # TypeScript types
└── theme/               # MUI theme
```

**Theme Configuration**:

```typescript
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
  },
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
  },
});
```

---

## E5.2: Authentication UI

**Story Points**: 5
**Priority**: P1 (High)
**Status**: Not Started
**Dependencies**: E2.1, E5.1
- **links_to_architecture**:
  - Service: `../../02_architecture/services/api_gateway.md`, `../../02_architecture/services/auth_service.md`
  - Data Models: `../../02_architecture/data_models/user.md`

**Acceptance Criteria**:

- [ ] Login page with form validation
- [ ] Registration page
- [ ] Email verification UI
- [ ] Password reset flow
- [ ] Google OAuth button
- [ ] Protected route wrapper

**Components**:

```typescript
// Login Form
- [ ] Email and password fields
- [ ] Validation with react-hook-form + zod
- [ ] Remember me checkbox
- [ ] Forgot password link
- [ ] Loading states
- [ ] Error display

// Registration Form
- [ ] Email, password, confirm password
- [ ] Terms acceptance checkbox
- [ ] Validation rules
- [ ] Success message

// Protected Route
- [ ] Check authentication status
- [ ] Redirect to login if not authenticated
- [ ] Show loading while checking
```

---

## E5.3: Dashboard UI

**Story Points**: 8
**Priority**: P1 (High)
**Status**: Not Started
**Dependencies**: E5.1, E5.2
- **links_to_architecture**:
  - Service: `../../02_architecture/services/api_gateway.md`, `../../02_architecture/services/core_service.md`
  - Data Models: `../../02_architecture/data_models/credit_account.md`, `../../02_architecture/data_models/credit_transaction.md`, `../../02_architecture/data_models/usage_log.md`

**Acceptance Criteria**:

- [ ] Dashboard layout with navigation
- [ ] Credit balance widget
- [ ] Usage statistics charts
- [ ] Available services grid
- [ ] Recent activity table

**Dashboard Widgets**:

- Credit Balance Card (real-time)
- Usage Chart (last 30 days)
- Quick Actions (Top-up, View History)
- Service Status Indicators
- Recent Transactions Table

---

## E5.4: Admin Interface

**Story Points**: 8
**Priority**: P2 (Medium)
**Status**: Not Started
**Dependencies**: E5.1, E2.3 (RBAC)
- **links_to_architecture**:
  - Service: `../../02_architecture/services/api_gateway.md`, `../../02_architecture/services/core_service.md`
  - Data Models: `../../02_architecture/data_models/user.md`, `../../02_architecture/data_models/role.md`, `../../02_architecture/data_models/permission.md`, `../../02_architecture/data_models/credit_account.md`

**Acceptance Criteria**:

- [ ] Admin dashboard with metrics
- [ ] User management table
- [ ] Credit management interface
- [ ] System monitoring panels
- [ ] Audit log viewer