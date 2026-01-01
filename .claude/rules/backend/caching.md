# Backend: Caching

<!-- AUTO-GENERATED: START -->

## Stack

- **Cache Store:** Redis (via ioredis)
- **NestJS Module:** `@nestjs/cache-manager`
- **Cache Manager:** `cache-manager-ioredis-yet`

## Configuration

**File:** `backend/src/core/cache/cache.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-ioredis-yet';

@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        store: await redisStore({
          host: configService.get('redis.host'),
          port: configService.get('redis.port'),
          password: configService.get('redis.password'),
          ttl: configService.get('cache.ttl') || 3600, // 1 hour default
        }),
      }),
    }),
  ],
  exports: [CacheModule],
})
export class RedisCacheModule {}
```

**Environment variables:**
```bash
REDIS_URL=redis://localhost:6379
CACHE_TTL=3600  # Default TTL in seconds
```

## Using Cache in Services

### Basic Usage

```typescript
import { Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class UsersService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private prisma: PrismaService,
  ) {}

  async findOne(id: string) {
    const cacheKey = `user:${id}`;

    // Try cache first
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from database
    const user = await this.prisma.user.findUnique({
      where: { id, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Store in cache (1 hour TTL)
    await this.cacheManager.set(cacheKey, user, 3600);

    return user;
  }
}
```

### Cache Methods

```typescript
// Get
const value = await this.cacheManager.get('key');

// Set with custom TTL
await this.cacheManager.set('key', value, 1800); // 30 minutes

// Delete
await this.cacheManager.del('key');

// Delete multiple
await this.cacheManager.store.mdel('key1', 'key2', 'key3');

// Reset all cache
await this.cacheManager.reset();
```

## Cache Patterns

### Cache-Aside (Lazy Loading)

```typescript
async findAll(pagination: PaginationDto) {
  const cacheKey = `users:page:${pagination.page}:limit:${pagination.limit}`;

  // 1. Check cache
  const cached = await this.cacheManager.get(cacheKey);
  if (cached) {
    return cached;
  }

  // 2. Query database
  const result = await this.prisma.user.findMany({
    where: { deletedAt: null },
    skip: (pagination.page - 1) * pagination.limit,
    take: pagination.limit,
  });

  // 3. Store in cache
  await this.cacheManager.set(cacheKey, result, 600); // 10 minutes

  return result;
}
```

### Write-Through Cache

```typescript
async update(id: string, dto: UpdateUserDto) {
  // 1. Update database
  const user = await this.prisma.user.update({
    where: { id },
    data: dto,
  });

  // 2. Update cache immediately
  const cacheKey = `user:${id}`;
  await this.cacheManager.set(cacheKey, user, 3600);

  return user;
}
```

### Cache Invalidation

```typescript
async remove(id: string) {
  // 1. Soft delete in database
  await this.prisma.user.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  // 2. Invalidate cache
  await this.cacheManager.del(`user:${id}`);

  // 3. Invalidate list caches (use pattern matching)
  // Note: Pattern deletion requires ioredis
  const keys = await this.cacheManager.store.keys('users:page:*');
  if (keys.length > 0) {
    await this.cacheManager.store.mdel(...keys);
  }
}
```

## Cache Key Strategies

### Namespacing

```typescript
// User caches
`user:${userId}`
`user:email:${email}`
`users:page:${page}:limit:${limit}`

// Organization caches
`org:${orgId}`
`org:${orgId}:users`

// Feature-specific
`auth:refresh:${token}`
`api:rate-limit:${ip}`
```

### Dynamic Keys

```typescript
class CacheKeyBuilder {
  static user(id: string) {
    return `user:${id}`;
  }

  static usersByOrg(orgId: string, page: number, limit: number) {
    return `users:org:${orgId}:page:${page}:limit:${limit}`;
  }

  static authToken(token: string) {
    return `auth:token:${token}`;
  }
}

// Usage
const cacheKey = CacheKeyBuilder.user(userId);
```

## TTL Strategy

```typescript
const TTL = {
  SHORT: 300,       // 5 minutes - frequently changing data
  MEDIUM: 1800,     // 30 minutes - moderate change rate
  LONG: 3600,       // 1 hour - rarely changing data
  VERY_LONG: 86400, // 24 hours - static data
};

// User profile (changes occasionally)
await this.cacheManager.set(key, user, TTL.LONG);

// List data (changes frequently)
await this.cacheManager.set(key, users, TTL.SHORT);

// Config/settings (rarely changes)
await this.cacheManager.set(key, config, TTL.VERY_LONG);
```

## Cache Decorator

**File:** `backend/src/common/decorators/cache.decorator.ts`

```typescript
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';

export function Cacheable(ttl: number = 3600) {
  const injectCache = Inject(CACHE_MANAGER);

  return (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor,
  ) => {
    injectCache(target, 'cacheManager');

    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cache: Cache = this.cacheManager;
      const cacheKey = `${target.constructor.name}:${propertyName}:${JSON.stringify(args)}`;

      const cached = await cache.get(cacheKey);
      if (cached) {
        return cached;
      }

      const result = await method.apply(this, args);
      await cache.set(cacheKey, result, ttl);

      return result;
    };
  };
}
```

**Usage:**
```typescript
@Injectable()
export class UsersService {
  @Cacheable(3600) // Cache for 1 hour
  async findOne(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }
}
```

## Rate Limiting with Cache

```typescript
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class RateLimiter {
  constructor(@Inject(CACHE_MANAGER) private cache: Cache) {}

  async checkLimit(key: string, limit: number, window: number) {
    const current = (await this.cache.get<number>(key)) || 0;

    if (current >= limit) {
      throw new HttpException('Rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
    }

    await this.cache.set(key, current + 1, window);
  }
}

// Usage
async login(dto: LoginDto, ip: string) {
  const rateLimitKey = `login:${ip}`;
  await this.rateLimiter.checkLimit(rateLimitKey, 5, 60); // 5 attempts per minute

  return this.authService.login(dto);
}
```

## Cache Warming

Pre-populate cache on application start:

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';

@Injectable()
export class CacheWarmer implements OnModuleInit {
  constructor(
    @Inject(CACHE_MANAGER) private cache: Cache,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    // Warm up frequently accessed data
    await this.warmUserCache();
    await this.warmConfigCache();
  }

  private async warmUserCache() {
    const topUsers = await this.prisma.user.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' },
    });

    for (const user of topUsers) {
      await this.cache.set(`user:${user.id}`, user, 3600);
    }
  }

  private async warmConfigCache() {
    const config = await this.getAppConfig();
    await this.cache.set('app:config', config, 86400);
  }
}
```

## Monitoring Cache Performance

```typescript
@Injectable()
export class CacheMetrics {
  private hits = 0;
  private misses = 0;

  recordHit() {
    this.hits++;
  }

  recordMiss() {
    this.misses++;
  }

  getHitRate() {
    const total = this.hits + this.misses;
    return total > 0 ? (this.hits / total) * 100 : 0;
  }

  getStats() {
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: this.getHitRate(),
    };
  }
}
```

## Best Practices

### ✅ DO

- Use consistent key naming conventions
- Set appropriate TTL for different data types
- Invalidate cache on updates/deletes
- Cache expensive database queries
- Monitor cache hit rates
- Use cache for rate limiting
- Implement cache warming for critical data

### ❌ DON'T

- Cache sensitive data (passwords, tokens) without encryption
- Use overly long TTLs for frequently changing data
- Cache entire large datasets
- Forget to handle cache failures gracefully
- Use cache as primary data store

## Redis Commands

Useful Redis CLI commands for debugging:

```bash
# Connect to Redis
redis-cli

# List all keys
KEYS *

# Get value
GET user:123

# Delete key
DEL user:123

# Delete pattern
KEYS users:* | xargs redis-cli DEL

# Check TTL
TTL user:123

# Flush all cache
FLUSHALL
```

## Docker Setup

**File:** `backend/docker-compose.yml`

```yaml
services:
  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes

volumes:
  redis-data:
```

**Start Redis:**
```bash
docker-compose up -d redis
```

<!-- AUTO-GENERATED: END -->
