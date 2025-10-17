---
title: "Multi-tier User Hierarchy and Referral System Specification"
author: "Development Team"
version: "2.0.0"
status: "completed"
priority: "high"
created_at: "2025-01-16"
updated_at: "2025-10-16"
type: "specification"
description: "Comprehensive specification for Smart AI Hub's Multi-tier User Hierarchy and Referral System with security-focused implementation requirements"
---

# Multi-tier User Hierarchy and Referral System Specification

## 1. Overview

This document provides a comprehensive specification for implementing a multi-tier user hierarchy and referral system within Smart AI Hub. The system establishes a sophisticated 5-tier hierarchy structure with strict visibility controls, secure transfer capabilities, comprehensive referral functionality, and robust user interaction controls. The implementation prioritizes security as a critical requirement, ensuring that all user data access respects visibility rules based on hierarchical relationships to prevent unauthorized data access and maintain system integrity.

The specification addresses complex organizational requirements while providing a foundation for scalable growth and enterprise operations. The system is designed to support millions of users across multiple organizational levels while maintaining strict security boundaries and comprehensive audit trails. This document serves as the definitive reference for developers, architects, and security teams implementing the hierarchy system.

## 2. Introduction

Smart AI Hub's expansion into enterprise and organizational markets necessitates a sophisticated user hierarchy system that can accommodate complex organizational structures while maintaining strict data privacy and access controls. The existing flat user model is insufficient to support the diverse requirements of enterprise clients, agencies, organizations, and individual users with varying levels of authority and visibility.

This specification introduces a comprehensive 5-tier hierarchy system that addresses these requirements while establishing a security-first approach to data access and user interactions. The system provides the foundation for advanced features including referral programs, secure resource transfers, and granular user management capabilities that support Smart AI Hub's growth and enterprise adoption strategies.

## 3. Background

The development of this hierarchy system responds to increasing demand from enterprise clients and organizational users who require sophisticated access controls and hierarchical management capabilities. As Smart AI Hub's user base has grown to include large agencies, organizations, and complex corporate structures, the limitations of the current flat user model have become increasingly apparent.

Prior to this implementation, user management relied on basic role-based access control without hierarchical relationships or visibility constraints. This approach created security risks and limited the platform's ability to support complex organizational structures. The new system addresses these limitations while providing a scalable foundation for future enhancements and advanced features.

## 4. Goals and Objectives

The primary goal of this specification is to establish a secure, scalable, and flexible hierarchy system that supports Smart AI Hub's growth and enterprise requirements. Specific objectives include implementing a 5-tier hierarchy with strict visibility controls, enabling secure resource transfers between authorized users, creating a comprehensive referral system with configurable reward mechanisms, providing robust user interaction controls through block/unblock functionality, and ensuring comprehensive audit trails for compliance and security monitoring.

Additional objectives include maintaining high performance and scalability to support millions of users, ensuring intuitive user interfaces that simplify complex hierarchical relationships, establishing comprehensive security measures to prevent data breaches, and creating a foundation for future feature development. The specification aims to achieve these objectives while maintaining backward compatibility and minimizing disruption to existing users.

## 5. Scope

The specification encompasses the complete hierarchy system including database schema modifications, API endpoint development, security middleware implementation, user interface components, and comprehensive testing requirements. The system includes user tier management, hierarchical relationship tracking, visibility enforcement mechanisms, transfer functionality for points and credits, referral system with reward distribution, block/unblock capabilities, and comprehensive audit logging.

The scope specifically excludes migration of existing user data beyond the required schema changes, integration with external identity providers beyond the existing authentication system, implementation of multi-level marketing structures, and advanced analytics features which are planned for future releases. The specification focuses on core functionality while establishing a solid foundation for future enhancements.

## 6. Assumptions and Constraints

The specification assumes that existing user data can be migrated to the new hierarchical model with appropriate default values, that the current authentication system will continue to function with the enhanced user model, and that sufficient database capacity exists to support the additional schema elements and indexes. The system assumes that clients will accept the default hierarchical structure or require minimal customization.

Key constraints include maintaining backward compatibility with existing API endpoints, ensuring no degradation in system performance during implementation, adhering to existing data privacy and security requirements, completing implementation within allocated development resources, and ensuring that all security requirements are met without exception. The system must maintain high availability and data integrity throughout the implementation process.

## 7. Stakeholders

Primary stakeholders include the Smart AI Hub development team responsible for implementation and maintenance, system administrators who will manage the hierarchy configuration, enterprise clients who will utilize the hierarchical organization features, and end users across all tiers who interact with the system daily.

Secondary stakeholders include compliance and security teams who must validate the implementation meets regulatory requirements, customer support teams who will assist users with hierarchy-related questions, business development teams who will leverage the system for enterprise sales, and external auditors who will review the system for security and compliance. The specification must address the diverse needs of all stakeholder groups while maintaining system coherence and security.

## 8. Requirements

### 8.1 Functional Requirements

The system must implement a 5-tier hierarchy with strict visibility rules, enable secure transfers of points and credits between authorized users, provide a comprehensive referral system with configurable rewards, support block/unblock functionality with appropriate restrictions, maintain complete audit trails for all operations, provide intuitive user interfaces for hierarchy management, and support comprehensive search and filtering capabilities with visibility enforcement.

### 8.2 Non-Functional Requirements

The system must ensure data privacy through strict access controls, maintain high performance with sub-second response times, provide scalability to support millions of users, ensure 99.9% system availability, implement comprehensive security measures including rate limiting and input validation, provide detailed logging for monitoring and compliance, and support comprehensive backup and recovery procedures.

### 8.3 Security Requirements

Security requirements include enforcement of visibility rules at multiple levels, prevention of unauthorized data access through comprehensive validation, protection against common security vulnerabilities, secure handling of sensitive user data, implementation of rate limiting to prevent abuse, comprehensive audit logging for security monitoring, and immediate alerting for suspicious activity patterns. All security requirements are considered mandatory and non-negotiable.

## 9. System Architecture

### 9.1 High-Level Architecture

The system follows a microservices architecture with clear separation of concerns between authentication, core business logic, and data persistence. The hierarchy implementation is primarily contained within the core service with appropriate integration with the authentication service for user validation and authorization. The architecture supports horizontal scaling and maintains security through service boundaries and comprehensive API validation.

### 9.2 Component Architecture

The implementation consists of several key components including the hierarchy controller for managing user relationships, visibility middleware for enforcing access controls, transfer controller for secure resource movement, referral controller for managing invitation workflows, block controller for user interaction controls, comprehensive database models with appropriate relationships and indexes, and security monitoring components for threat detection and prevention.

### 9.3 Security Architecture

The security architecture implements defense-in-depth principles with multiple layers of validation and authorization. The visibility check middleware serves as the primary security enforcement point, complemented by comprehensive input validation, rate limiting, audit logging, and anomaly detection. The architecture ensures that security checks are performed at multiple levels to prevent unauthorized access and maintain data privacy.

## 10. Data Models

### 10.1 User Model Enhancements

The User model is enhanced to support hierarchical relationships through the addition of tier, parentAgencyId, parentOrganizationId, inviteCode, invitedBy, isBlocked, blockedReason, blockedAt, and blockedBy fields. The tier field implements an enum with values 'administrator', 'agency', 'organization', 'admin', and 'general' to define the 5-tier hierarchy. Parent reference fields establish hierarchical relationships while maintaining referential integrity through foreign key constraints.

### 10.2 Transfer Model

The Transfer model tracks all point and credit transfers between users with comprehensive fields including id, senderId, receiverId, type, currency, amount, description, metadata, status, and createdAt timestamps. The model supports multiple transfer types through the type enum with values 'manual', 'referral_reward', and 'admin_adjustment', and multiple currencies through the currency enum with values 'points' and 'credits'. All transfers are logged for audit purposes with complete status tracking.

### 10.3 ReferralReward Model

The ReferralReward model tracks all referral transactions including id, referrerId, refereeId, referrerTier, refereeTier, referrerRewardPoints, refereeRewardPoints, agencyBonusPoints, agencyId, status, processedAt, and createdAt timestamps. This model enables comprehensive tracking of referral rewards and supports complex reward structures based on hierarchical relationships. The status field tracks reward processing through 'pending', 'completed', and 'failed' states.

### 10.4 AgencyReferralConfig Model

The AgencyReferralConfig model enables configurable reward structures for agencies with fields including id, agencyId, organizationRewardPoints, adminRewardPoints, generalRewardPoints, isActive, createdAt, and updatedAt timestamps. This model allows agencies to customize their referral rewards while maintaining system-wide consistency and validation. The isActive field enables temporary reward structure modifications without data loss.

### 10.5 BlockLog Model

The BlockLog model maintains comprehensive records of all block/unblock operations with fields including id, userId, blockedBy, action, reason, metadata, and createdAt timestamps. This model provides complete audit trails for user interaction controls and supports both temporary and permanent blocks. The action field tracks both block and unblock operations with complete metadata for audit purposes.

## 11. API Specifications

### 11.1 Transfer System Endpoints

The transfer system provides comprehensive endpoints for secure resource movement including POST /api/transfer/points for point transfers with comprehensive validation, POST /api/transfer/credits for credit transfers with authorization checks, GET /api/transfer/history for transfer history with pagination and filtering, and GET /api/transfer/validate for transfer validation with visibility enforcement. All endpoints implement comprehensive security checks and rate limiting.

### 11.2 Referral System Endpoints

The referral system endpoints support complete invitation workflows including GET /api/referral/invite-link for retrieving invite links and QR codes, GET /api/referral/stats for referral statistics with comprehensive metrics, POST /api/referral/register for registration with invite codes and reward distribution, and GET /api/referral/rewards for reward history with detailed transaction information. These endpoints implement comprehensive validation and reward calculation logic.

### 11.3 Block System Endpoints

The block system endpoints provide user interaction controls including POST /api/hierarchy/block for blocking users with authorization validation, POST /api/hierarchy/unblock for unblocking users with audit logging, and GET /api/hierarchy/block-logs for viewing block/unblock history with filtering capabilities. These endpoints implement hierarchical restrictions and comprehensive validation to prevent abuse.

### 11.4 Hierarchy Management Endpoints

The hierarchy management endpoints support organizational operations including GET /api/hierarchy/members for retrieving hierarchy members with strict visibility filtering, GET /api/hierarchy/tree for viewing hierarchy trees with access controls, and GET /api/hierarchy/stats for getting hierarchy statistics with visibility enforcement. These endpoints implement the most critical security checks to prevent unauthorized data access.

### 11.5 Agency Configuration Endpoints

The agency configuration endpoints support reward structure management including GET /api/agency/referral-config for retrieving agency referral settings and PUT /api/agency/referral-config for updating referral reward configurations with validation. These endpoints are restricted to agency users and administrators with appropriate authorization checks.

## 12. Security Considerations

### 12.1 Visibility Check Middleware

The visibility check middleware represents the most critical security component in the hierarchy system. This middleware enforces strict visibility rules based on user hierarchy and prevents unauthorized data access through comprehensive validation. The checkUserVisibility function implements the core security logic and must be applied to all sensitive operations to ensure data privacy and access control. The middleware returns boolean results that determine whether users can access specific data or perform certain operations.

### 12.2 Transfer Authorization Logic

Transfer authorization is implemented through comprehensive validation that checks both visibility and hierarchical permissions. The canTransfer function validates that senders can see receivers and have appropriate hierarchical permissions to initiate transfers. The function implements different authorization rules based on the sender's tier, with administrators having full transfer capabilities and general users having no transfer capabilities. All transfer operations must pass both visibility and authorization checks before execution.

### 12.3 Block Authorization Logic

Block authorization is implemented through the canBlock function that validates both visibility and hierarchical permissions. The function ensures that users can only block users they can see and have appropriate hierarchical authority over. Administrators can block any user, agencies can block organizations and general users under them, organizations can block admins and general users in their organization, and admin and general users cannot block other users. All block operations are logged for audit purposes.

### 12.4 Rate Limiting Implementation

Custom rate limiters are implemented for different operation types to prevent abuse while maintaining system usability. Transfer operations are limited to 10 transfers per minute for regular users, referral registration is limited to 3 registrations per minute for guests, block operations are limited to 5 blocks per minute for regular users, and hierarchy operations are limited to 30 requests per minute for regular users. These limits are configurable and enforced at the API level.

### 12.5 Data Sanitization

Data sanitization is implemented through the sanitizeUserData function that removes sensitive information based on the viewer's tier. Administrators receive complete user data including sensitive information, while other tiers receive progressively limited information based on their hierarchical position. This sanitization occurs at the API level to prevent accidental data exposure and ensure compliance with visibility rules.

## 13. Implementation Details

### 13.1 Database Migration Strategy

The database migration strategy involves comprehensive schema changes to support the hierarchical model. Migration steps include adding new fields to the User model, creating Transfer, ReferralReward, AgencyReferralConfig, and BlockLog models, creating appropriate indexes for performance optimization, seeding existing users with default tier values and invite codes, and establishing foreign key constraints and relationships. Migrations are designed to be reversible and include validation steps.

### 13.2 Controller Implementation

The hierarchy system includes four main controllers with comprehensive functionality. The transfer controller handles secure resource transfers with validation and authorization, the referral controller manages invitation workflows and reward distribution, the block controller implements user interaction controls with hierarchical restrictions, and the hierarchy controller provides organizational management with visibility enforcement. Each controller follows consistent patterns for error handling and security validation.

### 13.3 Middleware Implementation

The middleware implementation focuses on security and access control. The visibility check middleware implements the core security logic for enforcing hierarchical access rules, the authorization middleware validates user permissions for specific operations, the rate limiting middleware prevents abuse through configurable limits, and the audit logging middleware captures all important actions for compliance and security monitoring.

### 13.4 Frontend Implementation

The frontend implementation includes comprehensive user interfaces with access controls. Pages include /invite for invite link and QR code display, /referrals for referral statistics, /transfer for resource transfers, /members for member management (restricted from general users), and /agency/settings for agency configuration. Components include InviteCard, ReferralStats, TransferForm, MemberList, HierarchyTree, BlockButton, AgencyRewardSettings, and TierBadge with appropriate access controls.

## 14. Testing Strategy

### 14.1 Unit Testing Requirements

Unit testing must cover all critical functions including canTransfer for all tier combinations, canBlock for all tier combinations, referral reward calculations for all scenarios, transfer validation logic with edge cases, and checkUserVisibility for all tier combinations. Tests must achieve at least 80% code coverage and include both positive and negative test cases to validate comprehensive security coverage.

### 14.2 Integration Testing Requirements

Integration testing must validate complete API workflows including transfer operations with different user tiers, referral registration flows with reward distribution, block/unblock functionality with proper restrictions, transaction atomicity under various conditions, member list APIs with visibility filtering, search APIs with visibility enforcement, and hierarchy tree APIs with access controls. Tests must validate both successful operations and security violations.

### 14.3 End-to-End Testing Requirements

End-to-end testing must validate complete user workflows including general users inviting friends and receiving rewards, organizations inviting members who join the organization, agencies setting custom rewards that new users receive, organizations transferring points to admins and generals, agencies blocking organizations that cannot login, and comprehensive security scenarios where unauthorized access attempts are properly blocked.

### 14.4 Security Testing Requirements

Security testing must validate all visibility rules and access controls including agency A cannot see organizations of agency B, organization A cannot see admins of organization B, admins cannot see generals of other organizations, generals cannot see other generals, generals cannot access member list pages, and all API endpoints return 403 for unauthorized access attempts. Security tests must attempt to bypass visibility controls and verify that all attempts are properly blocked and logged.

## 15. Deployment and Operations

### 15.1 Environment Configuration

The implementation requires several environment variables for proper operation including BASE_REFERRAL_REWARD for base reward amounts, tier-specific reward variables, transfer limits and rate limiting parameters, invite code configuration, and database connection strings. These variables must be properly configured across development, staging, and production environments with appropriate security measures.

### 15.2 Performance Considerations

Performance optimization includes database indexes for fast hierarchical queries, Redis caching for frequently accessed hierarchy relationships, database connection pooling for high-load scenarios, and pagination for large member lists. The system must maintain sub-second response times even under heavy load while supporting millions of users and complex organizational structures.

### 15.3 Monitoring and Alerting

System monitoring focuses on critical metrics including transfer volumes and patterns, referral conversion rates, block operation frequency, authorization failures, visibility check performance, and repeated unauthorized access attempts. Alerting is configured for anomalous patterns that may indicate security issues or system problems requiring immediate attention.

### 15.4 Backup and Recovery

The implementation includes comprehensive backup procedures for all hierarchy-related data including user relationships, transfer records, referral rewards, and block logs. Recovery procedures are documented and tested to ensure rapid restoration in case of system failures. The backup strategy maintains referential integrity and supports point-in-time recovery for critical operations.

## 16. Future Enhancements

### 16.1 Planned Feature Development

Future enhancements include advanced analytics for detailed hierarchy performance metrics, automated tier promotion based on configurable rules, enhanced referral tracking with multi-level commissions, configurable transfer limits based on user tier and history, comprehensive audit logs for all operations, and bulk transfer operations for enterprise clients. These features will build upon the solid foundation established by the current implementation.

### 16.2 Security Improvements

Planned security enhancements include multi-factor authentication for sensitive operations, IP-based restrictions for additional security layers, AI-powered anomaly detection for suspicious activity identification, end-to-end encryption for sensitive data transmission, and enhanced audit logging with forensic capabilities. These improvements will further strengthen the system's security posture while maintaining usability.

### 16.3 Performance Optimizations

Future performance optimizations include advanced caching strategies for frequently accessed hierarchy data, database query optimization for complex hierarchical operations, horizontal scaling capabilities for high-load scenarios, CDN integration for improved response times, and background processing for heavy operations. These optimizations will ensure the system maintains performance requirements as user volume grows.

### 16.4 Integration Opportunities

The hierarchy system provides integration opportunities with external systems including CRM platforms for customer relationship management, analytics platforms for business intelligence, payment processors for enhanced transfer capabilities, identity providers for advanced authentication scenarios, and compliance tools for regulatory reporting. These integrations will extend the system's functionality while maintaining security and performance standards.

## Conclusion

This specification provides a comprehensive framework for implementing a secure, scalable, and flexible multi-tier user hierarchy and referral system within Smart AI Hub. The security-first approach ensures data privacy while maintaining system usability across all hierarchy levels. The comprehensive specification addresses current business requirements while establishing a solid foundation for future enhancements and growth.

The visibility check middleware serves as the cornerstone of the system's security architecture, preventing unauthorized data access and maintaining strict hierarchy boundaries. All operations are designed with comprehensive security considerations, rate limiting, and detailed audit trails to ensure system integrity and compliance. This implementation represents a significant advancement in Smart AI Hub's user management capabilities and provides the foundation for continued growth and enterprise adoption.

The specification emphasizes the critical importance of security requirements, particularly the visibility rules that prevent unauthorized data access. All implementation efforts must prioritize these security requirements to ensure the system maintains the highest standards of data protection and access control while supporting complex organizational structures and enterprise operations.
