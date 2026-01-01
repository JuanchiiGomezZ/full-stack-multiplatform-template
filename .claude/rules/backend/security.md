# Backend: Security

<!-- AUTO-GENERATED: START -->

## Authentication Stack

- **Strategy:** JWT (JSON Web Tokens)
- **Library:** `@nestjs/jwt` + `@nestjs/passport`
- **Password Hashing:** bcrypt (salt rounds: 12)
- **Refresh Tokens:** UUID-based with rotation

## Authentication Flow

### Registration

**Endpoint:** `POST /auth/register`

**File:** `backend/src/modules/auth/auth.service.ts:21-55`

```typescript
async register(dto: RegisterDto) {
  // 1. Check if email exists
  const existingUser = await this.prisma.user.findUnique({
    where: { email: dto.email },
  });

  if (existingUser) {
    throw new ConflictException('Email already registered');
  }

  // 2. Hash password
  const hashedPassword = await bcrypt.hash(dto.password, 12);

  // 3. Create user
  const user = await this.prisma.user.create({
    data: {
      email: dto.email,
      password: hashedPassword,
      firstName: dto.firstName,
      lastName: dto.lastName,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      createdAt: true,
    },
  });

  // 4. Generate tokens
  const tokens = await this.generateTokens(user.id, user.email, user.role);

  return { user, ...tokens };
}
```

### Login

**Endpoint:** `POST /auth/login`

**File:** `backend/src/modules/auth/auth.service.ts:57-93`

```typescript
async login(dto: LoginDto) {
  // 1. Find user
  const user = await this.prisma.user.findUnique({
    where: { email: dto.email, deletedAt: null },
  });

  if (!user) {
    throw new UnauthorizedException('Invalid credentials');
  }

  // 2. Check if active
  if (!user.isActive) {
    throw new UnauthorizedException('Account is inactive');
  }

  // 3. Verify password
  const isPasswordValid = await bcrypt.compare(dto.password, user.password);

  if (!isPasswordValid) {
    throw new UnauthorizedException('Invalid credentials');
  }

  // 4. Generate tokens
  const tokens = await this.generateTokens(
    user.id,
    user.email,
    user.role,
    user.organizationId ?? undefined,
  );

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    },
    ...tokens,
  };
}
```

**Security Notes:**
- Generic error message ("Invalid credentials") prevents email enumeration
- Account status checked before password verification
- Password never returned in response

### Token Generation

**File:** `backend/src/modules/auth/auth.service.ts:140-181`

```typescript
private async generateTokens(
  userId: string,
  email: string,
  role: string,
  organizationId?: string,
) {
  const payload = { sub: userId, email, role, organizationId };

  // Access token (short-lived)
  const accessToken = this.jwtService.sign(payload, {
    secret: this.configService.get<string>('jwt.secret'),
    expiresIn: '15m', // 15 minutes
  });

  // Refresh token (long-lived)
  const refreshToken = uuidv4();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  // Store refresh token
  await this.prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId,
      organizationId,
      expiresAt,
    },
  });

  return { accessToken, refreshToken };
}
```

**JWT Payload:**
```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "role": "USER",
  "organizationId": "org-id",
  "iat": 1234567890,
  "exp": 1234568790
}
```

### Refresh Tokens

**Endpoint:** `POST /auth/refresh`

**File:** `backend/src/modules/auth/auth.service.ts:95-124`

```typescript
async refreshTokens(refreshToken: string) {
  // 1. Validate token
  const storedToken = await this.prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true },
  });

  if (
    !storedToken ||
    storedToken.revokedAt ||
    storedToken.expiresAt < new Date()
  ) {
    throw new UnauthorizedException('Invalid refresh token');
  }

  // 2. Revoke old token (rotation)
  await this.prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: { revokedAt: new Date() },
  });

  // 3. Generate new tokens
  const { user } = storedToken;
  const tokens = await this.generateTokens(
    user.id,
    user.email,
    user.role,
    user.organizationId ?? undefined,
  );

  return tokens;
}
```

**Token Rotation:** Old refresh token is revoked when new one is issued.

### Logout

**Endpoint:** `POST /auth/logout`

```typescript
async logout(refreshToken: string) {
  await this.prisma.refreshToken.updateMany({
    where: { token: refreshToken },
    data: { revokedAt: new Date() },
  });
}
```

**Logout All Devices:**

```typescript
async logoutAll(userId: string) {
  await this.prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
```

## Guards

### JWT Guard

**File:** `backend/src/modules/auth/guards/jwt-auth.guard.ts`

```typescript
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
```

**Global application:**

**File:** `backend/src/app.module.ts`

```typescript
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
```

**All endpoints require JWT by default.**

**Skip authentication:**
```typescript
import { Public } from '../../common/decorators/public.decorator';

@Public()
@Post('login')
login(@Body() dto: LoginDto) {
  return this.authService.login(dto);
}
```

### Roles Guard

**File:** `backend/src/modules/auth/guards/roles.guard.ts`

```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true; // No roles required
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.role === role);
  }
}
```

**Usage:**
```typescript
@Post()
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
create(@Body() dto: CreateUserDto) {
  return this.usersService.create(dto);
}
```

## JWT Strategy

**File:** `backend/src/modules/auth/strategies/jwt.strategy.ts`

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../core/database/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.secret'),
    });
  }

  async validate(payload: any) {
    // Verify user still exists and is active
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub, deletedAt: null },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    };
  }
}
```

**Payload validation ensures:**
- User exists in database
- User is not soft-deleted
- User is active

## Password Security

### Hashing

```typescript
import * as bcrypt from 'bcrypt';

// Hash with 12 salt rounds
const hashedPassword = await bcrypt.hash(password, 12);

// Verify
const isValid = await bcrypt.compare(plainPassword, hashedPassword);
```

**Salt rounds: 12** - Good balance between security and performance

### Password Requirements

Enforced via DTO validation:

```typescript
export const registerSchema = z.object({
  password: z.string().min(8),
  // Add more rules as needed:
  // .regex(/[A-Z]/, 'Must contain uppercase')
  // .regex(/[0-9]/, 'Must contain number')
});
```

## Rate Limiting

**Module:** `@nestjs/throttler`

**File:** `backend/src/core/throttler/throttler.module.ts`

```typescript
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 10,  // 10 requests per minute
      },
    ]),
  ],
})
export class AppThrottlerModule {}
```

**Apply to specific routes:**
```typescript
import { Throttle } from '@nestjs/throttler';

@Throttle({ default: { limit: 3, ttl: 60000 } })
@Post('login')
login(@Body() dto: LoginDto) {
  return this.authService.login(dto);
}
```

**Result:** Max 3 login attempts per minute per IP.

## CORS Configuration

**File:** `backend/src/main.ts`

```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL || 'http://localhost:4000',
  credentials: true,
});
```

## Helmet (Security Headers)

```bash
npm install --save helmet
```

**File:** `backend/src/main.ts`

```typescript
import helmet from 'helmet';

app.use(helmet());
```

Adds security headers:
- `X-Frame-Options`
- `X-Content-Type-Options`
- `Strict-Transport-Security`

## Environment Variables

**Required:**
```bash
JWT_SECRET=your-secret-at-least-32-characters-long
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

**Generate secure secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Best Practices

### ✅ DO

- Use bcrypt with salt rounds >= 10
- Rotate refresh tokens on use
- Validate JWT payload against database
- Use HTTPS in production
- Set short expiry on access tokens (15m)
- Implement rate limiting on auth endpoints
- Use generic error messages (prevent enumeration)
- Store tokens securely on client (httpOnly cookies preferred)

### ❌ DON'T

- Return password in any response
- Use predictable refresh tokens
- Skip user validation in JWT strategy
- Allow unlimited login attempts
- Expose sensitive errors to client
- Store plaintext passwords
- Use weak JWT secrets

## Multi-tenancy Security

Enforce organization boundaries:

```typescript
async findAll(pagination: PaginationDto, user: JwtPayload) {
  const where = {
    deletedAt: null,
    organizationId: user.organizationId, // Only user's org
  };

  return this.prisma.resource.findMany({ where });
}
```

**JWT includes `organizationId`** - use it to filter all queries.

<!-- AUTO-GENERATED: END -->
