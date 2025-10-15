---
title: "github-secrets"
author: "Development Team"
version: "1.0.0"
---
# GitHub Repository Secrets Setup

This document explains how to set up the required secrets in your GitHub repository for the CI/CD pipeline to work properly.

## Required Secrets

Navigate to your GitHub repository settings → Secrets and variables → Actions and add the following secrets:

### 1. DATABASE_URL

**Description**: Connection string for the test database used in CI/CD pipeline

**Value Format**: `postgresql://postgres:postgres@localhost:5432/test_db`

**Note**: The CI workflow automatically sets up a PostgreSQL service, so this URL should match the service configuration in the workflow file.

### 2. JWT_SECRET

**Description**: Secret key for signing JWT tokens in the auth service

**How to generate**: 
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Example**: `a1b2c3d4e5f6...64-character-hex-string`

### 3. JWT_REFRESH_SECRET

**Description**: Secret key for signing JWT refresh tokens

**How to generate**:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Example**: `z9y8x7w6v5u4...64-character-hex-string`

**Important**: This should be different from JWT_SECRET

### 4. CODECOV_TOKEN (Optional)

**Description**: Token for uploading test coverage to Codecov

**How to get**:
1. Sign up at [codecov.io](https://codecov.io)
2. Connect your GitHub repository
3. Get the repository token from Codecov settings

**Note**: This is optional. If not provided, coverage upload will be skipped.

## Setting Up Secrets

1. Go to your GitHub repository
2. Click on **Settings** tab
3. In the left sidebar, click on **Secrets and variables** → **Actions**
4. Click on **New repository secret**
5. Enter the name and value for each secret
6. Click **Add secret**

## Security Best Practices

- Never commit secrets to your repository
- Use different secrets for development, staging, and production
- Rotate secrets regularly
- Use strong, randomly generated secrets
- Limit access to secrets to only necessary team members

## Testing the Setup

After setting up the secrets, you can test the CI/CD pipeline by:

1. Creating a pull request to main/develop branch
2. Pushing changes to main/develop branch
3. Checking the Actions tab to ensure the workflow runs successfully

## Troubleshooting

### Common Issues

1. **Database connection errors**: Verify DATABASE_URL matches the PostgreSQL service configuration
2. **JWT errors**: Ensure JWT_SECRET and JWT_REFRESH_SECRET are set and are different
3. **Codecov upload fails**: Verify CODECOV_TOKEN is correct and repository is connected to Codecov

### Debugging

- Check the Actions tab in GitHub for detailed error messages
- Ensure all required secrets are properly set
- Verify the workflow file syntax is correct