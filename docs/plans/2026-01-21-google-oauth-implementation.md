# Google OAuth Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implementar Google OAuth en el template mobile, listo para usar con solo agregar credenciales.

**Architecture:** Backend valida tokens de Google usando Firebase Admin SDK y emite JWTs propios. Mobile usa @react-native-google-signin para autenticación nativa, almacena tokens en MMKV, y maneja refresh automático con interceptores Axios.

**Tech Stack:** NestJS + Firebase Admin | Expo + @react-native-google-signin + MMKV + Zustand

**Diseño:** Ver `docs/plans/2026-01-21-google-oauth-design.md`

---

## Task 1: Limpiar Schema Prisma

**Files:**
- Modify: `backend/prisma/schema.prisma`

**Step 1: Reemplazar schema completo**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  USER
  ADMIN
}

model User {
  id             String   @id @default(uuid())
  email          String   @unique

  // OAuth
  provider       String   @default("google")
  providerId     String?  @map("provider_id")

  // Profile
  firstName      String?  @map("first_name")
  lastName       String?  @map("last_name")
  avatarUrl      String?  @map("avatar_url")

  // State
  role           Role     @default(USER)
  hasCompletedOnboarding Boolean @default(false) @map("has_completed_onboarding")

  // Audit
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")
  deletedAt      DateTime? @map("deleted_at")

  // Relations
  refreshTokens  RefreshToken[]

  @@unique([provider, providerId])
  @@index([email])
  @@map("users")
}

model RefreshToken {
  id        String    @id @default(uuid())
  token     String    @unique
  userId    String    @map("user_id")
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime  @map("expires_at")
  createdAt DateTime  @default(now()) @map("created_at")
  revokedAt DateTime? @map("revoked_at")

  @@index([userId])
  @@index([token])
  @@map("refresh_tokens")
}
```

**Step 2: Crear migración**

Run: `cd backend && npx prisma migrate dev --name clean_schema_oauth`

**Step 3: Generar cliente**

Run: `cd backend && npx prisma generate`

**Step 4: Commit**

```bash
git add backend/prisma/
git commit -m "refactor(prisma): clean schema for OAuth-first auth"
```

---

## Task 2: Instalar Firebase Admin en Backend

**Files:**
- Modify: `backend/package.json`
- Modify: `backend/.env.example`

**Step 1: Instalar dependencia**

Run: `cd backend && npm install firebase-admin`

**Step 2: Agregar variables a .env.example**

Agregar al final del archivo:

```env
# Firebase Admin SDK (for Google OAuth token validation)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

**Step 3: Commit**

```bash
git add backend/package.json backend/package-lock.json backend/.env.example
git commit -m "chore(backend): add firebase-admin dependency"
```

---

## Task 3: Crear Firebase Config en Backend

**Files:**
- Create: `backend/src/core/config/firebase.config.ts`
- Modify: `backend/src/core/config/index.ts`

**Step 1: Crear archivo de configuración Firebase**

```typescript
// backend/src/core/config/firebase.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('firebase', () => ({
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
}));
```

**Step 2: Exportar desde index**

Agregar al archivo `backend/src/core/config/index.ts`:

```typescript
export { default as firebaseConfig } from './firebase.config';
```

**Step 3: Commit**

```bash
git add backend/src/core/config/
git commit -m "feat(config): add Firebase configuration"
```

---

## Task 4: Crear Firebase Admin Service

**Files:**
- Create: `backend/src/modules/auth/lib/firebase-admin.ts`

**Step 1: Crear servicio de Firebase Admin**

```typescript
// backend/src/modules/auth/lib/firebase-admin.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseAdminService implements OnModuleInit {
  private app: admin.app.App;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const projectId = this.configService.get<string>('firebase.projectId');
    const clientEmail = this.configService.get<string>('firebase.clientEmail');
    const privateKey = this.configService.get<string>('firebase.privateKey');

    if (!projectId || !clientEmail || !privateKey) {
      console.warn('[FirebaseAdmin] Missing Firebase credentials - Google OAuth will not work');
      return;
    }

    this.app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }

  async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    if (!this.app) {
      throw new Error('Firebase Admin not initialized');
    }
    return admin.auth().verifyIdToken(idToken);
  }
}
```

**Step 2: Commit**

```bash
git add backend/src/modules/auth/lib/
git commit -m "feat(auth): add Firebase Admin service for token verification"
```

---

## Task 5: Crear DTO para Google Auth

**Files:**
- Create: `backend/src/modules/auth/dto/google-auth.dto.ts`
- Modify: `backend/src/modules/auth/dto/index.ts`

**Step 1: Crear DTO**

```typescript
// backend/src/modules/auth/dto/google-auth.dto.ts
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const GoogleAuthSchema = z.object({
  idToken: z.string().min(1, 'ID token is required'),
});

export class GoogleAuthDto extends createZodDto(GoogleAuthSchema) {}
```

**Step 2: Actualizar index.ts**

Reemplazar contenido de `backend/src/modules/auth/dto/index.ts`:

```typescript
export * from './google-auth.dto';
```

**Step 3: Eliminar auth.dto.ts antiguo**

Run: `rm backend/src/modules/auth/dto/auth.dto.ts`

**Step 4: Commit**

```bash
git add backend/src/modules/auth/dto/
git commit -m "feat(auth): add Google auth DTO, remove email/password DTOs"
```

---

## Task 6: Actualizar Auth Service

**Files:**
- Modify: `backend/src/modules/auth/auth.service.ts`

**Step 1: Reemplazar auth.service.ts completo**

```typescript
// backend/src/modules/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../core/database/prisma.service';
import { FirebaseAdminService } from './lib/firebase-admin';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly firebaseAdmin: FirebaseAdminService,
  ) {}

  async loginWithGoogle(idToken: string) {
    // 1. Verify token with Firebase
    const decodedToken = await this.firebaseAdmin.verifyIdToken(idToken);

    if (!decodedToken.email) {
      throw new UnauthorizedException('Email not provided by Google');
    }

    // 2. Find or create user
    const user = await this.prisma.user.upsert({
      where: { email: decodedToken.email },
      create: {
        email: decodedToken.email,
        provider: 'google',
        providerId: decodedToken.uid,
        firstName: decodedToken.name?.split(' ')[0] || null,
        lastName: decodedToken.name?.split(' ').slice(1).join(' ') || null,
        avatarUrl: decodedToken.picture || null,
      },
      update: {
        providerId: decodedToken.uid,
        avatarUrl: decodedToken.picture || null,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        role: true,
        hasCompletedOnboarding: true,
        createdAt: true,
      },
    });

    // 3. Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user,
      ...tokens,
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        role: true,
        hasCompletedOnboarding: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  async completeOnboarding(userId: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { hasCompletedOnboarding: true },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        role: true,
        hasCompletedOnboarding: true,
      },
    });

    return user;
  }

  async refreshTokens(refreshToken: string) {
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

    // Revoke old token
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    const { user } = storedToken;
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return tokens;
  }

  async logout(refreshToken: string) {
    await this.prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { revokedAt: new Date() },
    });
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    const secret = this.configService.get<string>('jwt.secret');
    const expiresInStr = this.configService.get<string>('jwt.expiresIn') || '15m';
    const expiresIn = this.parseExpiryToSeconds(expiresInStr);

    const accessToken = this.jwtService.sign(payload, {
      secret,
      expiresIn,
    });

    const refreshToken = uuidv4();
    const refreshExpiresIn = this.configService.get<string>('jwt.refreshExpiresIn') || '7d';
    const expiresAt = new Date();
    const refreshSeconds = this.parseExpiryToSeconds(refreshExpiresIn);
    expiresAt.setSeconds(expiresAt.getSeconds() + refreshSeconds);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  private parseExpiryToSeconds(expiry: string): number {
    const match = expiry.match(/^(\d+)([dhms])$/);
    if (!match) return 900;

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 'd': return value * 86400;
      case 'h': return value * 3600;
      case 'm': return value * 60;
      case 's': return value;
      default: return 900;
    }
  }
}
```

**Step 2: Commit**

```bash
git add backend/src/modules/auth/auth.service.ts
git commit -m "feat(auth): implement Google OAuth login service"
```

---

## Task 7: Actualizar Auth Controller

**Files:**
- Modify: `backend/src/modules/auth/auth.controller.ts`

**Step 1: Reemplazar auth.controller.ts completo**

```typescript
// backend/src/modules/auth/auth.controller.ts
import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login or register with Google OAuth' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid token' })
  async loginWithGoogle(@Body() dto: GoogleAuthDto) {
    return this.authService.loginWithGoogle(dto.idToken);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMe(@CurrentUser('sub') userId: string) {
    return this.authService.getMe(userId);
  }

  @Patch('onboarding')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark onboarding as completed' })
  @ApiResponse({ status: 200, description: 'Onboarding completed' })
  async completeOnboarding(@CurrentUser('sub') userId: string) {
    return this.authService.completeOnboarding(userId);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshTokens(refreshToken);
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and revoke refresh token' })
  async logout(@Body('refreshToken') refreshToken: string) {
    await this.authService.logout(refreshToken);
    return { message: 'Logged out successfully' };
  }
}
```

**Step 2: Commit**

```bash
git add backend/src/modules/auth/auth.controller.ts
git commit -m "feat(auth): update controller with Google OAuth endpoints"
```

---

## Task 8: Actualizar Auth Module

**Files:**
- Modify: `backend/src/modules/auth/auth.module.ts`

**Step 1: Reemplazar auth.module.ts**

```typescript
// backend/src/modules/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { FirebaseAdminService } from './lib/firebase-admin';
import { DatabaseModule } from '../../core/database/database.module';

@Module({
  imports: [
    DatabaseModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): JwtModuleOptions => {
        const secret = configService.get<string>('jwt.secret');
        const expiresIn = configService.get<string>('jwt.expiresIn') || '15m';
        return {
          secret,
          signOptions: { expiresIn },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, FirebaseAdminService],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
```

**Step 2: Commit**

```bash
git add backend/src/modules/auth/auth.module.ts
git commit -m "feat(auth): register FirebaseAdminService in module"
```

---

## Task 9: Actualizar JWT Strategy

**Files:**
- Modify: `backend/src/modules/auth/strategies/jwt.strategy.ts`

**Step 1: Simplificar jwt.strategy.ts**

```typescript
// backend/src/modules/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptionsWithoutRequest } from 'passport-jwt';
import { PrismaService } from '../../../core/database/prisma.service';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secret = configService.get<string>('jwt.secret');

    const options: StrategyOptionsWithoutRequest = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    };

    super(options);
  }

  async validate(payload: JwtPayload) {
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub, deletedAt: null },
      select: { id: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
```

**Step 2: Commit**

```bash
git add backend/src/modules/auth/strategies/jwt.strategy.ts
git commit -m "refactor(auth): simplify JWT strategy"
```

---

## Task 10: Instalar Dependencias Mobile

**Files:**
- Modify: `mobile/package.json`

**Step 1: Instalar dependencias**

Run:
```bash
cd mobile && npm install @react-native-google-signin/google-signin @react-native-firebase/app @react-native-firebase/auth
```

**Step 2: Commit**

```bash
git add mobile/package.json mobile/package-lock.json
git commit -m "chore(mobile): add Google Sign-In and Firebase dependencies"
```

---

## Task 11: Configurar app.json para Firebase

**Files:**
- Modify: `mobile/app.json`

**Step 1: Actualizar app.json**

```json
{
  "expo": {
    "name": "mobile-template",
    "slug": "mobile-template",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "mobile-template",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourcompany.yourapp",
      "googleServicesFile": "./GoogleService-Info.plist"
    },
    "android": {
      "adaptiveIcon": {
        "backgroundColor": "#E6F4FE",
        "foregroundImage": "./assets/images/android-icon-foreground.png",
        "backgroundImage": "./assets/images/android-icon-background.png",
        "monochromeImage": "./assets/images/android-icon-monochrome.png"
      },
      "edgeToEdgeEnabled": true,
      "package": "com.yourcompany.yourapp",
      "googleServicesFile": "./google-services.json"
    },
    "web": {
      "output": "static",
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
      "expo-router",
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/splash-icon.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#ffffff",
          "dark": {
            "backgroundColor": "#000000"
          }
        }
      ],
      "@react-native-firebase/app",
      "@react-native-google-signin/google-signin"
    ],
    "experiments": {
      "typedRoutes": true,
      "reactCompiler": true
    }
  }
}
```

**Step 2: Commit**

```bash
git add mobile/app.json
git commit -m "feat(mobile): configure Firebase and Google Sign-In plugins"
```

---

## Task 12: Crear Google Sign-In Config

**Files:**
- Create: `mobile/src/shared/lib/google-signin.ts`

**Step 1: Crear archivo de configuración**

```typescript
// mobile/src/shared/lib/google-signin.ts
import { GoogleSignin } from '@react-native-google-signin/google-signin';

export function configureGoogleSignIn() {
  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  });
}

export const googleSignIn = {
  signIn: async () => {
    await GoogleSignin.hasPlayServices();
    return GoogleSignin.signIn();
  },

  getTokens: async () => {
    return GoogleSignin.getTokens();
  },

  signOut: async () => {
    try {
      await GoogleSignin.signOut();
    } catch {
      // Ignore sign out errors
    }
  },

  isSignedIn: async () => {
    return GoogleSignin.isSignedIn();
  },
};
```

**Step 2: Commit**

```bash
git add mobile/src/shared/lib/google-signin.ts
git commit -m "feat(mobile): add Google Sign-In configuration"
```

---

## Task 13: Actualizar Auth Types

**Files:**
- Modify: `mobile/src/features/auth/types/auth.types.ts`

**Step 1: Reemplazar tipos**

```typescript
// mobile/src/features/auth/types/auth.types.ts
export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  role: 'USER' | 'ADMIN';
  hasCompletedOnboarding: boolean;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface TokensResponse {
  accessToken: string;
  refreshToken: string;
}
```

**Step 2: Commit**

```bash
git add mobile/src/features/auth/types/
git commit -m "feat(auth): update types for Google OAuth"
```

---

## Task 14: Actualizar Auth Service Mobile

**Files:**
- Modify: `mobile/src/features/auth/services/auth.service.ts`

**Step 1: Reemplazar servicio**

```typescript
// mobile/src/features/auth/services/auth.service.ts
import { api } from '@/shared/lib/api';
import { googleSignIn } from '@/shared/lib/google-signin';
import type { AuthResponse, TokensResponse, User } from '../types/auth.types';

export const authApi = {
  loginWithGoogle: async (): Promise<AuthResponse> => {
    // Force account picker
    await googleSignIn.signOut();
    await googleSignIn.signIn();

    // Get idToken
    const { idToken } = await googleSignIn.getTokens();

    if (!idToken) {
      throw new Error('Login cancelled');
    }

    // Send to backend
    const response = await api.post<AuthResponse>('/auth/google', { idToken });
    return response.data;
  },

  refresh: async (refreshToken: string): Promise<TokensResponse> => {
    const response = await api.post<TokensResponse>('/auth/refresh', { refreshToken });
    return response.data;
  },

  logout: async (refreshToken: string): Promise<void> => {
    await api.post('/auth/logout', { refreshToken });
    await googleSignIn.signOut();
  },

  getMe: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  completeOnboarding: async (): Promise<User> => {
    const response = await api.patch<User>('/auth/onboarding');
    return response.data;
  },
};
```

**Step 2: Commit**

```bash
git add mobile/src/features/auth/services/
git commit -m "feat(auth): implement Google OAuth service"
```

---

## Task 15: Actualizar Auth Store (MMKV)

**Files:**
- Modify: `mobile/src/features/auth/stores/auth.store.ts`

**Step 1: Reemplazar store**

```typescript
// mobile/src/features/auth/stores/auth.store.ts
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { zustandStorage } from '@/shared/utils/storage';
import { googleSignIn } from '@/shared/lib/google-signin';
import type { User } from '../types/auth.types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  // Actions
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  setAccessToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      login: (user, accessToken, refreshToken) => {
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        });
      },

      logout: async () => {
        await googleSignIn.signOut();
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      updateUser: (userData) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...userData } });
        }
      },

      setAccessToken: (token) => {
        set({ accessToken: token });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);

// Selectors
export const selectUser = (state: AuthState) => state.user;
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated;
export const selectAccessToken = (state: AuthState) => state.accessToken;
export const selectRefreshToken = (state: AuthState) => state.refreshToken;
```

**Step 2: Commit**

```bash
git add mobile/src/features/auth/stores/
git commit -m "feat(auth): update store for Google OAuth with MMKV"
```

---

## Task 16: Actualizar API Client con Interceptors

**Files:**
- Modify: `mobile/src/shared/lib/api.ts`

**Step 1: Reemplazar api.ts**

```typescript
// mobile/src/shared/lib/api.ts
import axios from 'axios';
import { router } from 'expo-router';
import { useAuthStore } from '@/features/auth';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401 with token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const { refreshToken, logout, setAccessToken } = useAuthStore.getState();

      if (!refreshToken) {
        await logout();
        router.replace('/(auth)/login');
        return Promise.reject(error);
      }

      try {
        // Refresh tokens
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken: newToken } = response.data;

        // Update store
        setAccessToken(newToken);

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch {
        // Refresh failed, logout
        await logout();
        router.replace('/(auth)/login');
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);
```

**Step 2: Commit**

```bash
git add mobile/src/shared/lib/api.ts
git commit -m "feat(api): add token refresh interceptor"
```

---

## Task 17: Actualizar useAuth Hook

**Files:**
- Modify: `mobile/src/features/auth/hooks/useAuth.ts`

**Step 1: Reemplazar hook**

```typescript
// mobile/src/features/auth/hooks/useAuth.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { authApi } from '../services/auth.service';
import { useAuthStore } from '../stores/auth.store';

export function useGoogleLogin() {
  const login = useAuthStore((state) => state.login);

  return useMutation({
    mutationFn: authApi.loginWithGoogle,
    onSuccess: (data) => {
      login(data.user, data.accessToken, data.refreshToken);

      // Redirect based on onboarding status
      if (data.user.hasCompletedOnboarding) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(onboarding)/welcome');
      }
    },
  });
}

export function useLogout() {
  const { refreshToken, logout } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
      await logout();
    },
    onSuccess: () => {
      queryClient.clear();
      router.replace('/(auth)/login');
    },
  });
}

export function useCompleteOnboarding() {
  const updateUser = useAuthStore((state) => state.updateUser);

  return useMutation({
    mutationFn: authApi.completeOnboarding,
    onSuccess: (user) => {
      updateUser({ hasCompletedOnboarding: true });
      router.replace('/(tabs)');
    },
  });
}
```

**Step 2: Commit**

```bash
git add mobile/src/features/auth/hooks/
git commit -m "feat(auth): add Google login and onboarding hooks"
```

---

## Task 18: Crear GoogleSignInButton Component

**Files:**
- Create: `mobile/src/features/auth/components/GoogleSignInButton.tsx`
- Modify: `mobile/src/features/auth/components/index.ts`

**Step 1: Crear componente**

```typescript
// mobile/src/features/auth/components/GoogleSignInButton.tsx
import { Pressable, View, ActivityIndicator } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text } from '@/shared/components/ui';

interface GoogleSignInButtonProps {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export function GoogleSignInButton({
  onPress,
  loading = false,
  disabled = false,
}: GoogleSignInButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
        disabled && styles.buttonDisabled,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color="#1f1f1f" />
      ) : (
        <View style={styles.content}>
          <Text style={styles.icon}>G</Text>
          <Text style={styles.text}>Continuar con Google</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing(3),
    paddingHorizontal: theme.spacing(4),
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 48,
  },
  buttonPressed: {
    opacity: 0.8,
    backgroundColor: theme.colors.muted,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(2),
  },
  icon: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4285F4',
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f1f1f',
  },
}));
```

**Step 2: Actualizar index.ts**

```typescript
// mobile/src/features/auth/components/index.ts
export { GoogleSignInButton } from './GoogleSignInButton';
```

**Step 3: Commit**

```bash
git add mobile/src/features/auth/components/
git commit -m "feat(auth): add GoogleSignInButton component"
```

---

## Task 19: Actualizar Feature Index

**Files:**
- Modify: `mobile/src/features/auth/index.ts`

**Step 1: Actualizar exports**

```typescript
// mobile/src/features/auth/index.ts
export * from './components';
export * from './hooks/useAuth';
export * from './services/auth.service';
export * from './stores/auth.store';
export * from './types/auth.types';
```

**Step 2: Commit**

```bash
git add mobile/src/features/auth/index.ts
git commit -m "feat(auth): update feature exports"
```

---

## Task 20: Crear Onboarding Layout y Screens

**Files:**
- Create: `mobile/src/app/(onboarding)/_layout.tsx`
- Create: `mobile/src/app/(onboarding)/welcome.tsx`
- Create: `mobile/src/app/(onboarding)/profile.tsx`

**Step 1: Crear layout**

```typescript
// mobile/src/app/(onboarding)/_layout.tsx
import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    />
  );
}
```

**Step 2: Crear welcome screen**

```typescript
// mobile/src/app/(onboarding)/welcome.tsx
import { View } from 'react-native';
import { router } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';
import { Text, Button } from '@/shared/components/ui';
import { useAuthStore, selectUser } from '@/features/auth';

export default function WelcomeScreen() {
  const user = useAuthStore(selectUser);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>
          Bienvenido{user?.firstName ? `, ${user.firstName}` : ''}
        </Text>
        <Text style={styles.subtitle}>
          Estás a punto de comenzar. Configura tu perfil para personalizar tu experiencia.
        </Text>
      </View>

      <View style={styles.footer}>
        <Button onPress={() => router.push('/(onboarding)/profile')}>
          Continuar
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing(4),
    paddingTop: theme.spacing(16),
    paddingBottom: theme.spacing(8),
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.foreground,
    marginBottom: theme.spacing(2),
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.mutedForeground,
    lineHeight: 24,
  },
  footer: {
    paddingTop: theme.spacing(4),
  },
}));
```

**Step 3: Crear profile screen**

```typescript
// mobile/src/app/(onboarding)/profile.tsx
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text, Button } from '@/shared/components/ui';
import { useCompleteOnboarding } from '@/features/auth';

export default function ProfileScreen() {
  const { mutate: completeOnboarding, isPending } = useCompleteOnboarding();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Configura tu perfil</Text>
        <Text style={styles.subtitle}>
          Puedes personalizar esta pantalla según las necesidades de tu app.
        </Text>

        {/* Placeholder for profile form */}
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            Agrega aquí los campos de configuración del perfil
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          onPress={() => completeOnboarding()}
          loading={isPending}
        >
          Comenzar
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing(4),
    paddingTop: theme.spacing(16),
    paddingBottom: theme.spacing(8),
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.foreground,
    marginBottom: theme.spacing(2),
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.mutedForeground,
    marginBottom: theme.spacing(6),
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.spacing(4),
  },
  placeholderText: {
    fontSize: 14,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
  },
  footer: {
    paddingTop: theme.spacing(4),
  },
}));
```

**Step 4: Commit**

```bash
git add mobile/src/app/\(onboarding\)/
git commit -m "feat(mobile): add onboarding screens"
```

---

## Task 21: Actualizar Login Screen

**Files:**
- Modify: `mobile/src/app/(auth)/login.tsx`

**Step 1: Reemplazar login screen**

```typescript
// mobile/src/app/(auth)/login.tsx
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text } from '@/shared/components/ui';
import { GoogleSignInButton, useGoogleLogin } from '@/features/auth';

export default function LoginScreen() {
  const { mutate: loginWithGoogle, isPending, error } = useGoogleLogin();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bienvenido</Text>
        <Text style={styles.subtitle}>Inicia sesión para continuar</Text>
      </View>

      <View style={styles.content}>
        <GoogleSignInButton
          onPress={() => loginWithGoogle()}
          loading={isPending}
        />

        {error && (
          <Text style={styles.error}>
            Error al iniciar sesión. Intenta de nuevo.
          </Text>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Al continuar, aceptas nuestros términos y condiciones
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing(4),
    paddingTop: theme.spacing(16),
    paddingBottom: theme.spacing(8),
  },
  header: {
    marginBottom: theme.spacing(12),
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.foreground,
    marginBottom: theme.spacing(2),
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.mutedForeground,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: theme.spacing(4),
  },
  error: {
    fontSize: 14,
    color: theme.colors.destructive,
    textAlign: 'center',
  },
  footer: {
    paddingTop: theme.spacing(4),
  },
  footerText: {
    fontSize: 12,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
  },
}));
```

**Step 2: Commit**

```bash
git add mobile/src/app/\(auth\)/login.tsx
git commit -m "feat(auth): update login screen with Google Sign-In"
```

---

## Task 22: Actualizar Root Index (Redirect Logic)

**Files:**
- Modify: `mobile/src/app/index.tsx`

**Step 1: Actualizar redirect logic**

```typescript
// mobile/src/app/index.tsx
import { Redirect } from 'expo-router';
import { useAuthStore, selectUser, selectIsAuthenticated } from '@/features/auth';

export default function Index() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const user = useAuthStore(selectUser);

  // Not authenticated → Login
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  // Authenticated but no onboarding → Onboarding
  if (!user?.hasCompletedOnboarding) {
    return <Redirect href="/(onboarding)/welcome" />;
  }

  // Ready → Home
  return <Redirect href="/(tabs)" />;
}
```

**Step 2: Commit**

```bash
git add mobile/src/app/index.tsx
git commit -m "feat(mobile): update redirect logic with onboarding flow"
```

---

## Task 23: Inicializar Google Sign-In en Providers

**Files:**
- Modify: `mobile/src/app/providers.tsx`

**Step 1: Agregar inicialización de Google Sign-In**

Agregar al inicio del archivo (después de imports):

```typescript
import { configureGoogleSignIn } from '@/shared/lib/google-signin';

// Configure Google Sign-In
configureGoogleSignIn();
```

**Step 2: Commit**

```bash
git add mobile/src/app/providers.tsx
git commit -m "feat(mobile): initialize Google Sign-In in providers"
```

---

## Task 24: Actualizar .env.example Mobile

**Files:**
- Modify: `mobile/.env.example` (crear si no existe)

**Step 1: Crear/actualizar .env.example**

```env
# API
EXPO_PUBLIC_API_URL=http://localhost:3000

# Google Sign-In (from Firebase Console)
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=
```

**Step 2: Commit**

```bash
git add mobile/.env.example
git commit -m "docs(mobile): add environment variables example"
```

---

## Task 25: Crear Documentación de Setup

**Files:**
- Create: `docs/GOOGLE_AUTH_SETUP.md`

**Step 1: Crear documentación**

```markdown
# Google OAuth Setup Guide

Esta guía explica cómo configurar Google OAuth para un nuevo proyecto usando este template.

## Requisitos Previos

- Cuenta de Google/Firebase
- Expo CLI instalado
- Development build configurado (`npx expo prebuild`)

---

## 1. Crear Proyecto en Firebase

1. Ir a [Firebase Console](https://console.firebase.google.com/)
2. Crear nuevo proyecto
3. Ir a **Authentication** > **Sign-in method**
4. Habilitar **Google** como proveedor

---

## 2. Configurar App iOS

1. En Firebase Console, agregar app iOS
2. Usar el `bundleIdentifier` de `app.json`
3. Descargar `GoogleService-Info.plist`
4. Copiar archivo a `mobile/GoogleService-Info.plist`

---

## 3. Configurar App Android

1. En Firebase Console, agregar app Android
2. Usar el `package` de `app.json`
3. Generar SHA-1:
   ```bash
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android
   ```
4. Agregar SHA-1 en Firebase Console
5. Descargar `google-services.json`
6. Copiar archivo a `mobile/google-services.json`

---

## 4. Obtener Client IDs

En Firebase Console > Project Settings > Your apps:

- **Web Client ID**: Encontrar en la sección de configuración web
- **iOS Client ID**: En `GoogleService-Info.plist` buscar `CLIENT_ID`

---

## 5. Configurar Variables de Entorno

### Mobile (`mobile/.env.local`)

```env
EXPO_PUBLIC_API_URL=https://your-api.com
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=xxx.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=xxx.apps.googleusercontent.com
```

### Backend (`backend/.env`)

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

Para obtener las credenciales del backend:
1. Firebase Console > Project Settings > Service Accounts
2. Generate New Private Key
3. Copiar valores del JSON descargado

---

## 6. Rebuild del Proyecto

```bash
cd mobile
npx expo prebuild --clean
npx expo run:ios  # o run:android
```

---

## Troubleshooting

### iOS: "Google Sign-In cancelled"
- Verificar que `GoogleService-Info.plist` está en la ubicación correcta
- Verificar que el `bundleIdentifier` coincide con Firebase

### Android: "SHA-1 not found"
- Regenerar SHA-1 y agregarlo en Firebase Console
- Para producción, agregar también el SHA-1 del keystore de release

### Backend: "Firebase Admin not initialized"
- Verificar que las 3 variables de Firebase están configuradas
- Verificar que `FIREBASE_PRIVATE_KEY` tiene los `\n` escapados
```

**Step 2: Commit**

```bash
git add docs/GOOGLE_AUTH_SETUP.md
git commit -m "docs: add Google OAuth setup guide"
```

---

## Task 26: Limpiar Storage Utils (Remover SecureStore)

**Files:**
- Modify: `mobile/src/shared/utils/storage.ts`

**Step 1: Simplificar storage.ts**

```typescript
// mobile/src/shared/utils/storage.ts
/**
 * Storage utilities using MMKV
 * All operations are synchronous for better performance
 */

import { MMKV } from 'react-native-mmkv';
import { STORAGE_KEYS } from '@/constants';
import { ThemeMode } from '../hooks';

// ==================== MMKV INSTANCE ====================

const mmkv = new MMKV();

// ==================== GENERAL STORAGE ====================

export const storage = {
  // String operations
  getString: (key: string): string | undefined => {
    try {
      return mmkv.getString(key);
    } catch (error) {
      console.error(`[MMKV] getString error for key "${key}":`, error);
      return undefined;
    }
  },

  set: (key: string, value: string): void => {
    try {
      mmkv.set(key, value);
    } catch (error) {
      console.error(`[MMKV] set error for key "${key}":`, error);
    }
  },

  // Number operations
  getNumber: (key: string): number | undefined => {
    try {
      return mmkv.getNumber(key);
    } catch (error) {
      console.error(`[MMKV] getNumber error for key "${key}":`, error);
      return undefined;
    }
  },

  setNumber: (key: string, value: number): void => {
    try {
      mmkv.set(key, value);
    } catch (error) {
      console.error(`[MMKV] setNumber error for key "${key}":`, error);
    }
  },

  // Boolean operations
  getBoolean: (key: string): boolean | undefined => {
    try {
      return mmkv.getBoolean(key);
    } catch (error) {
      console.error(`[MMKV] getBoolean error for key "${key}":`, error);
      return undefined;
    }
  },

  setBoolean: (key: string, value: boolean): void => {
    try {
      mmkv.set(key, value);
    } catch (error) {
      console.error(`[MMKV] setBoolean error for key "${key}":`, error);
    }
  },

  // Utility operations
  remove: (key: string): void => {
    try {
      mmkv.delete(key);
    } catch (error) {
      console.error(`[MMKV] remove error for key "${key}":`, error);
    }
  },

  clearAll: (): void => {
    try {
      mmkv.clearAll();
    } catch (error) {
      console.error('[MMKV] clearAll error:', error);
    }
  },

  getAllKeys: (): string[] => {
    try {
      return mmkv.getAllKeys();
    } catch (error) {
      console.error('[MMKV] getAllKeys error:', error);
      return [];
    }
  },

  // Object operations (JSON)
  getObject: <T>(key: string): T | null => {
    try {
      const value = mmkv.getString(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`[Storage] getObject error for key "${key}":`, error);
      return null;
    }
  },

  setObject: <T>(key: string, value: T): void => {
    try {
      mmkv.set(key, JSON.stringify(value));
    } catch (error) {
      console.error(`[Storage] setObject error for key "${key}":`, error);
    }
  },
};

// ==================== APP PREFERENCES ====================

export const preferences = {
  // Theme
  getTheme: (): ThemeMode | null => {
    const theme = storage.getString(STORAGE_KEYS.THEME);
    return theme === 'light' || theme === 'dark' ? theme : null;
  },

  setTheme: (theme: ThemeMode): void => {
    storage.set(STORAGE_KEYS.THEME, theme);
  },

  removeTheme: (): void => {
    storage.remove(STORAGE_KEYS.THEME);
  },
};

// ==================== ZUSTAND STORAGE ADAPTER ====================

/**
 * Zustand persist middleware adapter for MMKV
 * Use: createJSONStorage(() => zustandStorage)
 */
export const zustandStorage = {
  getItem: (name: string): string | null => {
    return storage.getString(name) ?? null;
  },
  setItem: (name: string, value: string): void => {
    storage.set(name, value);
  },
  removeItem: (name: string): void => {
    storage.remove(name);
  },
};

// Export MMKV instance for advanced usage
export { mmkv };
```

**Step 2: Commit**

```bash
git add mobile/src/shared/utils/storage.ts
git commit -m "refactor(storage): simplify to MMKV only"
```

---

## Task 27: Limpiar Constants (Remover SecureStore keys)

**Files:**
- Modify: `mobile/src/constants/index.ts`

**Step 1: Actualizar STORAGE_KEYS**

Buscar y simplificar `STORAGE_KEYS` para remover claves de SecureStore:

```typescript
export const STORAGE_KEYS = {
  // App preferences
  THEME: 'theme',
  LANGUAGE: 'language',

  // Auth (managed by Zustand persist)
  AUTH_STORAGE: 'auth-storage',
} as const;
```

**Step 2: Commit**

```bash
git add mobile/src/constants/
git commit -m "refactor(constants): simplify storage keys"
```

---

## Task 28: Commit Final y Verificación

**Step 1: Verificar lint backend**

Run: `cd backend && npm run lint`

**Step 2: Verificar lint mobile**

Run: `cd mobile && npm run lint`

**Step 3: Commit final si hay cambios pendientes**

```bash
git add -A
git commit -m "chore: final cleanup for Google OAuth implementation"
```

---

## Resumen de Archivos

### Creados (8)
- `backend/src/core/config/firebase.config.ts`
- `backend/src/modules/auth/lib/firebase-admin.ts`
- `backend/src/modules/auth/dto/google-auth.dto.ts`
- `mobile/src/shared/lib/google-signin.ts`
- `mobile/src/features/auth/components/GoogleSignInButton.tsx`
- `mobile/src/app/(onboarding)/_layout.tsx`
- `mobile/src/app/(onboarding)/welcome.tsx`
- `mobile/src/app/(onboarding)/profile.tsx`
- `docs/GOOGLE_AUTH_SETUP.md`

### Modificados (15)
- `backend/prisma/schema.prisma`
- `backend/.env.example`
- `backend/src/core/config/index.ts`
- `backend/src/modules/auth/auth.module.ts`
- `backend/src/modules/auth/auth.controller.ts`
- `backend/src/modules/auth/auth.service.ts`
- `backend/src/modules/auth/strategies/jwt.strategy.ts`
- `mobile/package.json`
- `mobile/app.json`
- `mobile/src/features/auth/types/auth.types.ts`
- `mobile/src/features/auth/services/auth.service.ts`
- `mobile/src/features/auth/stores/auth.store.ts`
- `mobile/src/features/auth/hooks/useAuth.ts`
- `mobile/src/shared/lib/api.ts`
- `mobile/src/shared/utils/storage.ts`
- `mobile/src/app/index.tsx`
- `mobile/src/app/(auth)/login.tsx`
- `mobile/src/app/providers.tsx`

### Eliminados (1)
- `backend/src/modules/auth/dto/auth.dto.ts`
