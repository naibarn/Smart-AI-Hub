# Contributing to Smart AI Hub

[![License](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

Thank you for your interest in contributing to Smart AI Hub! This document provides guidelines and information about how to contribute to this project.

## Table of Contents

- [Getting Started](#getting-started)
- [Code of Conduct](#code-of-conduct)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation Guidelines](#documentation-guidelines)
- [Issue Reporting](#issue-reporting)
- [Feature Requests](#feature-requests)
- [Community Guidelines](#community-guidelines)
- [Recognition](#recognition)

## Getting Started

### Prerequisites

Before you start contributing, make sure you have:

- Node.js (v18.x or later)
- npm (v9.x or later) or yarn (v1.22.x or later)
- Docker (v20.x or later)
- Git (v2.30 or later)
- A GitHub account

### Setting Up Your Development Environment

1. **Fork the repository**
   ```bash
   # Fork the repository on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/Smart-AI-Hub.git
   cd Smart-AI-Hub
   ```

2. **Add the upstream repository**
   ```bash
   git remote add upstream https://github.com/Smart-AI-Hub/Smart-AI-Hub.git
   ```

3. **Install dependencies**
   ```bash
   npm install
   npm run install:all
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Start the development environment**
   ```bash
   npm run dev
   ```

### Understanding the Project Structure

Take some time to familiarize yourself with the project structure:

```
Smart-AI-Hub/
├── packages/                    # Monorepo packages
│   ├── api-gateway/            # API Gateway service
│   ├── auth-service/           # Authentication service
│   ├── core-service/           # Core business logic
│   ├── mcp-server/             # MCP server
│   ├── frontend/               # Frontend application
│   ├── notification-service/   # Notification service
│   └── shared/                 # Shared utilities and types
├── docs/                       # Documentation
├── specs/                      # Project specifications
├── scripts/                    # Build and deployment scripts
├── tests/                      # Test files
└── .github/                    # GitHub workflows and templates
```

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for everyone, regardless of:

- Gender identity and expression
- Sexual orientation
- Disability
- Physical appearance
- Body size
- Race
- Age
- Religion
- Experience level

### Our Standards

#### Positive Behavior

- Using welcoming and inclusive language
- Being respectful of different viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

#### Unacceptable Behavior

- Harassing, abusive, or discriminatory language
- Personal attacks or political discussions
- Publishing private information without permission
- Any other conduct which could reasonably be considered inappropriate

### Reporting Issues

If you experience or witness unacceptable behavior, please contact us at conduct@smartaihub.com.

## Development Workflow

### 1. Create an Issue

Before starting work on a new feature or bug fix:

1. Check if there's already an existing issue for your work
2. If not, create a new issue with:
   - Clear description of the problem or feature
   - Acceptance criteria
   - Any relevant context or screenshots

### 2. Create a Branch

Create a new branch for your work:

```bash
# Sync with upstream
git fetch upstream
git checkout main
git merge upstream/main

# Create a new branch
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-number
```

### 3. Make Your Changes

- Follow the coding standards outlined in this document
- Write tests for your changes
- Update documentation as needed
- Make small, focused commits

### 4. Test Your Changes

```bash
# Run all tests
npm run test

# Run linting
npm run lint

# Run type checking
npm run type-check
```

### 5. Commit Your Changes

Follow our commit message convention:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
- `feat(auth): add OAuth provider support`
- `fix(api): resolve user profile update issue`
- `docs(readme): update installation instructions`

## Pull Request Process

### Before Submitting

1. **Ensure your branch is up to date**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run all tests and ensure they pass**
   ```bash
   npm run test
   npm run lint
   npm run type-check
   ```

3. **Update documentation**
   - Update relevant documentation files
   - Add comments to complex code
   - Update API documentation if needed

### Creating a Pull Request

1. **Push your branch to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create a pull request**
   - Use the GitHub interface to create a PR
   - Fill out the PR template completely
   - Link to any relevant issues
   - Add screenshots for UI changes

3. **Wait for review**
   - Your PR will be reviewed by maintainers
   - Address feedback promptly
   - Keep the discussion focused and constructive

### Pull Request Template

```markdown
## Description
Brief description of the changes made in this PR.

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Issue(s) Addressed
Fixes #(issue number)

## How Has This Been Tested?
Please describe in detail how you tested your changes.

## Test Coverage
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] All tests pass

## Checklist
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published in downstream modules
```

## Coding Standards

### General Guidelines

1. **Write clean, readable code**
   - Use meaningful variable and function names
   - Keep functions small and focused
   - Avoid deep nesting

2. **Follow TypeScript best practices**
   - Use types for all variables and function parameters
   - Prefer interfaces over types for object shapes
   - Use strict type checking

3. **Use consistent formatting**
   - Follow the configured ESLint rules
   - Use Prettier for code formatting
   - Configure your editor to format on save

### JavaScript/TypeScript Standards

#### Naming Conventions

```typescript
// Variables and functions: camelCase
const userName = 'john_doe';
const getUserProfile = () => {};

// Classes and interfaces: PascalCase
class UserService {}
interface UserProfile {}

// Constants: UPPER_SNAKE_CASE
const API_BASE_URL = 'https://api.example.com';

// Types: PascalCase
type UserRole = 'admin' | 'user';

// Enums: PascalCase
enum HttpStatus {
  OK = 200,
  NotFound = 404
}
```

#### Function Examples

```typescript
// Good: Clear function with proper typing
async function createUser(userData: CreateUserRequest): Promise<User> {
  try {
    const hashedPassword = await hashPassword(userData.password);
    
    const user = await prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword
      }
    });
    
    return user;
  } catch (error) {
    throw new Error(`Failed to create user: ${error.message}`);
  }
}

// Good: Arrow function for simple operations
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
```

#### Error Handling

```typescript
// Good: Proper error handling with try-catch
async function updateUserProfile(userId: string, updates: Partial<User>): Promise<User> {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updates
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
```

### React/Component Standards

```typescript
// Good: Functional component with proper typing
interface UserProfileProps {
  userId: string;
  onUpdate?: (user: User) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ userId, onUpdate }) => {
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

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!user) return <div>User not found</div>;

  return (
    <div className="user-profile">
      <h2>{user.firstName} {user.lastName}</h2>
      <p>{user.email}</p>
      {/* Additional profile content */}
    </div>
  );
};

export default UserProfile;
```

## Testing Guidelines

### Writing Tests

1. **Follow the AAA pattern**: Arrange, Act, Assert
2. **Write descriptive test names** that explain what is being tested
3. **Test happy paths and edge cases**
4. **Mock external dependencies** to isolate the code under test

### Unit Test Example

```typescript
describe('UserService', () => {
  describe('createUser', () => {
    it('should create a user with hashed password', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User'
      };

      const expectedUser = {
        id: 'user-123',
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName
      };

      jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(null);
      jest.spyOn(userRepository, 'create').mockResolvedValue(expectedUser);

      // Act
      const result = await userService.createUser(userData);

      // Assert
      expect(result).toEqual(expectedUser);
      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: userData.email,
          password: expect.any(String) // Hashed password
        })
      );
    });
  });
});
```

### Integration Test Example

```typescript
describe('User Registration API', () => {
  it('should register a new user and return tokens', async () => {
    const userData = {
      email: 'integration@example.com',
      password: 'Password123!',
      firstName: 'Integration',
      lastName: 'Test'
    };

    const response = await request(app)
      .post('/api/auth/register')
      .send(userData);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe(userData.email);
    expect(response.body.data.tokens.accessToken).toBeDefined();
  });
});
```

## Documentation Guidelines

### Code Documentation

1. **Use JSDoc comments** for functions and classes
2. **Document complex algorithms** with inline comments
3. **Update README files** when adding new features
4. **Document API endpoints** using OpenAPI/Swagger

### JSDoc Example

```typescript
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
```

### API Documentation

```typescript
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authenticate user and return tokens
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     tokens:
 *                       $ref: '#/components/schemas/Tokens'
 *       401:
 *         description: Invalid credentials
 */
```

## Issue Reporting

### Bug Reports

When reporting bugs, please include:

1. **Clear description** of the issue
2. **Steps to reproduce** the problem
3. **Expected behavior** vs. actual behavior
4. **Environment details** (OS, browser, Node.js version)
5. **Screenshots** if applicable
6. **Relevant logs** or error messages

### Bug Report Template

```markdown
## Bug Description
A clear and concise description of what the bug is.

## To Reproduce
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

## Expected Behavior
A clear and concise description of what you expected to happen.

## Actual Behavior
A clear and concise description of what actually happened.

## Screenshots
If applicable, add screenshots to help explain your problem.

## Environment
- OS: [e.g. Windows 10, macOS 12.0]
- Browser: [e.g. Chrome, Firefox]
- Node.js version: [e.g. 18.0.0]
- Application version: [e.g. 1.0.0]

## Additional Context
Add any other context about the problem here.
```

## Feature Requests

When requesting features, please include:

1. **Clear description** of the feature
2. **Use case** or problem it solves
3. **Proposed solution** (if you have one)
4. **Alternatives considered**
5. **Additional context**

### Feature Request Template

```markdown
## Feature Description
A clear and concise description of the feature you'd like to see added.

## Use Case
Describe the use case or problem this feature would solve.

## Proposed Solution
If you have a specific solution in mind, describe it here.

## Alternatives Considered
Describe any alternative solutions or features you've considered.

## Additional Context
Add any other context, mockups, or examples about the feature request here.
```

## Community Guidelines

### Communication Channels

1. **GitHub Issues**: For bug reports and feature requests
2. **GitHub Discussions**: For general questions and discussions
3. **Discord**: For real-time chat and community interaction
4. **Email**: For private or sensitive matters

### Getting Help

1. **Search existing issues** before creating new ones
2. **Check the documentation** for answers to common questions
3. **Be specific** when asking for help
4. **Provide context** and code examples
5. **Be patient** when waiting for responses

### Giving Back

There are many ways to contribute beyond code:

1. **Answer questions** in discussions and issues
2. **Improve documentation**
3. **Report bugs** with detailed information
4. **Share feedback** on features and usability
5. **Promote the project** in your networks
6. **Help triage issues** by reproducing bugs

## Recognition

### Contributors

All contributors are recognized in:

- **README.md**: List of all contributors
- **RELEASES.md**: Contributors for each release
- **Contributor statistics**: GitHub contributor insights

### Types of Contributions

We recognize all types of contributions:

- **Code**: New features, bug fixes, tests
- **Documentation**: Guides, API docs, examples
- **Design**: UI/UX improvements, graphics
- **Community**: Support, discussions, feedback
- **Infrastructure**: CI/CD, deployment, tools

### Becoming a Maintainer

Active contributors may be invited to become maintainers. Criteria include:

- Consistent, high-quality contributions
- Good understanding of the codebase
- Active participation in reviews and discussions
- Commitment to the project's success and values

---

Thank you for contributing to Smart AI Hub! Your contributions help make this project better for everyone.

If you have any questions about contributing, please don't hesitate to ask in our [GitHub Discussions](https://github.com/Smart-AI-Hub/Smart-AI-Hub/discussions) or contact us at contributors@smartaihub.com.