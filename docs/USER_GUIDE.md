# Smart AI Hub User Guide

## Table of Contents

1. [Getting Started](#getting-started)
2. [RAG System](#rag-system)
3. [Pricing System](#pricing-system)
4. [Agent Skills Marketplace](#agent-skills-marketplace)
5. [Credit Management](#credit-management)
6. [Account Settings](#account-settings)
7. [Troubleshooting](#troubleshooting)

## Getting Started

### What is Smart AI Hub?

Smart AI Hub is a comprehensive platform that brings together powerful AI tools and services in one place. It includes:

- **RAG System**: Upload and query documents using AI-powered search
- **Pricing System**: Transparent pricing for AI agent usage
- **Agent Skills Marketplace**: Discover and install AI agent skills
- **Credit Management**: Track and manage your AI usage credits

### Creating an Account

1. Visit [https://app.smartaihub.com](https://app.smartaihub.com)
2. Click "Sign Up" in the top right corner
3. Fill in your email, password, and personal information
4. Verify your email address
5. Complete your profile to unlock all features

### Dashboard Overview

After logging in, you'll see your dashboard with:

- **Credit Balance**: Your current available credits
- **Recent Activity**: Your latest document uploads, skill installations, and queries
- **Quick Actions**: Easy access to common tasks
- **Usage Statistics**: Overview of your AI usage

## RAG System

### What is RAG?

RAG (Retrieval-Augmented Generation) is a powerful AI system that allows you to upload documents and ask questions about their content. The AI searches through your documents to find relevant information and provides accurate, context-aware answers.

### Uploading Documents

1. Navigate to the **RAG System** from the sidebar
2. Click the **"Upload Document"** button
3. Choose a file from your computer (supported formats: PDF, DOCX, TXT, MD)
4. Fill in the document details:
   - **Title**: A descriptive name for your document
   - **Description**: Brief summary of the content
   - **Access Level**: Who can see this document
     - **Private**: Only you
     - **Organization**: Members of your organization
     - **Public**: All users
5. Add relevant tags to help with searching
6. Click **"Upload"** to start processing

### Document Processing

After uploading, your document will be processed:
- The system extracts text and analyzes the content
- Documents are broken into searchable chunks
- Processing typically takes 1-5 minutes depending on size
- You'll receive a notification when processing is complete

### Querying Documents

1. In the RAG System, click the **"Query Documents"** tab
2. Type your question in the search box
3. Optionally:
   - Select specific access levels to search
   - Filter by tags
   - Adjust the number of results (topK)
4. Click **"Search"** to get answers

### Understanding Query Results

Each result includes:
- **Relevance Score**: How well the content matches your query (0-1)
- **Source Document**: Which document the answer came from
- **Content Snippet**: The relevant text from the document
- **Metadata**: Additional information like page numbers

### Managing Documents

To manage your documents:
1. Go to the **"My Documents"** tab
2. Use the search and filters to find specific documents
3. Click the **three dots** menu next to any document to:
   - View details
   - Edit metadata
   - Download original file
   - Delete document

### Collections

Collections help you organize related documents:
1. Click **"Create Collection"** in the sidebar
2. Give your collection a name and description
3. Set the access level
4. Add documents to the collection
5. Collections make it easier to search related content

## Pricing System

### Understanding Credits

The Smart AI Hub uses a credit-based system for AI operations:
- Credits are consumed when you use AI features
- Different operations consume different amounts of credits
- You can purchase more credits or subscribe to a plan

### Credit Consumption

Typical credit costs:
- **RAG Query**: 1-5 credits per query
- **Agent Execution**: 5-50 credits depending on complexity
- **Document Processing**: 10-100 credits depending on size

### Viewing Pricing Details

1. Navigate to **Pricing System** from the sidebar
2. View current pricing rules for different AI models
3. See detailed cost breakdowns:
   - Input token costs
   - Output token costs
   - Fixed costs (if any)
   - Applicable discounts

### Cost Calculator

Use the built-in cost calculator to estimate costs:
1. Select the AI platform and model
2. Enter expected input/output tokens
3. See the estimated cost in credits
4. Adjust parameters to optimize costs

### Usage History

Track your credit usage:
1. Go to **Usage History** in the Pricing System
2. Filter by date range
3. See detailed breakdown of:
   - Operation type
   - Credits consumed
   - Timestamp
   - Associated model/platform

### Managing Your Credits

1. View your current credit balance in the dashboard
2. Purchase additional credits:
   - Click **"Buy Credits"** in the dashboard
   - Select a package
   - Complete payment
3. Set up auto-topup to never run out of credits

## Agent Skills Marketplace

### What are Agent Skills?

Agent Skills are pre-built AI capabilities that you can install and use in your workflows. They range from simple text processing to complex automation tasks.

### Browsing Skills

1. Navigate to **Agent Skills Marketplace** from the sidebar
2. Browse skills by:
   - **Categories**: Automation, Data Analysis, Content Creation, etc.
   - **Platforms**: OpenAI, Anthropic, Google, etc.
   - **Popularity**: Most installed, highest rated
   - **Newest**: Recently added skills
3. Use the search bar to find specific skills
4. Filter by tags and ratings

### Installing Skills

1. Click on any skill to view details:
   - Description and features
   - Installation instructions
   - User reviews and ratings
   - Credit costs per use
2. Click **"Install Skill"** to add it to your account
3. Choose the version (if multiple are available)
4. Confirm installation
5. The skill is now available in your workspace

### Using Installed Skills

1. Go to **"My Skills"** in the marketplace
2. Click on any installed skill
3. Follow the skill-specific instructions
4. Configure any required parameters
5. Execute the skill

### Reviewing Skills

If you've used a skill, you can leave a review:
1. Go to the skill's page
2. Click **"Write a Review"**
3. Rate the skill (1-5 stars)
4. Write your review title and comment
5. Submit your review

### Submitting Your Own Skills

Create and share your own AI skills:

#### Requirements
- Skill must be functional and well-documented
- Include clear installation and usage instructions
- Follow the skill development guidelines
- Pass the review process

#### Submission Process
1. Click **"Submit Skill"** in the marketplace
2. Fill in the skill details:
   - Name and description
   - Category and platform
   - Tags and metadata
3. Upload your skill package (ZIP file)
4. Include version information and changelog
5. Submit for review
6. Wait for approval (typically 1-3 business days)

#### Skill Package Structure
```
skill-name/
├── skill.json          # Skill metadata
├── main.js             # Main skill logic
├── README.md           # Documentation
├── package.json        # Dependencies
└── assets/             # Images, icons, etc.
```

## Credit Management

### Checking Your Balance

Your credit balance is always visible:
- In the top navigation bar
- On your dashboard
- In the Credit Management section

### Credit Packages

Available credit packages:
- **Starter**: 1,000 credits - $10
- **Professional**: 5,000 credits - $45 (10% discount)
- **Business**: 10,000 credits - $80 (20% discount)
- **Enterprise**: 50,000 credits - $350 (30% discount)

### Subscription Plans

For regular users, subscription plans offer better value:
- **Basic**: $29/month - 3,000 credits
- **Pro**: $79/month - 10,000 credits
- **Business**: $199/month - 30,000 credits
- **Enterprise**: Custom pricing

### Auto-Topup

Never run out of credits with auto-topup:
1. Go to **Credit Management** → **Auto-Topup**
2. Enable auto-topup
3. Set the threshold (e.g., when balance < 100 credits)
4. Choose the package to purchase
5. Add payment method
6. Save settings

### Credit Reservations

For operations that require multiple steps:
1. Credits are reserved when starting an operation
2. Reserved credits are held until completion
3. Only the actual credits used are charged
4. Unused reservations are automatically released

## Account Settings

### Profile Information

Update your profile:
1. Click your avatar in the top right
2. Select **"Profile Settings"**
3. Update:
   - Name and email
   - Profile picture
   - Bio and expertise
   - Social links
4. Save changes

### Security Settings

Keep your account secure:
1. Go to **Security Settings**
2. Enable:
   - Two-factor authentication (2FA)
   - Login notifications
   - Session management
3. Change password regularly
4. Review active sessions

### Notification Preferences

Control what notifications you receive:
1. Go to **Notification Settings**
2. Choose notification channels:
   - Email notifications
   - In-app notifications
   - SMS alerts (for critical events)
3. Select notification types:
   - Document processing complete
   - Low credit balance
   - Skill approval status
   - Usage alerts

### API Access

For developers:
1. Go to **API Access**
2. Generate API keys
3. Set permissions for each key
4. Monitor API usage
5. Regenerate keys if compromised

### Organization Settings

For team collaboration:
1. Create or join an organization
2. Invite team members
3. Set roles and permissions
4. Manage organization billing
5. Share resources securely

## Troubleshooting

### Common Issues

#### Document Upload Fails
**Problem**: Document won't upload or processing fails
**Solutions**:
- Check file size (max 50MB)
- Verify file format (PDF, DOCX, TXT, MD)
- Ensure file is not password protected
- Try uploading a smaller file first
- Check your internet connection

#### No Search Results
**Problem**: RAG queries return no results
**Solutions**:
- Check if documents are fully processed
- Try broader search terms
- Remove filters that might be too restrictive
- Verify document access permissions
- Check spelling of search terms

#### Credit Issues
**Problem**: Credits not deducted or showing incorrect balance
**Solutions**:
- Refresh the page
- Check credit history for recent transactions
- Verify payment was successful
- Contact support if balance seems incorrect

#### Skill Installation Fails
**Problem**: Can't install a skill from the marketplace
**Solutions**:
- Check if you have enough credits
- Verify skill compatibility with your plan
- Clear browser cache and cookies
- Try a different browser
- Check if skill is available in your region

### Getting Help

If you need additional help:

1. **Help Center**: Visit [help.smartaihub.com](https://help.smartaihub.com)
2. **Community Forum**: Join discussions at [community.smartaihub.com](https://community.smartaihub.com)
3. **Email Support**: support@smartaihub.com
4. **Live Chat**: Available 9 AM - 6 PM EST on weekdays

### Reporting Bugs

Found a bug? Help us improve:
1. Note the steps to reproduce the issue
2. Take screenshots if applicable
3. Check if the issue is already reported
4. Submit a bug report at [bugs.smartaihub.com](https://bugs.smartaihub.com)

### Feature Requests

Have an idea for a new feature?
1. Check if it's already requested
2. Vote on existing requests
3. Submit new feature requests with detailed descriptions
4. Participate in user feedback surveys

## Best Practices

### Document Management
- Use descriptive titles and descriptions
- Add relevant tags for better searchability
- Organize documents in collections
- Regularly review and remove outdated documents

### Credit Optimization
- Monitor your usage patterns
- Choose appropriate AI models for your needs
- Use the cost calculator before large operations
- Set up auto-topup to avoid interruptions

### Security
- Enable two-factor authentication
- Use strong, unique passwords
- Regularly review account activity
- Be cautious with API keys

### Skill Usage
- Read skill documentation before use
- Start with small test cases
- Monitor credit consumption
- Provide feedback to skill creators

## Glossary

- **API**: Application Programming Interface - allows different software to communicate
- **Credits**: Virtual currency used to pay for AI operations
- **RAG**: Retrieval-Augmented Generation - AI system that combines document retrieval with text generation
- **Token**: Unit of text that AI models process (roughly 1 token = 4 characters)
- **Skill**: Pre-built AI capability that can be installed and used
- **Collection**: Group of related documents for organization
- **Metadata**: Data about data (e.g., document title, tags, creation date)

## Keyboard Shortcuts

### Global Shortcuts
- `Ctrl + /`: Show keyboard shortcuts
- `Ctrl + K`: Quick search
- `Ctrl + N`: New document/skill
- `Ctrl + ,`: Settings

### RAG System
- `Ctrl + U`: Upload document
- `Ctrl + F`: Search documents
- `Ctrl + Shift + F`: Advanced search

### Marketplace
- `Ctrl + B`: Browse skills
- `Ctrl + I`: Install selected skill
- `Ctrl + R`: Write review

## Mobile App

The Smart AI Hub mobile app is available for:
- **iOS**: Download from the App Store
- **Android**: Download from Google Play

Mobile features include:
- Document upload from camera or gallery
- Voice queries for RAG system
- Push notifications for important events
- Offline mode for downloaded skills

## FAQ

**Q: How secure are my documents?**
A: All documents are encrypted at rest and in transit. Access is controlled through permissions and audit logs track all access.

**Q: Can I share documents with non-users?**
A: Yes, you can generate shareable links for public documents with time-limited access.

**Q: What happens to my credits if I cancel my subscription?**
A: Purchased credits remain in your account for 12 months. Subscription credits expire at the end of the billing cycle.

**Q: Can I get a refund for unused credits?**
A: Credits are non-refundable once purchased, but you can transfer them to another user within your organization.

**Q: How often are new skills added to the marketplace?**
A: New skills are added daily after review and approval process.

**Q: Can I create private skills for my organization?**
A: Yes, enterprise plans allow creation of private skills visible only to your organization.

For more questions, visit our comprehensive FAQ at [faq.smartaihub.com](https://faq.smartaihub.com).
