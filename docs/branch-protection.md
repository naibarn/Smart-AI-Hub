# Branch Protection Rules Setup

This document provides recommendations for setting up branch protection rules in your GitHub repository to ensure code quality and security.

## Recommended Branch Protection Settings

### Main Branch Protection

Navigate to your GitHub repository settings → Branches → Branch protection rules and create a rule for the `main` branch with the following settings:

#### 1. Require status checks to pass before merging

**Required status checks**:
- `lint` (from CI workflow)
- `test` (from CI workflow)
- `build` (from CI workflow)

**Additional options**:
- ✅ Require branches to be up to date before merging
- ✅ Require status checks to pass for new PRs

#### 2. Require pull request reviews before merging

**Settings**:
- Number of required reviews: **1**
- ✅ Dismiss stale PR approvals when new commits are pushed
- ✅ Require review from Code Owners
- ✅ Restrict reviews to users who dismiss stale PR approvals (optional)
- ✅ Limit to users with write access (optional)

#### 3. Restrict pushes that create matching branches

**Settings**:
- ✅ Limit who can push to matching branches
  - Add users/teams that should have direct push access

#### 4. Do not allow bypassing the above settings

**Settings**:
- ✅ Allow administrators to bypass branch protection rules (optional, based on your team's workflow)

### Develop Branch Protection

Create a similar rule for the `develop` branch with slightly relaxed settings:

#### 1. Require status checks to pass before merging

**Required status checks**:
- `lint` (from CI workflow)
- `test` (from CI workflow)
- `build` (from CI workflow)

**Additional options**:
- ✅ Require branches to be up to date before merging
- ✅ Require status checks to pass for new PRs

#### 2. Require pull request reviews before merging

**Settings**:
- Number of required reviews: **1**
- ✅ Dismiss stale PR approvals when new commits are pushed

## Setting Up Branch Protection Rules

1. Go to your GitHub repository
2. Click on **Settings** tab
3. In the left sidebar, click on **Branches**
4. Under "Branch protection rules", click **Add rule**
5. Enter the branch name pattern (e.g., `main` or `develop`)
6. Configure the settings as described above
7. Click **Create** or **Save changes**

## Code Owners Setup

To enable "Require review from Code Owners", create a `CODEOWNERS` file in your repository root:

```CODEOWNERS
# Default code owners for the entire repository
* @your-username @your-team

# Specific code owners for different packages
/packages/auth-service/* @auth-team
/packages/core-service/* @core-team
/packages/api-gateway/* @infra-team
/packages/frontend/* @frontend-team
```

## Additional Recommendations

### 1. Signed Commits

Consider requiring signed commits for additional security:
- Go to Repository Settings → Branches → Branch protection rules
- Enable "Require signed commits"

### 2. Linear History

To maintain a clean git history:
- Enable "Allow force pushes" for administrators only
- Use squash merge or rebase merge for PRs

### 3. Stale Branch Management

Set up branch automation to:
- Delete merged branches after a certain period
- Mark inactive branches as stale

## Workflow Benefits

These branch protection rules ensure:

1. **Code Quality**: All code passes linting, tests, and builds before merging
2. **Peer Review**: At least one team member reviews all changes
3. **Up-to-date Branches**: PRs are based on the latest branch state
4. **Security**: Prevents direct pushes to protected branches
5. **Accountability**: Clear review process and code ownership

## Troubleshooting

### Common Issues

1. **Status checks not showing up**: Ensure the CI workflow has run at least once
2. **Code owners not recognized**: Verify CODEOWNERS file syntax and team/user names
3. **PR can't be merged**: Check all required status checks have passed

### Best Practices

- Regularly review and update branch protection rules
- Communicate any changes to the team
- Use draft PRs for work in progress
- Keep PR descriptions clear and informative