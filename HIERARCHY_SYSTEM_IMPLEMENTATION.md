---
title: 'Multi-Tier User Hierarchy and Referral System Implementation'
author: 'Development Team'
version: '2.0.0'
status: 'completed'
priority: 'high'
created_at: '2025-01-16'
updated_at: '2025-10-16'
type: 'implementation'
description: "Complete implementation documentation for Smart AI Hub's Multi-tier Hierarchy and Referral System with comprehensive security features"
---

# Multi-Tier User Hierarchy and Referral System Implementation

## 1. Overview

This document provides comprehensive implementation details for the Multi-Tier User Hierarchy and Referral System deployed in Smart AI Hub. The system implements a sophisticated 5-tier hierarchy architecture with strict visibility controls, transfer capabilities, referral functionality, and block/unblock features. The implementation prioritizes security, scalability, and maintainability while ensuring seamless user experience across all hierarchy levels. This system serves as the foundation for user management, organizational structure, and access control within the Smart AI Hub ecosystem.

The implementation follows a security-first approach, with multiple layers of validation and authorization to prevent unauthorized data access and maintain strict hierarchy boundaries. The system is designed to handle complex organizational structures while providing intuitive interfaces for users at all tiers. This document serves as the definitive reference for understanding the complete implementation, including database schemas, API endpoints, security mechanisms, and operational considerations.

## 2. Introduction

Smart AI Hub's Multi-Tier User Hierarchy System addresses the complex requirements of managing users across multiple organizational levels while maintaining strict data privacy and access controls. The system was designed to support enterprise-scale operations with hierarchical relationships between Administrators, Agencies, Organizations, Admins, and General users. Each tier has specific privileges and visibility constraints that are enforced through multiple security layers.

The implementation addresses critical business requirements including organizational management, referral tracking, secure resource transfers, and user interaction controls. The system architecture incorporates modern security practices, comprehensive audit trails, and scalable database design to support growth from hundreds to millions of users. This implementation represents a significant enhancement to Smart AI Hub's user management capabilities, providing the foundation for advanced features and business operations.

## 3. Background

The Multi-Tier Hierarchy System was developed in response to growing organizational complexity within Smart AI Hub's user base. As the platform expanded to serve enterprise clients, agencies, and diverse organizational structures, the need for a sophisticated hierarchy management system became apparent. The existing flat user model was insufficient to support the complex relationships and access control requirements of enterprise clients.

Prior to this implementation, user management relied on basic role-based access control without hierarchical relationships or visibility constraints. This approach created security risks and limited the platform's ability to support complex organizational structures. The new system addresses these limitations while providing a foundation for future enhancements and advanced features.

## 4. Goals and Objectives

The primary goal of this implementation is to establish a secure, scalable, and flexible hierarchy system that supports Smart AI Hub's growth and enterprise requirements. Specific objectives include implementing strict data visibility controls based on hierarchical relationships, enabling secure resource transfers between users, creating a comprehensive referral system with reward mechanisms, and providing robust user interaction controls through block/unblock functionality.

Additional objectives include maintaining high performance and scalability to support millions of users, ensuring comprehensive audit trails for compliance and security monitoring, creating intuitive user interfaces that simplify complex hierarchical relationships, and establishing a foundation for future feature development. The implementation aims to achieve these objectives while maintaining backward compatibility and minimizing disruption to existing users.

## 5. Scope

The implementation scope encompasses the complete hierarchy system including database schema modifications, API endpoint development, security middleware implementation, and user interface components. The system includes user tier management, hierarchical relationship tracking, visibility enforcement mechanisms, transfer functionality for points and credits, referral system with reward distribution, block/unblock capabilities, and comprehensive audit logging.

The scope specifically excludes migration of existing user data beyond the required schema changes, integration with external identity providers beyond the existing authentication system, and implementation of advanced analytics features which are planned for future releases. The implementation focuses on core functionality while establishing a solid foundation for future enhancements.

## 6. Assumptions and Constraints

The implementation assumes that existing user data can be migrated to the new hierarchical model with appropriate default values, that the current authentication system will continue to function with the enhanced user model, and that sufficient database capacity exists to support the additional schema elements and indexes. The system assumes that clients will accept the default hierarchical structure or require minimal customization.

Key constraints include maintaining backward compatibility with existing API endpoints, ensuring no degradation in system performance during implementation, adhering to existing data privacy and security requirements, and completing implementation within allocated development resources. The system must maintain high availability and data integrity throughout the implementation process.

## 7. Stakeholders

Primary stakeholders include the Smart AI Hub development team responsible for implementation and maintenance, system administrators who will manage the hierarchy configuration, enterprise clients who will utilize the hierarchical organization features, and end users across all tiers who interact with the system daily.

Secondary stakeholders include compliance and security teams who must validate the implementation meets regulatory requirements, customer support teams who will assist users with hierarchy-related questions, and business development teams who will leverage the system for enterprise sales. The implementation must address the diverse needs of all stakeholder groups while maintaining system coherence and security.

## 8. Requirements

### 8.1 Functional Requirements

The system must implement a 5-tier hierarchy with strict visibility rules, enable secure transfers of points and credits between authorized users, provide a comprehensive referral system with configurable rewards, support block/unblock functionality with appropriate restrictions, maintain complete audit trails for all operations, and provide intuitive user interfaces for hierarchy management.

### 8.2 Non-Functional Requirements

The system must ensure data privacy through strict access controls, maintain high performance with sub-second response times, provide scalability to support millions of users, ensure 99.9% system availability, implement comprehensive security measures including rate limiting and input validation, and provide detailed logging for monitoring and compliance.

### 8.3 Security Requirements

Security requirements include enforcement of visibility rules at multiple levels, prevention of unauthorized data access through comprehensive validation, protection against common security vulnerabilities, secure handling of sensitive user data, implementation of rate limiting to prevent abuse, and comprehensive audit logging for security monitoring.

## 9. System Architecture

### 9.1 High-Level Architecture

The system follows a microservices architecture with clear separation of concerns between authentication, core business logic, and data persistence. The hierarchy implementation is primarily contained within the core service with appropriate integration with the authentication service for user validation and authorization. The architecture supports horizontal scaling and maintains security through service boundaries and comprehensive API validation.

### 9.2 Component Architecture

The implementation consists of several key components including the hierarchy controller for managing user relationships, visibility middleware for enforcing access controls, transfer controller for secure resource movement, referral controller for managing invitation workflows, block controller for user interaction controls, and comprehensive database models with appropriate relationships and indexes.

### 9.3 Data Architecture

The database architecture implements a hierarchical relationship model using parent references rather than nested sets to optimize for read performance and query simplicity. Additional tables support transfer tracking, referral rewards, and block logging. The schema includes appropriate indexes to maintain performance while supporting complex hierarchical queries and visibility checks.

## 10. Data Models

### 10.1 User Model Enhancements

The User model has been enhanced to support hierarchical relationships through the addition of tier, parentAgencyId, parentOrganizationId, inviteCode, invitedBy, and inviteCodeUsed fields. The tier field implements an enum with values 'administrator', 'agency', 'organization', 'admin', and 'general' to define the 5-tier hierarchy. Parent reference fields establish the hierarchical relationships while maintaining referential integrity through foreign key constraints.

### 10.2 Transfer Model

The Transfer model tracks all point and credit transfers between users with comprehensive fields including fromUserId, toUserId, type, amount, status, created_at, and processed_at timestamps. The model supports both points and credits through the type field and maintains transaction status through the status field with values 'pending', 'completed', and 'failed'. All transfers are logged for audit purposes and include complete user reference information.

### 10.3 ReferralReward Model

The ReferralReward model tracks all referral transactions including referrerId, refereeId, referrerTier, refereeTier, referrerRewardPoints, refereeRewardPoints, agencyBonusPoints, agencyId, status, and timestamp fields. This model enables comprehensive tracking of referral rewards and supports complex reward structures based on hierarchical relationships. The status field tracks reward processing through 'pending', 'processed', and 'failed' states.

### 10.4 AgencyReferralConfig Model

The AgencyReferralConfig model enables configurable reward structures for agencies with fields including agencyId, organizationRewardPoints, adminRewardPoints, generalRewardPoints, isActive, and created_at. This model allows agencies to customize their referral rewards while maintaining system-wide consistency and validation. The isActive field enables temporary reward structure modifications without data loss.

### 10.5 BlockLog Model

The BlockLog model maintains comprehensive records of all block/unblock operations with fields including blockerId, blockedId, blockerTier, blockedTier, blockReason, isActive, created_at, and unblocked_at. This model provides complete audit trails for user interaction controls and supports both temporary and permanent blocks. The isActive field enables efficient querying of current block status while maintaining historical records.

## 11. API Specifications

### 11.1 Transfer System Endpoints

The transfer system provides comprehensive endpoints for secure resource movement including POST /api/v1/transfer/points for point transfers, POST /api/v1/transfer/credits for credit transfers, GET /api/v1/transfer/history for transfer history, and GET /api/v1/transfer/validate for transfer validation. All endpoints implement comprehensive validation, rate limiting, and security checks to prevent unauthorized transfers and maintain system integrity.

### 11.2 Referral System Endpoints

The referral system endpoints support complete invitation workflows including GET /api/v1/referral/invite-link for retrieving invite links and QR codes, GET /api/v1/referral/stats for referral statistics, POST /api/v1/referral/register for registration with invite codes, and GET /api/v1/referral/rewards for reward history. These endpoints implement comprehensive validation and reward calculation logic to ensure accurate referral tracking and reward distribution.

### 11.3 Block System Endpoints

The block system endpoints provide user interaction controls including POST /api/v1/block/block for blocking users, POST /api/v1/block/unblock for unblocking users, GET /api/v1/block/blocked for retrieving blocked user lists, and GET /api/v1/block/check/:targetUserId for checking block status. These endpoints implement hierarchical restrictions and comprehensive validation to prevent abuse and maintain appropriate user interactions.

### 11.4 Hierarchy System Endpoints

The hierarchy system endpoints support organizational management including GET /api/v1/hierarchy/members for retrieving hierarchy members with visibility filters, GET /api/v1/hierarchy/stats for hierarchy statistics, GET /api/v1/hierarchy/users/:userId for user details with visibility checks, and GET /api/v1/hierarchy/tree for hierarchy tree structures. These endpoints implement strict visibility enforcement and comprehensive security checks to prevent unauthorized data access.

## 12. Security Considerations

### 12.1 Visibility Check Middleware

The visibilityCheckRaw.ts middleware represents the most critical security component in the hierarchy system. This middleware enforces strict visibility rules based on user hierarchy and prevents unauthorized data access through comprehensive validation. The checkUserVisibility function implements the core security logic and is applied to all sensitive operations to ensure data privacy and access control.

### 12.2 Rate Limiting Implementation

Custom rate limiters are implemented for different operation types to prevent abuse while maintaining system usability. Transfer operations are limited to 10 transfers per minute for regular users, referral registration is limited to 3 registrations per minute for guests, block operations are limited to 5 blocks per minute for regular users, and hierarchy operations are limited to 30 requests per minute for regular users. These limits are configurable and can be adjusted based on system load and security requirements.

### 12.3 Data Sanitization

The sanitizeUserData function implements tier-based data filtering to ensure users only receive appropriate information based on their hierarchical position. Administrators receive complete user data, Agencies receive limited information about users under them, Organizations receive basic information about their members, Admins receive very limited information, and General users receive only their own data. This sanitization occurs at the API level to prevent accidental data exposure.

### 12.4 Transaction Safety

All transfer operations use database transactions to ensure atomicity and prevent partial updates that could lead to data inconsistency. The implementation includes comprehensive validation before transaction execution and proper rollback mechanisms for failed operations. This approach ensures data integrity even under high load conditions or system failures.

## 13. Implementation Details

### 13.1 Controller Implementation

The hierarchy system includes four main controllers: transfer.controller.ts handles secure resource transfers with comprehensive validation, referral.controller.ts manages invitation workflows and reward distribution, block.controller.ts implements user interaction controls with hierarchical restrictions, and hierarchy.controller.ts provides organizational management with visibility enforcement. Each controller follows consistent patterns for error handling, validation, and response formatting.

### 13.2 Route Configuration

The route configuration implements comprehensive security through middleware application, request validation, and response formatting. All routes include authentication middleware, visibility checks where appropriate, rate limiting, input validation, and comprehensive error handling. The route structure follows RESTful conventions while maintaining security best practices.

### 13.3 Database Migration Strategy

The implementation includes comprehensive database migrations for both core and auth services to support the new hierarchical model. Migrations are designed to be reversible and include appropriate rollback procedures. The migration strategy includes data validation steps to ensure referential integrity and performance optimization through appropriate index creation.

### 13.4 Utility Functions

The implementation includes specialized utility functions including referralUtils.ts for invitation code generation and validation, visibility calculation functions for hierarchical relationship determination, transfer validation functions for authorization checks, and reward calculation functions for referral processing. These utilities encapsulate complex business logic and promote code reusability across the system.

## 14. Testing Strategy

### 14.1 Security Testing

Security testing focuses on visibility bypass attempts to ensure users cannot access data outside their hierarchy, transfer authorization to verify transfers respect hierarchy rules, rate limiting validation to confirm abuse prevention mechanisms, and data sanitization verification to ensure sensitive data is properly filtered. Security tests employ both positive and negative test cases to validate comprehensive security coverage.

### 14.2 Functional Testing

Functional testing validates complete user workflows including referral flow testing for registration and reward distribution, transfer flow testing for point and credit movements, block flow testing for user interaction controls, and hierarchy navigation testing for tree structure and member list visibility. These tests ensure the system meets all functional requirements while maintaining security constraints.

### 14.3 Performance Testing

Performance testing validates system behavior under load including concurrent user operations, large hierarchy traversals, high-volume transfer processing, and complex visibility calculations. These tests ensure the system maintains performance requirements while supporting millions of users and complex organizational structures.

### 14.4 Integration Testing

Integration testing validates end-to-end workflows across system components including complete referral registration flows, transfer operations with visibility enforcement, block operations with hierarchical restrictions, and hierarchy management with proper security controls. These tests ensure all components work together seamlessly while maintaining security and performance requirements.

## 15. Deployment and Operations

### 15.1 Database Migration Process

The database migration process requires careful execution in specific order to maintain system integrity. The process begins with core service migration to establish the base schema, followed by auth service migration to ensure authentication consistency, and concludes with schema consistency verification to validate referential integrity. Each migration step includes validation and rollback procedures to ensure safe deployment.

### 15.2 Environment Configuration

The implementation requires several environment variables for proper operation including INVITE_BASE_URL for invite link generation, database connection strings for both core and auth services, Redis configuration for rate limiting and caching, and security configuration parameters for visibility enforcement. These variables must be properly configured across development, staging, and production environments.

### 15.3 Monitoring and Alerting

System monitoring focuses on critical metrics including transfer success/failure rates, referral conversion rates, block operation frequency, and visibility check failures. These metrics provide insights into system health and security posture. Alerting is configured for anomalous patterns that may indicate security issues or system problems requiring immediate attention.

### 15.4 Backup and Recovery

The implementation includes comprehensive backup procedures for all hierarchy-related data including user relationships, transfer records, referral rewards, and block logs. Recovery procedures are documented and tested to ensure rapid restoration in case of system failures. The backup strategy maintains referential integrity and supports point-in-time recovery for critical operations.

## 16. Future Enhancements

### 16.1 Planned Feature Development

Future enhancements include advanced analytics for detailed hierarchy performance metrics, automated tier promotion based on configurable rules, enhanced referral tracking with multi-level commissions, configurable transfer limits based on user tier and history, and comprehensive audit logs for all operations. These features will build upon the solid foundation established by the current implementation.

### 16.2 Security Improvements

Planned security enhancements include multi-factor authentication for sensitive operations, IP-based restrictions for additional security layers, AI-powered anomaly detection for suspicious activity identification, and end-to-end encryption for sensitive data transmission. These improvements will further strengthen the system's security posture while maintaining usability.

### 16.3 Performance Optimizations

Future performance optimizations include caching strategies for frequently accessed hierarchy data, database query optimization for complex hierarchical operations, horizontal scaling capabilities for high-load scenarios, and CDN integration for improved response times. These optimizations will ensure the system maintains performance requirements as user volume grows.

### 16.4 Integration Opportunities

The hierarchy system provides integration opportunities with external systems including CRM platforms for customer relationship management, analytics platforms for business intelligence, payment processors for enhanced transfer capabilities, and identity providers for advanced authentication scenarios. These integrations will extend the system's functionality while maintaining security and performance standards.

## Conclusion

The Multi-Tier User Hierarchy and Referral System implementation provides a robust, secure, and scalable foundation for Smart AI Hub's organizational management requirements. The security-first approach ensures data privacy while maintaining system usability across all hierarchy levels. The comprehensive implementation addresses current business requirements while establishing a solid foundation for future enhancements.

The visibility check middleware serves as the cornerstone of the system's security architecture, preventing unauthorized data access and maintaining strict hierarchy boundaries. All operations are designed with comprehensive security considerations, rate limiting, and detailed audit trails to ensure system integrity and compliance. This implementation represents a significant advancement in Smart AI Hub's user management capabilities and provides the foundation for continued growth and innovation.
