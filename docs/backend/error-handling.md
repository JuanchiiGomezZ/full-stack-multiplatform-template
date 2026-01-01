# Error Handling

## Overview

The application uses a global exception filter (`AllExceptionsFilter`) that catches all errors and returns consistent responses.

## Standard Response Formats

### Success Response

All successful responses are wrapped by `TransformInterceptor`:

```json
{
  "success": true,
  "data": {
    /* actual response data */
  },
  "timestamp": "2026-01-01T18:00:00.000Z"
}
```

### Error Response

All errors return:

```json
{
  "statusCode": 400,
  "message": "Error message here",
  "error": "Bad Request",
  "timestamp": "2026-01-01T18:00:00.000Z",
  "path": "/api/users"
}
```

## AllExceptionsFilter

Location: `src/core/filters/all-exceptions.filter.ts`

Handles:

- **HttpException**: NestJS HTTP exceptions
- **PrismaClientKnownRequestError**: Database errors
- **ZodError**: Validation errors (via nestjs-zod)
- **Error**: Generic JavaScript errors

## Throwing Errors

### HTTP Exceptions

```typescript
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from "@nestjs/common";

// 404 Not Found
throw new NotFoundException("User not found");

// 400 Bad Request
throw new BadRequestException("Invalid input");

// 409 Conflict
throw new ConflictException("Email already registered");

// 403 Forbidden
throw new ForbiddenException("Access denied");

// 401 Unauthorized
throw new UnauthorizedException("Invalid credentials");
```

### Custom Error Messages

```typescript
// Simple message
throw new NotFoundException("User not found");

// With additional info
throw new BadRequestException({
  message: "Validation failed",
  errors: ["email is invalid", "password too short"],
});
```

## Prisma Error Handling

The filter automatically handles Prisma errors:

| Prisma Code | HTTP Status | Message                       |
| ----------- | ----------- | ----------------------------- |
| P2002       | 409         | Unique constraint violation   |
| P2025       | 404         | Record not found              |
| P2003       | 400         | Foreign key constraint failed |

Example:

```typescript
// This will automatically return 409 if email already exists
async create(dto: CreateUserDto) {
  return this.prisma.user.create({
    data: { email: dto.email },
  });
  // If email exists: { statusCode: 409, message: "Unique constraint..." }
}
```

## Custom Error Handling

For cases where you need specific error handling:

```typescript
async findOne(id: string) {
  const user = await this.prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new NotFoundException(`User with ID ${id} not found`);
  }

  return user;
}
```

## TransformInterceptor

Location: `src/core/interceptors/transform.interceptor.ts`

Wraps all successful responses:

```typescript
// Controller returns
return { id: '123', name: 'John' };

// Client receives
{
  "success": true,
  "data": { "id": "123", "name": "John" },
  "timestamp": "2026-01-01T18:00:00.000Z"
}
```

## Common HTTP Status Codes

| Status | Meaning               | When to Use                        |
| ------ | --------------------- | ---------------------------------- |
| 200    | OK                    | Successful GET, PATCH              |
| 201    | Created               | Successful POST (resource created) |
| 204    | No Content            | Successful DELETE                  |
| 400    | Bad Request           | Invalid input, validation failed   |
| 401    | Unauthorized          | Missing or invalid token           |
| 403    | Forbidden             | Valid token but insufficient perms |
| 404    | Not Found             | Resource doesn't exist             |
| 409    | Conflict              | Duplicate entry, constraint error  |
| 422    | Unprocessable Entity  | Semantic error in request          |
| 500    | Internal Server Error | Unexpected server error            |

## Error Logging

All errors are automatically logged with:

- HTTP method and URL
- Status code
- Error message
- Stack trace (in development)

```typescript
// Logged output example:
// [ExceptionsFilter] GET /api/users/123 - 404 - User not found
```
