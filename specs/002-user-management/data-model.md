# Data Model Specification: User Management & Profiles

## Overview

This document defines the data models for the User Management & Profiles feature (FEAT-001), which manages user accounts, profiles, and role assignments within the system.

## Database Schema

### User Table

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    verified BOOLEAN DEFAULT false,
    google_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance optimization
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id);
```

### User Roles Table

```sql
CREATE TABLE user_roles (
    user_id UUID NOT NULL,
    role_id UUID NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

-- Indexes for performance optimization
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
```

### User Profiles Table (Extended Information)

```sql
CREATE TABLE user_profiles (
    user_id UUID PRIMARY KEY,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    avatar_url VARCHAR(500),
    date_of_birth DATE,
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance optimization
CREATE INDEX idx_user_profiles_name ON user_profiles(first_name, last_name);
```

## Prisma Schema Definition

```prisma
model User {
  id            String   @id @default(uuid())
  email         String   @unique
  passwordHash  String?  @map("password_hash")
  verified      Boolean  @default(false)
  googleId      String?  @unique @map("google_id")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  // Relations
  profile       UserProfile?
  roles         UserRole[]
  creditAccount CreditAccount?
  usageLogs     UsageLog[]

  @@index([email])
  @@index([googleId])
  @@map("users")
}

model UserProfile {
  userId      String   @id @map("user_id")
  firstName   String?  @map("first_name")
  lastName    String?  @map("last_name")
  phone       String?
  avatarUrl   String?  @map("avatar_url")
  dateOfBirth DateTime? @map("date_of_birth") @db.Date
  timezone    String   @default("UTC")
  language    String   @default("en")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Relations
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_profiles")
}

model UserRole {
  userId    String   @map("user_id")
  roleId    String   @map("role_id")
  assignedAt DateTime @default(now()) @map("assigned_at")

  // Relations
  user      User @relation(fields: [userId], references: [id], onDelete: Cascade)
  role      Role @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@id([userId, roleId])
  @@index([userId])
  @@index([roleId])
  @@map("user_roles")
}
```

## Entity Relationships

### User Entity

- **Primary Key**: id (UUID)
- **Unique Fields**: email, googleId
- **Indexes**: email, googleId
- **Relations**:
  - One-to-one with UserProfile
  - One-to-many with UserRole
  - One-to-one with CreditAccount (optional)
  - One-to-many with UsageLog

### UserProfile Entity

- **Primary Key**: userId (UUID, foreign key to User)
- **Relations**:
  - Belongs to User (one-to-one)

### UserRole Entity

- **Composite Primary Key**: userId + roleId
- **Foreign Keys**: userId (references User), roleId (references Role)
- **Relations**:
  - Belongs to User (many-to-one)
  - Belongs to Role (many-to-one)

## Data Validation Rules

### User Entity Validation

- **email**: Must be a valid email format, unique across all users
- **passwordHash**: Must be hashed using bcrypt or argon2 algorithm
- **verified**: Boolean flag for email verification status
- **googleId**: Optional, must be unique if present

### UserProfile Entity Validation

- **firstName**: Maximum 100 characters, optional
- **lastName**: Maximum 100 characters, optional
- **phone**: Must match international phone format if provided
- **avatarUrl**: Must be a valid URL if provided
- **dateOfBirth**: Must be a valid date in the past
- **timezone**: Must be a valid timezone identifier
- **language**: Must be a valid ISO 639-1 language code

### UserRole Entity Validation

- **userId**: Must reference an existing user
- **roleId**: Must reference an existing role
- **assignedAt**: Automatically set to current timestamp

## Security Considerations

### Password Security

- Passwords must be hashed using industry-standard algorithms
- Salt must be unique for each password hash
- Password hashes must be stored securely in the database

### Data Privacy

- Personal information must be encrypted at rest
- Access to user data must be controlled by role-based permissions
- Audit logs must track all access to personal information

### Data Integrity

- Foreign key constraints must be enforced
- Cascade operations must be carefully considered
- Data validation must occur at both application and database levels

## Performance Optimization

### Indexing Strategy

- Primary key indexes on all tables
- Unique indexes on email and googleId fields
- Composite indexes on frequently queried field combinations
- Regular index maintenance and monitoring

### Query Optimization

- Use appropriate join types for complex queries
- Implement query result caching where appropriate
- Optimize frequently accessed user profile data
- Consider database partitioning for large user datasets

## Migration Strategy

### Initial Migration

```sql
-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    verified BOOLEAN DEFAULT false,
    google_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_profiles table
CREATE TABLE user_profiles (
    user_id UUID PRIMARY KEY,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    avatar_url VARCHAR(500),
    date_of_birth DATE,
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create user_roles table
CREATE TABLE user_roles (
    user_id UUID NOT NULL,
    role_id UUID NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);
```

### Future Schema Changes

- All schema changes must be backward compatible
- Use database migrations for all structural changes
- Test migrations thoroughly before production deployment
- Maintain rollback procedures for all migrations

## Cross-References

- [User Management Specification](spec.md)
- [Access Control & Permissions](../003-access-control/spec.md)
- [API Specification](contracts/api-spec.json)
- [User Authentication & Authorization](../001-user-authentication/spec.md)
