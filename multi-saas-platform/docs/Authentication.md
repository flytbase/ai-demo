# Authentication and Authorization System

This document describes the authentication and authorization system implemented in our multi-tenant SaaS platform.

## Overview

The system provides a comprehensive authentication and authorization framework with the following features:

- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- Permission-based fine-grained access control
- Tenant awareness for proper data isolation
- Secure password handling with bcrypt
- Token management including revocation
- Multi-level role hierarchy

## Authentication Flow

### 1. Registration

1. User registers with email, password, and optional tenant information
2. Password is hashed using bcrypt and stored
3. User is assigned a default role based on tenant context
4. Access and refresh tokens are generated and returned
5. Email verification can be enabled for added security

### 2. Login

1. User provides email and password credentials
2. System validates credentials against stored user data
3. On successful validation, access and refresh tokens are generated
4. Tokens include user identity, tenant context, roles, and permissions
5. User's last login timestamp is updated
6. Tokens are returned to the client

### 3. Token Refresh

1. Client sends a refresh token when access token expires
2. System validates the refresh token (not expired, not revoked)
3. Once used, the refresh token is revoked (one-time use)
4. New access and refresh tokens are generated and returned
5. This approach provides enhanced security through token rotation

### 4. Logout

1. User logs out by sending request with their tokens
2. System revokes all refresh tokens for the user
3. Client discards all tokens

## Authorization System

### 1. Roles

Roles are collections of permissions that define what actions a user can perform:

- **Global Roles**: Available across all tenants (e.g., "admin", "user")
- **Tenant-Specific Roles**: Created and managed within each tenant's context
- **Role Hierarchy**: Roles can have a parent role, inheriting its permissions

### 2. Permissions

Permissions represent fine-grained access control to resources:

- Format: `resource:action` (e.g., "users:read", "tenants:create")
- Each permission controls access to a specific operation on a resource
- Permissions can be global or tenant-specific

### 3. Guards

Several guards protect routes based on different criteria:

- **JwtAuthGuard**: Validates JWT tokens and ensures authentication
- **RolesGuard**: Checks if a user has the required roles for a route
- **PermissionsGuard**: Ensures user has specific permissions for an operation
- **TenantGuard**: Verifies proper tenant context for tenant-specific operations

## Tenant-Aware Authentication

The system maintains tenant context throughout the authentication process:

1. Tenant info is extracted from:
   - Request headers (`x-tenant-id`)
   - Subdomains (e.g., `tenant1.example.com`)
   - JWT payload
   
2. This context is maintained using:
   - JWT claims that include tenant ID
   - Refresh tokens that store tenant context
   - AsyncLocalStorage to maintain context across async operations

3. All database operations respect tenant isolation:
   - Schema-based separation in PostgreSQL
   - Query filters based on tenant ID
   - Tenant-aware repositories

## Implementation Details

### 1. Entities

- **User**: Core user account information
- **Role**: Role definitions and permissions collections
- **Permission**: Individual access control entries
- **RefreshToken**: Token storage for refresh management

### 2. Services

- **AuthService**: Core authentication logic
- **RoleService**: Role management
- **PermissionService**: Permission management
- **RefreshTokenService**: Token handling and rotation

### 3. Security Measures

- Passwords are hashed with bcrypt using appropriate work factors
- JWTs are signed with secure secrets
- Refresh tokens are rotated (one-time use)
- Token expiration is enforced
- Proper CORS and other HTTP security headers are implemented

## API Endpoints

| Method | Endpoint           | Description                                |
|--------|--------------------|--------------------------------------------|
| POST   | /auth/register     | Register a new user                        |
| POST   | /auth/login        | Authenticate and receive tokens            |
| POST   | /auth/refresh-token| Refresh access token                       |
| POST   | /auth/logout       | Logout and revoke tokens                   |
| GET    | /auth/me           | Get current user profile                   |

## Usage Examples

### Protecting a Route with JWT Authentication

```typescript
@UseGuards(JwtAuthGuard)
@Get('profile')
getCurrentUser(@CurrentUser() user: User) {
  return user;
}
```

### Requiring Specific Roles

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'manager')
@Post('users')
createUser(@Body() createUserDto: CreateUserDto) {
  // Only admins and managers can create users
}
```

### Requiring Specific Permissions

```typescript
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('users:create')
@Post('users')
createUser(@Body() createUserDto: CreateUserDto) {
  // Only users with 'users:create' permission can create users
}
```

### Public Routes (No Authentication)

```typescript
@Public()
@Get('public-data')
getPublicData() {
  // Available without authentication
}
```