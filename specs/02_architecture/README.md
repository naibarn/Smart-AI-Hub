# Architecture Specification

This directory contains the architecture specification for the Smart AI Hub project. It includes data models, service definitions, API specifications, and architectural diagrams that define how the system is structured and how components interact.

## Contents

### Data Models
The data models define the structure and relationships of data in the system.

- [user.md](data_models/user.md) - User entity model
- [role.md](data_models/role.md) - Role entity model
- [permission.md](data_models/permission.md) - Permission entity model
- [user_role.md](data_models/user_role.md) - User-Role relationship model
- [role_permission.md](data_models/role_permission.md) - Role-Permission relationship model
- [credit_account.md](data_models/credit_account.md) - Credit Account entity model
- [credit_transaction.md](data_models/credit_transaction.md) - Credit Transaction entity model
- [promo_code.md](data_models/promo_code.md) - Promo Code entity model
- [promo_redemption.md](data_models/promo_redemption.md) - Promo Redemption entity model
- [usage_log.md](data_models/usage_log.md) - Usage Log entity model

### Services
The services define the microservice architecture of the system.

- [api_gateway.md](services/api_gateway.md) - API Gateway service specification
- [auth_service.md](services/auth_service.md) - Authentication service specification
- [core_service.md](services/core_service.md) - Core service specification
- [mcp_server.md](services/mcp_server.md) - MCP Server service specification

### API Definitions
The API definitions specify the endpoints and contracts for system APIs.

- [api_definitions/](api_definitions/) - API endpoint specifications and contracts

### C4 Model
The C4 model provides a visual representation of the software architecture.

- [c4_model/](c4_model/) - Context, Container, Component, and Code diagrams