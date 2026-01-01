# Authentication

## Overview

The authentication system uses JWT tokens with refresh token rotation:

- **Access Token**: Short-lived (15 min), sent in Authorization header
- **Refresh Token**: Long-lived (7 days), stored in database, used to get new access tokens

## Auth Flow

```
1. User registers → POST /api/auth/register
2. User logs in → POST /api/auth/login → Returns { accessToken, refreshToken }
3. Client stores tokens
4. Client sends accessToken in Authorization header
5. When accessToken expires, client calls POST /api/auth/refresh with refreshToken
6. On logout → POST /api/auth/logout → Revokes refreshToken
```

## JWT Strategy

Location: `src/modules/auth/strategies/jwt.strategy.ts`

The JWT strategy validates access tokens and populates `request.user`:

```typescript
// Payload stored in JWT
interface JwtPayload {
  sub: string; // User ID
  email: string;
  role: Role;
  organizationId?: string;
}
```

## Guards

### JwtAuthGuard

Applied globally - all routes require authentication by default.

Location: `src/modules/auth/guards/jwt-auth.guard.ts`

```typescript
// All routes are protected by default
// Use @Public() decorator for public routes
```

### RolesGuard

Checks if user has required role(s).

Location: `src/modules/auth/guards/roles.guard.ts`

```typescript
// Only allows ADMIN or SUPER_ADMIN
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@Delete(':id')
remove(@Param('id') id: string) { }
```

## Decorators

### @Public()

Mark route as public (no authentication required):

```typescript
import { Public } from '@/common/decorators';

@Public()
@Post('login')
login(@Body() dto: LoginDto) { }
```

### @Roles()

Restrict route to specific roles:

```typescript
import { Roles } from '@/common/decorators';
import { Role } from '@prisma/client';

// Allow only admins
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@Get('admin-only')
adminRoute() { }

// Allow multiple roles
@Roles(Role.USER, Role.ADMIN, Role.SUPER_ADMIN)
@Get('users')
usersRoute() { }
```

**Role Hierarchy** (defined in `@prisma/client`):

- `USER`: Regular user
- `ADMIN`: Can manage users in their organization
- `SUPER_ADMIN`: Full system access

### @CurrentUser()

Get the authenticated user:

```typescript
import { CurrentUser } from '@/common/decorators';

interface AuthUser {
  id: string;
  email: string;
  role: Role;
  organizationId?: string;
}

@Get('me')
getProfile(@CurrentUser() user: AuthUser) {
  return this.usersService.findOne(user.id);
}

// Get specific field
@Get('my-id')
getId(@CurrentUser('id') userId: string) {
  return { userId };
}
```

## Auth Endpoints

| Method | Endpoint             | Public | Description          |
| ------ | -------------------- | ------ | -------------------- |
| POST   | `/api/auth/register` | ✅     | Create new user      |
| POST   | `/api/auth/login`    | ✅     | Authenticate user    |
| POST   | `/api/auth/refresh`  | ✅     | Refresh access token |
| POST   | `/api/auth/logout`   | ✅     | Revoke refresh token |

## Configuration

Environment variables in `.env`:

```env
# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_REFRESH_EXPIRES_IN=7d
```

## Protecting Routes

### Default (Protected)

```typescript
// All routes are protected by default
@Get('users')
findAll() { }  // Requires valid accessToken
```

### Public Route

```typescript
@Public()
@Get('health')
health() { }  // No auth needed
```

### Role-Based

```typescript
// Only ADMIN can access
@Roles(Role.ADMIN)
@Delete('users/:id')
deleteUser(@Param('id') id: string) { }
```

### Combining Decorators

```typescript
// Protected + Admin only
@Roles(Role.SUPER_ADMIN)
@Delete('dangerous-action')
dangerousAction() { }

// Note: @Public() overrides @Roles()
// Don't use both on same route
```

## Error Responses

| Status | Message                  | Cause                      |
| ------ | ------------------------ | -------------------------- |
| 401    | Unauthorized             | Missing or invalid token   |
| 401    | Invalid credentials      | Wrong email/password       |
| 401    | Invalid refresh token    | Expired or revoked refresh |
| 403    | Forbidden                | Insufficient role          |
| 409    | Email already registered | Duplicate registration     |
