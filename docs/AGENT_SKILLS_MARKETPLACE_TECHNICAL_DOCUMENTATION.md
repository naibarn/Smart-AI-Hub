# Agent Skills Marketplace Technical Documentation

## Overview

The Agent Skills Marketplace is a comprehensive platform for creating, sharing, and managing agent skills. It provides a centralized marketplace where users can submit, discover, install, and review agent skills with an approval workflow and rating system.

## Architecture

### Components

1. **Skill Management Service**
   - Handles skill creation, updates, and deletion
   - Manages skill versions and changelogs
   - Implements skill approval workflow

2. **Marketplace Service**
   - Provides skill discovery and search functionality
   - Manages skill installation and tracking
   - Handles skill categories and tags

3. **Review and Rating System**
   - Manages user reviews and ratings
   - Calculates average ratings and review counts
   - Tracks review helpfulness

4. **Approval Workflow**
   - Manages skill approval process
   - Handles rejection with reasons
   - Provides admin tools for moderation

### Data Flow

1. **Skill Submission**
   - User submits a new skill with metadata
   - Skill is marked as "pending" approval
   - Admin reviews and approves/rejects the skill
   - If approved, skill becomes visible in marketplace

2. **Skill Discovery**
   - Users browse or search for skills
   - Skills are filtered by category, platform, and tags
   - Results are sorted by popularity, newest, or rating
   - Skill details are displayed with reviews

3. **Skill Installation**
   - User installs a skill from the marketplace
   - Installation is tracked for usage analytics
   - Skill file is downloaded and registered
   - Installation history is maintained

4. **Review Submission**
   - Users who have installed skills can submit reviews
   - Reviews include ratings and comments
   - Reviews are moderated if necessary
   - Average ratings are updated

## API Reference

### Skill Management

#### Get Skills
```http
GET /api/agent-skills/skills?page=1&limit=12&category=automation&platform=openai&search=query&sortBy=popular
Authorization: Bearer {token}

Response:
{
  "data": [
    {
      "id": "skill-123",
      "name": "Email Automation",
      "slug": "email-automation",
      "description": "Automate email responses",
      "creatorId": "user-456",
      "categoryId": "cat-789",
      "platformId": "openai",
      "visibility": "PUBLIC",
      "status": "approved",
      "installCount": 150,
      "averageRating": 4.5,
      "reviewCount": 23,
      "iconUrl": "https://example.com/icon.png",
      "screenshotUrls": ["https://example.com/screen1.png"],
      "tags": ["automation", "email", "productivity"],
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-20T14:22:00Z"
    }
  ],
  "total": 45
}
```

#### Get Skill by ID
```http
GET /api/agent-skills/skills/{id}
Authorization: Bearer {token}
```

#### Create Skill
```http
POST /api/agent-skills/skills
Content-Type: application/json
Authorization: Bearer {token}

Body:
{
  "name": "Data Analysis Assistant",
  "description": "Analyze data and generate insights",
  "longDescription": "A comprehensive tool for data analysis...",
  "categoryId": "cat-123",
  "platformId": "openai",
  "visibility": "PUBLIC",
  "tags": ["analysis", "data", "insights"]
}
```

#### Update Skill
```http
PATCH /api/agent-skills/skills/{id}
Content-Type: application/json
Authorization: Bearer {token}

Body:
{
  "description": "Updated description",
  "tags": ["analysis", "data", "insights", "visualization"]
}
```

#### Delete Skill
```http
DELETE /api/agent-skills/skills/{id}
Authorization: Bearer {token}
```

### Skill Versions

#### Get Skill Versions
```http
GET /api/agent-skills/skills/{skillId}/versions?page=1&limit=10
Authorization: Bearer {token}
```

#### Create Skill Version
```http
POST /api/agent-skills/skills/{skillId}/versions
Content-Type: multipart/form-data
Authorization: Bearer {token}

Body:
- version: "1.2.0"
- changelog: "Added new features and bug fixes"
- file: File (zip file)
```

### Skill Installation

#### Install Skill
```http
POST /api/agent-skills/skills/{skillId}/install
Content-Type: application/json
Authorization: Bearer {token}

Body:
{
  "versionId": "version-456" // Optional, defaults to latest
}

Response:
{
  "installation": {
    "id": "install-789",
    "skillId": "skill-123",
    "userId": "user-456",
    "versionId": "version-456",
    "installedAt": "2024-01-25T09:15:00Z",
    "lastUsedAt": null,
    "usageCount": 0
  },
  "downloadUrl": "https://example.com/download/skill-123-v1.2.0.zip"
}
```

#### Uninstall Skill
```http
DELETE /api/agent-skills/skills/{skillId}/install
Authorization: Bearer {token}
```

#### Get User's Installed Skills
```http
GET /api/agent-skills/user/installed?page=1&limit=10
Authorization: Bearer {token}
```

### Reviews

#### Get Skill Reviews
```http
GET /api/agent-skills/skills/{skillId}/reviews?page=1&limit=10&rating=5
Authorization: Bearer {token}
```

#### Create Review
```http
POST /api/agent-skills/skills/{skillId}/reviews
Content-Type: application/json
Authorization: Bearer {token}

Body:
{
  "rating": 5,
  "title": "Excellent tool!",
  "comment": "This skill has greatly improved my workflow..."
}
```

#### Update Review
```http
PATCH /api/agent-skills/skills/{skillId}/reviews/{reviewId}
Content-Type: application/json
Authorization: Bearer {token}

Body:
{
  "rating": 4,
  "comment": "Updated comment after more usage..."
}
```

#### Delete Review
```http
DELETE /api/agent-skills/skills/{skillId}/reviews/{reviewId}
Authorization: Bearer {token}
```

### Categories

#### Get Categories
```http
GET /api/agent-skills/categories
Authorization: Bearer {token}

Response:
[
  {
    "id": "cat-123",
    "name": "Automation",
    "slug": "automation",
    "description": "Skills for automating repetitive tasks",
    "iconName": "automation",
    "parentId": null,
    "sortOrder": 1,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
]
```

#### Create Category
```http
POST /api/agent-skills/categories
Content-Type: application/json
Authorization: Bearer {token}

Body:
{
  "name": "Data Science",
  "description": "Skills for data analysis and science",
  "iconName": "data-science",
  "color": "#4CAF50"
}
```

### Search

#### Search Skills
```http
POST /api/agent-skills/search
Content-Type: application/json
Authorization: Bearer {token}

Body:
{
  "q": "email automation",
  "category": "automation",
  "platform": "openai",
  "tags": ["productivity"],
  "sort": "popular",
  "limit": 20,
  "offset": 0
}
```

### Admin Operations

#### Get Pending Skills
```http
GET /api/agent-skills/skills/pending-approval?page=1&limit=10
Authorization: Bearer {admin-token}
```

#### Approve Skill
```http
POST /api/agent-skills/skills/{skillId}/approve
Content-Type: application/json
Authorization: Bearer {admin-token}
```

#### Reject Skill
```http
POST /api/agent-skills/skills/{skillId}/reject
Content-Type: application/json
Authorization: Bearer {admin-token}

Body:
{
  "reason": "Skill does not meet quality standards"
}
```

#### Get Analytics
```http
GET /api/agent-skills/stats
Authorization: Bearer {admin-token}

Response:
{
  "totalSkills": 150,
  "totalDownloads": 5000,
  "totalReviews": 1200,
  "averageRating": 4.2,
  "topCategories": [
    {
      "categoryId": "cat-123",
      "categoryName": "Automation",
      "skillCount": 45,
      "downloadCount": 2000,
      "averageRating": 4.5
    }
  ],
  "topPlatforms": [
    {
      "platformId": "openai",
      "platformName": "OpenAI",
      "skillCount": 80,
      "downloadCount": 3000,
      "averageRating": 4.3
    }
  ],
  "recentActivity": [
    {
      "type": "skill_created",
      "skillId": "skill-789",
      "skillName": "New Automation Tool",
      "userId": "user-456",
      "userName": "John Doe",
      "timestamp": "2024-01-25T10:30:00Z"
    }
  ]
}
```

## Data Models

### AgentSkill
```typescript
interface AgentSkill {
  id: string;
  name: string;
  slug: string;
  description: string;
  longDescription?: string;
  creatorId: string;
  categoryId: string;
  platformId: string;
  
  // Visibility
  visibility: SkillVisibility;
  organizationId?: string;
  
  // Status
  status: SkillStatus;
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  
  // Metrics
  installCount: number;
  averageRating: number;
  reviewCount: number;
  
  // Media
  iconUrl?: string;
  screenshotUrls: string[];
  
  // Metadata
  tags: string[];
  metadata: Record<string, any>;
  
  createdAt: Date;
  updatedAt: Date;
}
```

### SkillVersion
```typescript
interface SkillVersion {
  id: string;
  skillId: string;
  version: string; // 1.0.0
  changelog?: string;
  fileUrl: string;
  fileSize: number; // bytes
  fileHash: string;
  isLatest: boolean;
  downloadCount: number;
  createdAt: Date;
}
```

### SkillReview
```typescript
interface SkillReview {
  id: string;
  skillId: string;
  userId: string;
  rating: number; // 1-5
  title?: string;
  comment?: string;
  isVerified: boolean; // verified purchase/installation
  helpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### SkillInstallation
```typescript
interface SkillInstallation {
  id: string;
  skillId: string;
  userId: string;
  versionId: string;
  installedAt: Date;
  lastUsedAt?: Date;
  usageCount: number;
}
```

## Skill Status and Visibility

### Skill Status
1. **DRAFT**: Skill is being created
2. **PENDING**: Skill is pending approval
3. **APPROVED**: Skill is approved and visible
4. **REJECTED**: Skill was rejected
5. **ARCHIVED**: Skill is archived

### Skill Visibility
1. **PRIVATE**: Only visible to creator
2. **ORGANIZATION**: Visible to organization members
3. **PUBLIC**: Visible to all users

## File Management

### Supported File Types
- ZIP files for skill packages
- PNG/JPG/WebP for icons (max 1MB)
- PNG/JPG/WebP for screenshots (max 5MB each, max 5 screenshots)

### File Size Limits
- Skill package: 50MB max
- Icon: 1MB max
- Screenshots: 5MB max each

### Versioning
- Semantic versioning (major.minor.patch)
- Changelog required for each version
- Latest version is automatically selected for installation

## Configuration

### Environment Variables

```bash
# File Storage
STORAGE_BUCKET=smart-ai-hub-skills
STORAGE_REGION=us-east-1

# Skill Limits
MAX_SKILL_FILE_SIZE=52428800  # 50MB in bytes
MAX_ICON_SIZE=1048576         # 1MB in bytes
MAX_SCREENSHOT_SIZE=5242880   # 5MB in bytes
MAX_SCREENSHOTS=5

# Approval Settings
REQUIRE_APPROVAL=true
AUTO_APPROVE_TRUSTED_CREATORS=false

# Review Settings
MIN_RATING=1
MAX_RATING=5
ALLOW_REVIEWS_ONLY_AFTER_INSTALL=true
```

## Security Considerations

1. **File Validation**: All uploaded files are validated for type and size
2. **Code Scanning**: Skill packages are scanned for malicious code
3. **Access Control**: Skills respect user permissions and visibility
4. **Audit Trail**: All skill operations are logged
5. **Sandboxing**: Skills run in isolated environments

## Performance Optimization

1. **CDN for Files**: Skill files are served through CDN
2. **Search Indexing**: Skills are indexed for fast search
3. **Caching**: Popular skills are cached
4. **Lazy Loading**: Screenshots are loaded on demand

## Monitoring and Logging

1. **Download Tracking**: All skill downloads are tracked
2. **Usage Analytics**: Skill usage is monitored
3. **Review Moderation**: Reviews are monitored for spam
4. **Performance Metrics**: API performance is tracked

## Troubleshooting

### Common Issues

1. **Skill Upload Fails**
   - Check file size and format
   - Verify ZIP structure
   - Check required metadata

2. **Skill Installation Fails**
   - Verify skill is approved
   - Check user permissions
   - Validate file integrity

3. **Review Submission Fails**
   - Verify skill is installed
   - Check review content
   - Validate rating value

### Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| 400 | Invalid request | Check request parameters |
| 401 | Unauthorized | Verify authentication token |
| 403 | Access denied | Check permissions |
| 404 | Skill not found | Verify skill ID |
| 413 | File too large | Reduce file size |
| 422 | Validation error | Check input data |
| 500 | Internal error | Check system logs |

## Future Enhancements

1. **Skill Dependencies**: Support for skill dependencies
2. **Monetization**: Allow creators to charge for skills
3. **Skill Templates**: Provide templates for common skill types
4. **Advanced Search**: Enhanced search with filters and facets
5. **Skill Analytics**: Detailed analytics for skill creators