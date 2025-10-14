# FR-2: Role-Based Access Control (RBAC)

## Priority
P0 (Critical)

## Role Hierarchy
```
Super Admin > Admin > Manager > User > Guest
```

## Default Permissions

| Role        | View Dashboard | Use AI Services | Manage Users | Adjust Credits | System Config |
| ----------- | -------------- | --------------- | ------------ | -------------- | ------------- |
| Super Admin | ✓              | ✓               | ✓            | ✓              | ✓             |
| Admin       | ✓              | ✓               | ✓            | ✓              | -             |
| Manager     | ✓              | ✓               | Team only    | Team only      | -             |
| User        | ✓              | ✓               | -            | -              | -             |
| Guest       | ✓              | Limited         | -            | -              | -             |