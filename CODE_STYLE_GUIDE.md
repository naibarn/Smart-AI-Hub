# Smart AI Hub Code Style Guide

[![License](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

## Table of Contents

- [Overview](#overview)
- [General Principles](#general-principles)
- [TypeScript/JavaScript Standards](#typescriptjavascript-standards)
- [React/Component Standards](#reactcomponent-standards)
- [CSS/Styling Standards](#cssstyling-standards)
- [File and Directory Structure](#file-and-directory-structure)
- [Naming Conventions](#naming-conventions)
- [Code Organization](#code-organization)
- [Error Handling](#error-handling)
- [Testing Standards](#testing-standards)
- [Documentation Standards](#documentation-standards)
- [Git Standards](#git-standards)
- [Tool Configuration](#tool-configuration)

## Overview

This document outlines the coding standards and best practices for the Smart AI Hub project. Consistent code style improves readability, maintainability, and collaboration among team members.

### Philosophy

- **Readability counts**: Code is read more often than it's written
- **Consistency is key**: Follow established patterns throughout the codebase
- **Simplicity over complexity**: Choose the simplest solution that works
- **Explicit over implicit**: Make intentions clear in the code

## General Principles

### 1. Keep It Simple

- Write code that is easy to understand
- Avoid clever or obscure solutions
- Prefer standard language features over complex abstractions

### 2. Be Consistent

- Follow the established patterns in the codebase
- Use the same style for similar constructs
- Keep formatting consistent across all files

### 3. Write Self-Documenting Code

- Use meaningful names for variables, functions, and classes
- Structure code to be self-explanatory
- Add comments only when necessary to explain complex logic

### 4. Consider Performance

- Write efficient code without sacrificing readability
- Avoid premature optimization
- Consider the impact on memory and CPU usage

## TypeScript/JavaScript Standards

### Type Safety

Always use TypeScript with strict type checking:

```typescript
// Good: Explicit types
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: Date;
}

async function getUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } });
}

// Bad: Using 'any'
async function getUserById(id: any): Promise<any> {
  return prisma.user.findUnique({ where: { id } });
}
```

### Variables and Constants

```typescript
// Good: Use const for variables that won't be reassigned
const API_BASE_URL = 'https://api.smartaihub.com';
const MAX_RETRY_ATTEMPTS = 3;

// Good: Use let for variables that will be reassigned
let retryCount = 0;
let currentUser: User | null = null;

// Bad: Using var
var apiUrl = 'https://api.smartaihub.com';
var maxRetries = 3;
```

### Functions

```typescript
// Good: Arrow function for simple operations
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Good: Function declaration for complex functions
async function createUser(userData: CreateUserRequest): Promise<User> {
  try {
    const hashedPassword = await hashPassword(userData.password);

    const user = await prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
      },
    });

    return user;
  } catch (error) {
    throw new Error(`Failed to create user: ${error.message}`);
  }
}

// Good: Async/await for asynchronous operations
async function fetchUserData(userId: string): Promise<User> {
  const response = await fetch(`/api/users/${userId}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch user: ${response.statusText}`);
  }

  return response.json();
}

// Bad: Mixing async/await with .then() chains
async function fetchUserData(userId: string): Promise<User> {
  return fetch(`/api/users/${userId}`).then((response) => {
    if (!response.ok) {
      throw new Error(`Failed to fetch user: ${response.statusText}`);
    }
    return response.json();
  });
}
```

### Classes and Interfaces

```typescript
// Good: Clear class with proper typing
class UserService {
  private readonly userRepository: UserRepository;
  private readonly emailService: EmailService;

  constructor(userRepository: UserRepository, emailService: EmailService) {
    this.userRepository = userRepository;
    this.emailService = emailService;
  }

  async createUser(userData: CreateUserRequest): Promise<User> {
    const user = await this.userRepository.create(userData);
    await this.emailService.sendWelcomeEmail(user.email);
    return user;
  }
}

// Good: Interface for object shapes
interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  preferences: UserPreferences;
}

// Bad: Using 'type' for object shapes when interface would be better
type UserProfile = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  preferences: UserPreferences;
};
```

### Error Handling

```typescript
// Good: Custom error classes
class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

class NotFoundError extends Error {
  constructor(resource: string, id?: string) {
    super(`${resource}${id ? ` with id ${id}` : ''} not found`);
    this.name = 'NotFoundError';
  }
}

// Good: Proper error handling with try-catch
async function updateUserProfile(userId: string, updates: Partial<User>): Promise<User> {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundError('User', userId);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updates,
    });

    return updatedUser;
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }

    logger.error('Failed to update user profile', { userId, error });
    throw new InternalServerError('Failed to update user profile');
  }
}

// Bad: Silent failures or generic error handling
async function updateUserProfile(userId: string, updates: Partial<User>): Promise<User> {
  try {
    return await prisma.user.update({
      where: { id: userId },
      data: updates,
    });
  } catch (error) {
    console.log('Something went wrong');
    return null;
  }
}
```

### Import/Export

```typescript
// Good: Named exports for utilities
export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const calculateAge = (birthDate: Date): number => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
};

// Good: Default export for main functionality
export default class UserService {
  // Class implementation
}

// Good: Import organization
import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { User, CreateUserRequest } from '../types/user';
import { ValidationError, NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';
import { formatDate } from '../utils/date';
```

## React/Component Standards

### Functional Components

```typescript
// Good: Functional component with proper typing
interface UserProfileProps {
  userId: string;
  onUpdate?: (user: User) => void;
  className?: string;
}

const UserProfile: React.FC<UserProfileProps> = ({
  userId,
  onUpdate,
  className
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const userData = await userService.getUserById(userId);
        setUser(userData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  const handleUpdate = useCallback(async (updates: Partial<User>) => {
    if (!user) return;

    try {
      const updatedUser = await userService.updateUser(user.id, updates);
      setUser(updatedUser);
      onUpdate?.(updatedUser);
    } catch (err) {
      setError(err.message);
    }
  }, [user, onUpdate]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!user) return <div>User not found</div>;

  return (
    <div className={`user-profile ${className || ''}`}>
      <h2>{user.firstName} {user.lastName}</h2>
      <p>{user.email}</p>
      <button onClick={() => handleUpdate({ lastActiveAt: new Date() })}>
        Update Last Active
      </button>
    </div>
  );
};

export default UserProfile;
```

### Custom Hooks

```typescript
// Good: Custom hook with proper typing
interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

function useApi<T>(url: string): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// Usage
const UserProfile: React.FC<{ userId: string }> = ({ userId }) => {
  const { data: user, loading, error, refetch } = useApi<User>(`/api/users/${userId}`);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!user) return <div>User not found</div>;

  return (
    <div>
      <h2>{user.firstName} {user.lastName}</h2>
      <button onClick={refetch}>Refresh</button>
    </div>
  );
};
```

### Props and State

```typescript
// Good: Destructure props and state
const UserProfile: React.FC<UserProfileProps> = ({ userId, onUpdate, className }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Component logic
};

// Bad: Accessing props directly
const UserProfile: React.FC<UserProfileProps> = (props) => {
  const [user, setUser] = useState<User | null>(null);

  // Using props.userId instead of destructured userId
  useEffect(() => {
    fetchUser(props.userId);
  }, [props.userId]);
};
```

## CSS/Styling Standards

### CSS Modules

```css
/* components/UserProfile/UserProfile.module.css */
.container {
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
}

.title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
}

.button {
  padding: 0.5rem 1rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.button:hover {
  background-color: #0056b3;
}

.button:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}
```

```typescript
// Using CSS Modules
import styles from './UserProfile.module.css';

const UserProfile: React.FC<UserProfileProps> = ({ userId }) => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>User Profile</h1>
      </div>
      <button className={styles.button}>
        Update Profile
      </button>
    </div>
  );
};
```

### Styled Components

```typescript
// Using styled-components
import styled from 'styled-components';

const Container = styled.div`
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 0.5rem 1rem;
  background-color: ${props =>
    props.variant === 'secondary' ? '#6c757d' : '#007bff'
  };
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${props =>
      props.variant === 'secondary' ? '#545b62' : '#0056b3'
    };
  }

  &:disabled {
    background-color: #6c757d;
    cursor: not-allowed;
  }
`;

const UserProfile: React.FC<UserProfileProps> = ({ userId }) => {
  return (
    <Container>
      <Header>
        <Title>User Profile</Title>
      </Header>
      <Button variant="primary">
        Update Profile
      </Button>
    </Container>
  );
};
```

## File and Directory Structure

### Backend Structure

```
packages/service-name/
├── src/
│   ├── controllers/         # Route controllers
│   │   ├── user.controller.ts
│   │   └── auth.controller.ts
│   ├── middleware/          # Custom middleware
│   │   ├── auth.middleware.ts
│   │   └── validation.middleware.ts
│   ├── models/              # Data models
│   │   ├── user.model.ts
│   │   └── index.ts
│   ├── routes/              # Route definitions
│   │   ├── user.routes.ts
│   │   ├── auth.routes.ts
│   │   └── index.ts
│   ├── services/            # Business logic
│   │   ├── user.service.ts
│   │   └── auth.service.ts
│   ├── utils/               # Utility functions
│   │   ├── password.util.ts
│   │   ├── validation.util.ts
│   │   └── index.ts
│   ├── types/               # TypeScript types
│   │   ├── user.types.ts
│   │   ├── auth.types.ts
│   │   └── index.ts
│   ├── config/              # Configuration
│   │   ├── database.config.ts
│   │   └── index.ts
│   └── index.ts             # Service entry point
├── tests/                   # Test files
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── package.json
├── tsconfig.json
└── README.md
```

### Frontend Structure

```
packages/frontend/src/
├── components/              # Reusable components
│   ├── common/              # Common components
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.module.css
│   │   │   ├── Button.test.tsx
│   │   │   └── index.ts
│   │   └── Input/
│   ├── forms/               # Form components
│   └── layout/              # Layout components
├── pages/                   # Page components
│   ├── Dashboard/
│   │   ├── Dashboard.tsx
│   │   ├── Dashboard.module.css
│   │   ├── Dashboard.test.tsx
│   │   └── index.ts
│   └── Profile/
├── services/                # API services
│   ├── api.service.ts
│   ├── user.service.ts
│   └── index.ts
├── hooks/                   # Custom React hooks
│   ├── useApi.ts
│   ├── useAuth.ts
│   └── index.ts
├── contexts/                # React contexts
│   ├── AuthContext.tsx
│   ├── ThemeContext.tsx
│   └── index.ts
├── utils/                   # Utility functions
│   ├── date.util.ts
│   ├── validation.util.ts
│   └── index.ts
├── types/                   # TypeScript types
│   ├── user.types.ts
│   ├── api.types.ts
│   └── index.ts
├── styles/                  # Global styles
│   ├── globals.css
│   └── variables.css
└── App.tsx
```

## Naming Conventions

### Files and Directories

```typescript
// Good: kebab-case for files
user - profile.component.tsx;
user.service.ts;
user - profile.module.css;
api.util.ts;

// Bad: inconsistent naming
UserProfile.tsx;
userservice.ts;
UserProfile.css;
apiUtils.ts;
```

### Variables and Functions

```typescript
// Good: camelCase for variables and functions
const userName = 'john_doe';
const getUserProfile = () => {};
const handleSubmit = () => {};
const isValidEmail = () => {};

// Bad: inconsistent naming
const user_name = 'john_doe';
const GetUserProfile = () => {};
const handle_submit = () => {};
const is_valid_email = () => {};
```

### Classes and Interfaces

```typescript
// Good: PascalCase for classes and interfaces
class UserService {}
interface UserProfile {}
type UserRole = 'admin' | 'user';

// Bad: inconsistent naming
class userService {}
interface userProfile {}
type userRole = 'admin' | 'user';
```

### Constants

```typescript
// Good: UPPER_SNAKE_CASE for constants
const API_BASE_URL = 'https://api.smartaihub.com';
const MAX_RETRY_ATTEMPTS = 3;
const DEFAULT_PAGE_SIZE = 20;

// Bad: inconsistent naming
const apiBaseUrl = 'https://api.smartaihub.com';
const maxRetryAttempts = 3;
const defaultPageSize = 20;
```

### Enums

```typescript
// Good: PascalCase for enum names and values
enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MODERATOR = 'moderator',
}

enum HttpStatus {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500,
}

// Bad: inconsistent naming
enum userRole {
  admin = 'admin',
  user = 'user',
  moderator = 'moderator',
}
```

## Code Organization

### Import Order

```typescript
// 1. Node.js built-in modules
import { createServer } from 'http';
import { join } from 'path';

// 2. External libraries
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

// 3. Internal modules (relative imports)
import { User } from '../types/user.types';
import { ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';
```

### Export Order

```typescript
// 1. Named exports
export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const calculateAge = (birthDate: Date): number => {
  // Implementation
};

// 2. Default export
export default class UserService {
  // Implementation
}
```

### Function Organization

```typescript
// Good: Group related functions together
class UserService {
  // Public methods
  async createUser(userData: CreateUserRequest): Promise<User> {
    // Implementation
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    // Implementation
  }

  async deleteUser(id: string): Promise<void> {
    // Implementation
  }

  // Private methods
  private async hashPassword(password: string): Promise<string> {
    // Implementation
  }

  private validateUserData(userData: CreateUserRequest): void {
    // Implementation
  }
}
```

## Error Handling

### Custom Error Classes

```typescript
// Good: Custom error classes
class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

class NotFoundError extends Error {
  constructor(resource: string, id?: string) {
    super(`${resource}${id ? ` with id ${id}` : ''} not found`);
    this.name = 'NotFoundError';
  }
}

class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}
```

### Error Handling Patterns

```typescript
// Good: Centralized error handling
export const errorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', { error, url: req.url });

  if (error instanceof ValidationError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message,
        field: error.field,
      },
    });
  }

  if (error instanceof NotFoundError) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: error.message,
      },
    });
  }

  if (error instanceof UnauthorizedError) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: error.message,
      },
    });
  }

  // Default error response
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    },
  });
};
```

## Testing Standards

### Test File Organization

```typescript
// Good: Test file organization
describe('UserService', () => {
  describe('createUser', () => {
    it('should create a user with valid data', async () => {
      // Test implementation
    });

    it('should throw validation error for invalid email', async () => {
      // Test implementation
    });

    it('should throw conflict error for existing email', async () => {
      // Test implementation
    });
  });

  describe('updateUser', () => {
    // Update tests
  });
});
```

### Test Naming

```typescript
// Good: Descriptive test names
it('should create a user with hashed password', async () => {
  // Test implementation
});

it('should throw ValidationError when email is invalid', async () => {
  // Test implementation
});

it('should return null when user is not found', async () => {
  // Test implementation
});

// Bad: Vague test names
it('should work', async () => {
  // Test implementation
});

it('should fail', async () => {
  // Test implementation
});
```

## Documentation Standards

### JSDoc Comments

````typescript
/**
 * Creates a new user in the system
 * @param userData - The user data to create
 * @param userData.email - User's email address
 * @param userData.password - User's password (will be hashed)
 * @param userData.firstName - User's first name
 * @param userData.lastName - User's last name
 * @returns Promise that resolves to the created user
 * @throws {ValidationError} When user data is invalid
 * @throws {ConflictError} When email already exists
 * @example
 * ```typescript
 * const user = await createUser({
 *   email: 'user@example.com',
 *   password: 'Password123!',
 *   firstName: 'John',
 *   lastName: 'Doe'
 * });
 * ```
 */
async function createUser(userData: CreateUserRequest): Promise<User> {
  // Implementation
}
````

### Component Documentation

````typescript
/**
 * UserProfile component displays user information and allows editing
 * @component
 * @example
 * ```tsx
 * <UserProfile
 *   userId="user-123"
 *   onUpdate={(user) => console.log('User updated:', user)}
 *   className="custom-profile"
 * />
 * ```
 */
const UserProfile: React.FC<UserProfileProps> = ({ userId, onUpdate, className }) => {
  // Component implementation
};
````

## Git Standards

### Commit Message Format

```
type(scope): description

[optional body]

[optional footer]
```

#### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

#### Examples

```
feat(auth): add OAuth provider support

Implement OAuth authentication with support for Google and GitHub.
Users can now authenticate using their existing accounts from these
providers.

Closes #123
```

```
fix(api): resolve user profile update issue

Fix issue where user profile updates were not being saved due to
missing validation step in the API endpoint.
```

```
docs(readme): update installation instructions

Add prerequisites section and update Node.js version requirement
from 16.x to 18.x.
```

## Tool Configuration

### ESLint Configuration

```json
{
  "extends": ["@typescript-eslint/recommended", "prettier"],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-explicit-any": "warn",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

### Prettier Configuration

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

---

This code style guide is a living document that evolves with the project. For questions or suggestions, please open an issue or contact the development team.
