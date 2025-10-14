# Project Traceability Matrix

This document provides a high-level view of the project's traceability, linking user stories to their implemented requirements and associated epics.

## User Story Traceability

| User Story ID & Title | Implements Requirement | Part of Epic |
|----------------------|----------------------|--------------|
| [US-1: User Registration with Email](specs/01_requirements/user_stories/us_1.md) | [FR-1](specs/01_requirements/functional/fr_1.md) | [Epic 2](specs/03_backlog/epics/epic_2.md) |
| [US-2: Google OAuth Registration](specs/01_requirements/user_stories/us_2.md) | [FR-1](specs/01_requirements/functional/fr_1.md) | [Epic 2](specs/03_backlog/epics/epic_2.md) |
| [US-3: Role Assignment](specs/01_requirements/user_stories/us_3.md) | [FR-2](specs/01_requirements/functional/fr_2.md) | [Epic 2](specs/03_backlog/epics/epic_2.md) |
| [US-4: View Credit Balance](specs/01_requirements/user_stories/us_4.md) | [FR-3](specs/01_requirements/functional/fr_3.md) | [Epic 3](specs/03_backlog/epics/epic_3.md) |
| [US-5: Purchase Credits](specs/01_requirements/user_stories/us_5.md) | [FR-3](specs/01_requirements/functional/fr_3.md) | [Epic 3](specs/03_backlog/epics/epic_3.md) |
| [US-6: Promotional Code Redemption](specs/01_requirements/user_stories/us_6.md) | [FR-3](specs/01_requirements/functional/fr_3.md) | [Epic 3](specs/03_backlog/epics/epic_3.md) |
| [US-7: Access GPT via API](specs/01_requirements/user_stories/us_7.md) | [FR-4](specs/01_requirements/functional/fr_4.md) | [Epic 4](specs/03_backlog/epics/epic_4.md) |
| [US-8: Monitor Usage](specs/01_requirements/user_stories/us_8.md) | [FR-5](specs/01_requirements/functional/fr_5.md) | [Epic 4](specs/03_backlog/epics/epic_4.md) |
| [US-9: Sora2 Video Generator Integration](specs/01_requirements/user_stories/us_9.md) | [FR-AUTH-06](specs/01_requirements/functional/fr_auth_06.md) | [Epic 4](specs/03_backlog/epics/epic_4.md) |
| [US-10: Session-Based Authentication for External Services](specs/01_requirements/user_stories/us_10.md) | [FR-AUTH-05](specs/01_requirements/functional/fr_auth_05.md) | [Epic 4](specs/03_backlog/epics/epic_4.md) |
| [US-11: Credit Management APIs for External Services](specs/01_requirements/user_stories/us_11.md) | [FR-CREDIT-03](specs/01_requirements/functional/fr_credit_03.md), [FR-CREDIT-04](specs/01_requirements/functional/fr_credit_04.md) | [Epic 4](specs/03_backlog/epics/epic_4.md) |

## Summary

- **Total User Stories**: 11
- **Total Requirements**: 10 (some user stories implement multiple requirements)
- **Total Epics**: 3 (Epic 2, Epic 3, and Epic 4)

### Breakdown by Epic:

**Epic 2 - User Management & Authentication**
- US-1: User Registration with Email
- US-2: Google OAuth Registration
- US-3: Role Assignment

**Epic 3 - Credit System**
- US-4: View Credit Balance
- US-5: Purchase Credits
- US-6: Promotional Code Redemption

**Epic 4 - API Integration & External Services**
- US-7: Access GPT via API
- US-8: Monitor Usage
- US-9: Sora2 Video Generator Integration
- US-10: Session-Based Authentication for External Services
- US-11: Credit Management APIs for External Services

This traceability matrix helps ensure that all user stories are properly linked to their requirements and epics, providing clear visibility into the project structure and dependencies.