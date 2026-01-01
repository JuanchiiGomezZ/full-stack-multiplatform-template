import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';

// Core modules
import { ConfigModule } from './core/config';
import { DatabaseModule } from './core/database';
import { CacheModule } from './core/cache';
import { ThrottlerModule } from './core/throttler';
import { AllExceptionsFilter } from './core/filters';
import { TransformInterceptor } from './core/interceptors';

// Shared modules
import { MailModule } from './shared/mail';
import { StorageModule } from './shared/storage';

// Feature modules
import { AuthModule, JwtAuthGuard, RolesGuard } from './modules/auth';
import { UsersModule } from './modules/users';

@Module({
  imports: [
    // Core
    ConfigModule,
    DatabaseModule,
    CacheModule,
    ThrottlerModule,

    // Shared
    MailModule,
    StorageModule,

    // Features
    AuthModule,
    UsersModule,
  ],
  providers: [
    // Global exception filter
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    // Global response transformer
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    // Global rate limiting
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Global JWT authentication
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Global roles authorization
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
